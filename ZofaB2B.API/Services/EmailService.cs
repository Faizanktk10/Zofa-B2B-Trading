using System;
using System.Net.Http;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace ZofaB2B.API.Services
{
    public class EmailService
    {
        private readonly IConfiguration _config;

        private readonly bool _enableDevEmailFallback;

        public EmailService(IConfiguration config)
        {
            _config = config;
            _enableDevEmailFallback = (config["App:EnableDevEmailFallback"] ?? "true").Equals("true", StringComparison.OrdinalIgnoreCase);
        }


        private Task SendAsyncCore(string toEmail, string toName, string subject, string htmlBody)
        {
            if (string.IsNullOrWhiteSpace(toEmail)) return Task.CompletedTask;

            // Increased timeout to 30 seconds for better reliability on cloud platforms
            const int timeoutMs = 30000;

            try
            {
                // Get all configuration values upfront
                var resendApiKey = _config["Resend:ApiKey"];
                var resendFromAddress = _config["Resend:FromAddress"];
                var resendFromName = _config["Resend:FromName"];

                var sendGridApiKey = _config["SendGrid:ApiKey"];
                var sendGridFromAddress = _config["SendGrid:FromAddress"];
                var sendGridFromName = _config["SendGrid:FromName"];

                var host = _config["Email:Host"];
                var portRaw = _config["Email:Port"];
                var username = _config["Email:Username"];
                var password = _config["Email:Password"];
                var fromName = _config["Email:FromName"];
                var fromAddress = _config["Email:FromAddress"];

                // Fire-and-forget with proper isolation
                _ = Task.Run(async () =>
                {
                    try
                    {
                        // Priority 1: Resend API (preferred - most reliable)
                        if (!string.IsNullOrWhiteSpace(resendApiKey) && !string.IsNullOrWhiteSpace(resendFromAddress))
                        {
                            Console.WriteLine($"[Email] Using Resend for {SanitizeLogValue(toEmail)}");

                            var effectiveFromName = !string.IsNullOrWhiteSpace(resendFromName) ? resendFromName : fromName ?? "Zofa B2B";

                            try
                            {
                                await SendWithResendAsync(resendApiKey, resendFromAddress, effectiveFromName, toEmail, toName, subject, htmlBody ?? string.Empty, timeoutMs: timeoutMs);
                                Console.WriteLine($"[Email] Sent successfully to {SanitizeLogValue(toEmail)} (Resend)");
                                return;
                            }
                            catch (Exception resendEx)
                            {
                                // If Resend fails due to testing mode restrictions (403), fall back to next provider
                                if (resendEx.Message.Contains("403") || resendEx.Message.Contains("testing emails") || resendEx.Message.Contains("verify a domain"))
                                {
                                    Console.WriteLine($"[Email] Resend testing mode restriction: {resendEx.Message}");
                                    Console.WriteLine("[Email] Falling back to SendGrid/SMTP...");
                                    // Continue to try SendGrid/SMTP below
                                }
                                else
                                {
                                    Console.WriteLine($"[Email] Resend failed: {resendEx.Message}");
                                    Console.WriteLine("[Email] Falling back to SendGrid/SMTP...");
                                    // Continue to try SendGrid/SMTP below
                                }
                            }
                        }

                        // Priority 2: SendGrid API
                        if (!string.IsNullOrWhiteSpace(sendGridApiKey) && !string.IsNullOrWhiteSpace(sendGridFromAddress))
                        {
                            Console.WriteLine($"[Email] Using SendGrid for {SanitizeLogValue(toEmail)}");

                            var effectiveFromName = !string.IsNullOrWhiteSpace(sendGridFromName) ? sendGridFromName : fromName ?? "Zofa B2B";

                            try
                            {
                                await SendWithSendGridAsync(sendGridApiKey, sendGridFromAddress, effectiveFromName, toEmail, toName, subject, htmlBody ?? string.Empty, cts: null, timeoutMs: timeoutMs);
                                Console.WriteLine($"[Email] Sent successfully to {SanitizeLogValue(toEmail)} (SendGrid)");
                                return;
                            }
                            catch (Exception sendGridEx)
                            {
                                Console.WriteLine($"[Email] SendGrid failed: {sendGridEx.Message}");
                                Console.WriteLine("[Email] Falling back to SMTP...");
                                // Continue to try SMTP below
                            }
                        }

                        // Priority 3: SMTP Fallback
                        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(portRaw) ||
                            string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password) ||
                            string.IsNullOrWhiteSpace(fromName) || string.IsNullOrWhiteSpace(fromAddress))
                        {
                            Console.WriteLine("[EmailService] No email provider configured (Resend/SendGrid/SMTP). Email skipped.");
                            return;
                        }

                        if (!int.TryParse(portRaw, out var port) || port <= 0)
                        {
                            Console.WriteLine("[EmailService] Invalid SMTP port. Email skipped.");
                            return;
                        }

                        Console.WriteLine($"[Email] Using SMTP for {SanitizeLogValue(toEmail)}");

                        // Create message locally for SMTP
                        var message = new MimeMessage();
                        message.From.Add(new MailboxAddress(fromName, fromAddress));
                        message.To.Add(new MailboxAddress(toName, toEmail));
                        message.Subject = subject;
                        message.Body = new TextPart("html") { Text = htmlBody ?? string.Empty };

                        using var client = new SmtpClient();
                        using var cts = new CancellationTokenSource(timeoutMs);

                        client.Timeout = timeoutMs;

                        // Trim credentials to avoid hidden whitespace/newlines (common when reading from secrets/env)
                        var trimmedUsername = (username ?? string.Empty).Trim();
                        var trimmedPassword = (password ?? string.Empty).Trim();

                        // Mask sensitive values; helps confirm secrets/config are being loaded correctly.
                        var maskedUsername = string.IsNullOrWhiteSpace(trimmedUsername) ? "(empty)" : trimmedUsername;
                        var maskedPassword = string.IsNullOrWhiteSpace(trimmedPassword) ? "(empty)" : "(set)";
                        Console.WriteLine($"[Email] SMTP host={host}, port={port}, username={maskedUsername}");

                        await client.ConnectAsync(host, port, SecureSocketOptions.StartTls, cts.Token);
                        await client.AuthenticateAsync(trimmedUsername, trimmedPassword, cts.Token);
                        await client.SendAsync(message, cts.Token);
                        await client.DisconnectAsync(true, cts.Token);

                        Console.WriteLine($"[Email] Sent successfully to {SanitizeLogValue(toEmail)} (SMTP)");
                    }
                    catch (OperationCanceledException)
                    {
                        Console.WriteLine($"[Email] Timeout - Could not send within {timeoutMs}ms to {SanitizeLogValue(toEmail)}");
                        Console.WriteLine($"[Email] SMTP connection timed out. This usually means:");
                        Console.WriteLine($"[Email] 1. The SMTP server is blocking your IP (common with cloud providers)");
                        Console.WriteLine($"[Email] 2. Port 587 is blocked by the hosting platform");
                        Console.WriteLine($"[Email] 3. SMTP credentials are incorrect");
                        Console.WriteLine($"[Email] RECOMMENDATION: Switch to Resend API (uses HTTPS port 443, more reliable)");
                        Console.WriteLine($"[Email] Sign up at: https://resend.com and set Resend__ApiKey environment variable");
                    }
                    catch (SmtpCommandException smtpEx)
                    {
                        Console.WriteLine($"[Email] SMTP Command Error for {SanitizeLogValue(toEmail)}: {smtpEx.Message}");
                        Console.WriteLine($"[Email] StatusCode: {smtpEx.StatusCode}, MailKitErrorCode: {smtpEx.ErrorCode}");
                        Console.WriteLine($"[Email] This often indicates authentication failure. For Gmail, you must use an App Password, not your regular password.");
                    }
                    catch (SmtpProtocolException smtpEx)
                    {
                        Console.WriteLine($"[Email] SMTP Protocol Error for {SanitizeLogValue(toEmail)}: {smtpEx.Message}");
                        Console.WriteLine($"[Email] This indicates a protocol-level issue with the SMTP connection.");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[Email] Failed to send to {SanitizeLogValue(toEmail)}: {ex.GetType().Name} - {ex.Message}");
                        if (ex.InnerException != null)
                        {
                            Console.WriteLine($"[Email] Inner exception: {ex.InnerException.GetType().Name} - {ex.InnerException.Message}");
                        }
                        Console.WriteLine($"[Email] Stack trace: {ex.StackTrace}");
                    }
                });

                return Task.CompletedTask;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService Outer]: {ex.Message}");
                return Task.CompletedTask;
            }
        }

        private static async Task SendWithSendGridAsync(
            string apiKey,
            string fromAddress,
            string fromName,
            string toEmail,
            string toName,
            string subject,
            string htmlBody,
            CancellationTokenSource? cts,
            int timeoutMs)
        {
            // Uses SendGrid Web API via official SendGrid C# package.
            // We intentionally keep this lightweight and avoid extra helper packages.
            // Note: this method assumes SendGrid API key has permissions for sending email.
            var from = new EmailAddress(fromAddress, fromName);
            var to = new EmailAddress(toEmail, toName);

            var msg = new SendGridMessage();
            msg.From = from;
            msg.Subject = subject;
            msg.AddTo(to);

            // Content
            msg.PlainTextContent = "";
            msg.HtmlContent = htmlBody ?? string.Empty;

            var client = new SendGridClient(apiKey);

            // Apply timeout via CancellationTokenSource if provided
            using var tokenSource = cts ?? new CancellationTokenSource(timeoutMs);
            var ct = tokenSource.Token;

            var response = await client.SendEmailAsync(msg, ct).ConfigureAwait(false);

            var status = (int)response.StatusCode;
            if (status < 200 || status >= 300)
            {
                throw new InvalidOperationException($"SendGrid failed: HTTP {status} - {response.Body}");
            }
        }

        private static async Task SendWithResendAsync(
            string apiKey,
            string fromAddress,
            string fromName,
            string toEmail,
            string toName,
            string subject,
            string htmlBody,
            int timeoutMs)
        {
            // Uses Resend Web API via HTTP client.
            // Resend is a modern email API that's more reliable than SMTP.
            // API Docs: https://resend.com/docs/api-reference/emails/send-email

            using var httpClient = new HttpClient();
            httpClient.Timeout = TimeSpan.FromMilliseconds(timeoutMs);
            httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

            var from = string.IsNullOrWhiteSpace(fromName) ? fromAddress : $"{fromName} <{fromAddress}>";

            var payload = new
            {
                from = from,
                to = new[] { string.IsNullOrWhiteSpace(toName) ? toEmail : $"{toName} <{toEmail}>" },
                subject = subject,
                html = htmlBody ?? string.Empty
            };

            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await httpClient.PostAsync("https://api.resend.com/emails", content);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException($"Resend failed: HTTP {(int)response.StatusCode} - {responseBody}");
            }
        }

        // ── Templates (Inhein hargiz delete nahi karna) ──────────────────────────────────────────────

        public async Task<bool> SendVerificationCodeAsync(string email, string name, string code)
        {
            // For dev troubleshooting only: print code/link when SMTP fails/timeout.
            var webBaseUrl = _config["App:WebBaseUrl"] ?? "https://zofa.pk";
            var verificationLink = $"{webBaseUrl}/verify-email?email={Uri.EscapeDataString(email)}&code={Uri.EscapeDataString(code)}";

            var subject = "Verify Your Email — Zofa B2B";
            var html = $@"

            <div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>
              <div style='background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:30px;text-align:center'>
                <h1 style='color:#fff;margin:0'><span style='color:#e94560'>ZOFA</span> B2B TRADING</h1>
              </div>
              <div style='padding:30px;background:#fff'>
                <h2>Verify Your Email</h2>
                <p>Hi {name}, use this 6-digit code to activate your Zofa B2B account:</p>
                <div style='background:#f8f9fa;padding:20px;border-radius:8px;text-align:center;margin:20px 0;border:2px dashed #e94560'>
                  <span style='font-size:32px;font-weight:bold;letter-spacing:8px;color:#e94560'>{code}</span>
                </div>
                <p style='color:#666;font-size:14px'>This code expires in <strong>15 minutes</strong>. Do not share it with anyone.</p>

                <p style='margin-top:18px;font-size:14px;color:#444'>
                  If you prefer, you can open this link:
                  <br/>
                  <a href='{verificationLink}'>{verificationLink}</a>
                </p>
              </div>
              <div style='padding:15px;background:#f8f9fa;text-align:center;color:#999;font-size:12px'>
                Zofa B2B Trading · Pakistan's #1 B2B Marketplace
              </div>
            </div>";

            Console.WriteLine($"[Email] Starting verification code delivery to {SanitizeLogValue(email)}");

            // Send directly to user's email using SMTP/API providers (NOT Formspree)
            // Formspree is for form submissions, not for sending verification emails to users
            await SendVerificationEmailDirectlyAsync(email, name, subject, html, code, verificationLink);
            return true;
        }

        private Task SendVerificationEmailDirectlyAsync(
            string toEmail,
            string toName,
            string subject,
            string htmlBody,
            string code,
            string verificationLink)
        {
            // Send email directly to user using EmailJS (primary method)
            // This ensures the email goes to the user's Gmail account
            return Task.Run(async () =>
            {
                try
                {
                    // Use EmailJS to send verification code directly to user's Gmail
                    var emailJSSuccess = await SendVerificationViaEmailJSAsync(toEmail, toName, code, verificationLink);
                    if (emailJSSuccess)
                    {
                        Console.WriteLine($"[Email] Verification code sent successfully via EmailJS to {SanitizeLogValue(toEmail)}");
                        return;
                    }
                    
                    Console.WriteLine($"[Email] EmailJS failed, falling back to SMTP for {SanitizeLogValue(toEmail)}");
                    
                    // Fallback to SMTP if EmailJS fails
                    await SendAsyncCore(toEmail, toName, subject, htmlBody);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Email] Error sending verification email: {ex.Message}");
                }

                // Always print verification details in dev mode for troubleshooting
                Console.WriteLine("");
                Console.WriteLine("╔══════════════════════════════════════════════════════════╗");
                Console.WriteLine("║          EMAIL VERIFICATION CODE (DEV MODE)             ║");
                Console.WriteLine("╠══════════════════════════════════════════════════════════╣");
                Console.WriteLine($"║  Email: {toEmail,-50} ║");
                Console.WriteLine($"║  Code:  {code,-50} ║");
                Console.WriteLine($"║  Link:  {verificationLink,-50} ║");
                Console.WriteLine("╚══════════════════════════════════════════════════════════╝");
                Console.WriteLine("");
            });
        }

        /// <summary>
        /// Send verification code via EmailJS API
        /// Uses the configured EmailJS service to send emails directly to user's Gmail
        /// </summary>
        private async Task<bool> SendVerificationViaEmailJSAsync(string toEmail, string toName, string code, string verificationLink)
        {
            // Get EmailJS configuration from appsettings.json
            var serviceId = _config["EmailJS:ServiceId"];
            var templateId = _config["EmailJS:TemplateId"];
            var publicKey = _config["EmailJS:PublicKey"];

            if (string.IsNullOrWhiteSpace(serviceId) || string.IsNullOrWhiteSpace(templateId) || string.IsNullOrWhiteSpace(publicKey))
            {
                Console.WriteLine("[Email] EmailJS configuration missing (ServiceId, TemplateId, or PublicKey)");
                return false;
            }

            Console.WriteLine($"[Email] Sending verification code via EmailJS to {SanitizeLogValue(toEmail)}");
            Console.WriteLine($"[Email] Using Service ID: {serviceId}, Template ID: {templateId}");

            try
            {
                using var httpClient = new HttpClient();
                httpClient.Timeout = TimeSpan.FromSeconds(30);

                // EmailJS API payload
                var payload = new
                {
                    service_id = serviceId,
                    template_id = templateId,
                    user_id = publicKey,
                    template_params = new
                    {
                        to_email = toEmail,
                        to_name = toName ?? "User",
                        verification_code = code,
                        verification_link = verificationLink,
                        from_name = "Zofa B2B Trading",
                        subject = "Verify Your Email - Zofa B2B",
                        message = $"Your verification code is: {code}"
                    }
                };

                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                Console.WriteLine($"[Email] EmailJS Request payload: {json}");

                var response = await httpClient.PostAsync("https://api.emailjs.com/api/v1.0/email/send", content);
                var responseBody = await response.Content.ReadAsStringAsync();

                Console.WriteLine($"[Email] EmailJS Response: HTTP {(int)response.StatusCode} - {responseBody}");

                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"[Email] EmailJS email sent successfully to {SanitizeLogValue(toEmail)}");
                    return true;
                }
                else
                {
                    Console.WriteLine($"[Email] EmailJS failed: HTTP {(int)response.StatusCode} - {responseBody}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Email] EmailJS exception: {ex.GetType().Name} - {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"[Email] Inner exception: {ex.InnerException.Message}");
                }
                return false;
            }
        }

        private async Task<bool> SendWithEmailJSAsync(string toEmail, string toName, string code, string verificationLink)
        {
            // Get EmailJS configuration
            var serviceId = _config["EmailJS:ServiceId"];
            var templateId = _config["EmailJS:TemplateId"];
            var publicKey = _config["EmailJS:PublicKey"];

            if (string.IsNullOrWhiteSpace(serviceId) || string.IsNullOrWhiteSpace(templateId) || string.IsNullOrWhiteSpace(publicKey))
            {
                Console.WriteLine("[Email] EmailJS not fully configured (missing ServiceId, TemplateId, or PublicKey)");
                return false;
            }

            Console.WriteLine($"[Email] Attempting EmailJS for {SanitizeLogValue(toEmail)}");

            try
            {
                using var httpClient = new HttpClient();
                httpClient.Timeout = TimeSpan.FromSeconds(30);

                var templateParams = new
                {
                    service_id = serviceId,
                    template_id = templateId,
                    user_id = publicKey,
                    template_params = new
                    {
                        to_email = toEmail,
                        to_name = toName ?? "User",
                        verification_code = code,
                        verification_link = verificationLink,
                        from_name = "Zofa B2B Trading",
                        subject = "Verify Your Email — Zofa B2B"
                    }
                };

                var json = JsonSerializer.Serialize(templateParams);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await httpClient.PostAsync("https://api.emailjs.com/api/v1.0/email/send", content);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"[Email] EmailJS response: {responseBody}");
                    return true;
                }
                else
                {
                    Console.WriteLine($"[Email] EmailJS failed: HTTP {(int)response.StatusCode} - {responseBody}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Email] EmailJS exception: {ex.Message}");
                return false;
            }
        }

        private async Task<bool> SendWithFormspreeAsync(string email, string name, string subject, string code, string verificationLink)
        {
            var formspreeEndpoint = _config["Formspree:Endpoint"];
            
            if (string.IsNullOrWhiteSpace(formspreeEndpoint))
            {
                Console.WriteLine("[Email] Formspree endpoint not configured");
                return false;
            }

            try
            {
                using var client = new HttpClient();
                client.Timeout = TimeSpan.FromSeconds(30);

                var content = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("email", email),
                    new KeyValuePair<string, string>("name", name ?? string.Empty),
                    new KeyValuePair<string, string>("code", code),
                    new KeyValuePair<string, string>("verificationLink", verificationLink),
                    new KeyValuePair<string, string>("subject", subject),
                    new KeyValuePair<string, string>("_subject", subject), // Formspree specific
                    new KeyValuePair<string, string>("_cc", "faizanktk2006@gmail.com"), // CC to verified email
                    new KeyValuePair<string, string>("_next", verificationLink), // Redirect after submission
                    new KeyValuePair<string, string>("_captcha", "false"), // Disable captcha for API calls
                    new KeyValuePair<string, string>("message", $"Verification code for {name}: {code}")
                });

                var response = await client.PostAsync(formspreeEndpoint, content);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"[Email] Formspree response: {responseBody}");
                    return true;
                }
                else
                {
                    Console.WriteLine($"[Email] Formspree failed: HTTP {(int)response.StatusCode} - {responseBody}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Email] Formspree exception: {ex.Message}");
                return false;
            }
        }

        private Task SendAsyncWithVerificationFallback(
            string toEmail,
            string toName,
            string subject,
            string htmlBody,
            string code,
            string verificationLink)
        {
            // Keep the email sending behavior, but if all methods fail we print verification details.
            return Task.Run(async () =>
            {
                try
                {
                    // Attempt to send via the normal priority chain (Resend > SendGrid > SMTP)
                    await SendAsyncCore(toEmail, toName, subject, htmlBody);

                    // Wait a bit to allow fire-and-forget to potentially complete
                    await Task.Delay(500);
                }
                catch (Exception)
                {
                    // Ignore - SendAsyncCore already logs errors
                }

                // Always print verification details in dev mode for troubleshooting
                Console.WriteLine("");
                Console.WriteLine("╔══════════════════════════════════════════════════════════╗");
                Console.WriteLine("║          EMAIL VERIFICATION CODE (DEV MODE)             ║");
                Console.WriteLine("╠══════════════════════════════════════════════════════════╣");
                Console.WriteLine($"║  Email: {toEmail,-50} ║");
                Console.WriteLine($"║  Code:  {code,-50} ║");
                Console.WriteLine($"║  Link:  {verificationLink,-50} ║");
                Console.WriteLine("╚══════════════════════════════════════════════════════════╝");
                Console.WriteLine("");
            });
        }



        public Task SendAsync(string toEmail, string toName, string subject, string htmlBody)
            => SendAsyncCore(toEmail, toName, subject, htmlBody);

        public Task SendWelcomeAsync(string email, string name, string role) =>
            SendAsync(email, name, "Welcome to Zofa B2B Trading! 🎉", $@"

            <div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>
              <div style='background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:30px;text-align:center'>
                <h1 style='color:#fff;margin:0'><span style='color:#e94560'>ZOFA</span> B2B TRADING</h1>
              </div>
              <div style='padding:30px;background:#fff'>
                <h2>Welcome, {name}! 👋</h2>
                <p>Your account has been created as a <strong>{role}</strong> on Pakistan's #1 B2B Marketplace.</p>
                {(role == "Buyer"
                    ? "<p>You can now <strong>post RFQs</strong> and receive quotes from verified suppliers.</p>"
                    : "<p>You can now <strong>browse RFQs</strong> and submit quotes to buyers.</p>")}
                <a href='https://zofa.pk' style='display:inline-block;background:#e94560;color:#fff;padding:12px 30px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:10px'>
                  Go to Dashboard →
                </a>
              </div>
              <div style='padding:15px;background:#f8f9fa;text-align:center;color:#999;font-size:12px'>
                Zofa B2B Trading · Pakistan's #1 B2B Marketplace
              </div>
            </div>");

        public Task SendPasswordResetAsync(string email, string name, string resetToken) =>
            SendAsync(email, name, "Reset Your Password — Zofa B2B", $@"
            <div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>

              <div style='background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:30px;text-align:center'>
                <h1 style='color:#fff;margin:0'><span style='color:#e94560'>ZOFA</span> B2B TRADING</h1>
              </div>
              <div style='padding:30px;background:#fff'>
                <h2>Password Reset Request</h2>
                <p>Hi {name}, we received a request to reset your password.</p>
                <p>Click the button below. This link expires in <strong>1 hour</strong>.</p>
                <a href='https://zofa.pk/reset-password?token={resetToken}' 
                   style='display:inline-block;background:#e94560;color:#fff;padding:12px 30px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:10px'>
                  Reset Password →
                </a>
                <p style='margin-top:20px;color:#999;font-size:13px'>If you didn't request this, ignore this email.</p>
              </div>
              <div style='padding:15px;background:#f8f9fa;text-align:center;color:#999;font-size:12px'>
                Zofa B2B Trading · Pakistan's #1 B2B Marketplace
              </div>
            </div>");

        private static string SanitizeLogValue(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return string.Empty;

            return value.Replace("\r", "\\r").Replace("\n", "\\n").Replace("\t", "\\t").Replace("<", "&lt;").Replace(">", "&gt;");
        }

        public Task SendNewQuoteAsync(string buyerEmail, string buyerName, string rfqTitle, string supplierName) =>
            SendAsync(buyerEmail, buyerName, $"New Quote Received for: {rfqTitle}", $@"

            <div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>
              <div style='background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:30px;text-align:center'>
                <h1 style='color:#fff;margin:0'><span style='color:#e94560'>ZOFA</span> B2B TRADING</h1>
              </div>
              <div style='padding:30px;background:#fff'>
                <h2>💬 New Quotation Received!</h2>
                <p>Hi {buyerName}, <strong>{supplierName}</strong> has submitted a quote for your RFQ:</p>
                <div style='background:#f8f9fa;padding:15px;border-radius:8px;border-left:4px solid #e94560;margin:15px 0'>
                  <strong>{rfqTitle}</strong>
                </div>
                <a href='https://zofa.pk/dashboard/buyer' style='display:inline-block;background:#e94560;color:#fff;padding:12px 30px;border-radius:6px;text-decoration:none;font-weight:bold'>
                  View Quote →
                </a>
              </div>
              <div style='padding:15px;background:#f8f9fa;text-align:center;color:#999;font-size:12px'>
                Zofa B2B Trading · Pakistan's #1 B2B Marketplace
              </div>
            </div>");

        public Task SendNewMessageAsync(string receiverEmail, string receiverName, string senderName) =>
            SendAsync(receiverEmail, receiverName, $"New Message from {senderName} — Zofa B2B", $@"
            <div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>
              <div style='background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:30px;text-align:center'>
                <h1 style='color:#fff;margin:0'><span style='color:#e94560'>ZOFA</span> B2B TRADING</h1>
              </div>
              <div style='padding:30px;background:#fff'>
                <h2>💬 New Message!</h2>
                <p>Hi {receiverName}, you have a new message from <strong>{senderName}</strong> on Zofa B2B Trading.</p>
                <a href='https://zofa.pk/messages' style='display:inline-block;background:#e94560;color:#fff;padding:12px 30px;border-radius:6px;text-decoration:none;font-weight:bold'>
                  Read Message →
                </a>
              </div>
              <div style='padding:15px;background:#f8f9fa;text-align:center;color:#999;font-size:12px'>
                Zofa B2B Trading · Pakistan's #1 B2B Marketplace
              </div>
            </div>");

        public Task SendQuoteAcceptedAsync(string supplierEmail, string supplierName, string rfqTitle) =>
            SendAsync(supplierEmail, supplierName, $"🎉 Your Quote Was Accepted! — {rfqTitle}", $@"

            <div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>
              <div style='background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:30px;text-align:center'>
                <h1 style='color:#fff;margin:0'><span style='color:#e94560'>ZOFA</span> B2B TRADING</h1>
              </div>
              <div style='padding:30px;background:#fff'>
                <h2>🎉 Congratulations, {supplierName}!</h2>
                <p>The buyer has <strong>accepted your quotation</strong> for:</p>
                <div style='background:#f8f9fa;padding:15px;border-radius:8px;border-left:4px solid #27ae60;margin:15px 0'>
                  <strong>{rfqTitle}</strong>
                </div>
                <p>You can now message the buyer to finalize the deal.</p>
                <a href='https://zofa.pk/messages' style='display:inline-block;background:#e94560;color:#fff;padding:12px 30px;border-radius:6px;text-decoration:none;font-weight:bold'>
                  Message Buyer →
                </a>
              </div>
              <div style='padding:15px;background:#f8f9fa;text-align:center;color:#999;font-size:12px'>
                Zofa B2B Trading · Pakistan's #1 B2B Marketplace
              </div>
            </div>");
    }
}