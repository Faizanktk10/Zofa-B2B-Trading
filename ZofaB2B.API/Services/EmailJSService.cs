using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace ZofaB2B.API.Services
{
    public class EmailJSService
    {
        private readonly IConfiguration _config;
        private readonly string _serviceId;
        private readonly string _templateId;
        private readonly string _publicKey;
        private readonly string _gmailAddress;

        public EmailJSService(IConfiguration config)
        {
            _config = config;
            _serviceId = config["EmailJS:ServiceId"] ?? "service_2ccciqm";
            _templateId = config["EmailJS:TemplateId"] ?? "template_j2419fj";
            _publicKey = config["EmailJS:PublicKey"] ?? "0rpuOjkQdLmEVGOSP";
            _gmailAddress = config["EmailJS:GmailAddress"] ?? "faizanktk2006@gmail.com";
        }

        /// <summary>
        /// Send verification code email via EmailJS API
        /// </summary>
        public async Task<bool> SendVerificationCodeAsync(string toEmail, string toName, string code)
        {
            if (string.IsNullOrWhiteSpace(toEmail))
            {
                Console.WriteLine("[EmailJS] No email provided");
                return false;
            }

            var webBaseUrl = _config["App:WebBaseUrl"] ?? "https://zofa.pk";
            var verificationLink = $"{webBaseUrl}/verify-email?email={Uri.EscapeDataString(toEmail)}&code={Uri.EscapeDataString(code)}";

            Console.WriteLine($"[EmailJS] Sending verification code to {SanitizeLogValue(toEmail)}");

            try
            {
                using var httpClient = new HttpClient();
                httpClient.Timeout = TimeSpan.FromSeconds(30);

                var templateParams = new
                {
                    service_id = _serviceId,
                    template_id = _templateId,
                    user_id = _publicKey,
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
                    Console.WriteLine($"[EmailJS] Verification email sent successfully to {SanitizeLogValue(toEmail)}");
                    return true;
                }
                else
                {
                    Console.WriteLine($"[EmailJS] Failed to send email: HTTP {(int)response.StatusCode} - {responseBody}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailJS] Exception: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Send welcome email via EmailJS API
        /// </summary>
        public async Task<bool> SendWelcomeEmailAsync(string toEmail, string toName, string role)
        {
            if (string.IsNullOrWhiteSpace(toEmail))
            {
                Console.WriteLine("[EmailJS] No email provided for welcome email");
                return false;
            }

            Console.WriteLine($"[EmailJS] Sending welcome email to {SanitizeLogValue(toEmail)}");

            try
            {
                using var httpClient = new HttpClient();
                httpClient.Timeout = TimeSpan.FromSeconds(30);

                var templateParams = new
                {
                    service_id = _serviceId,
                    template_id = _templateId,
                    user_id = _publicKey,
                    template_params = new
                    {
                        to_email = toEmail,
                        to_name = toName ?? "User",
                        user_role = role,
                        from_name = "Zofa B2B Trading"
                    }
                };

                var json = JsonSerializer.Serialize(templateParams);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await httpClient.PostAsync("https://api.emailjs.com/api/v1.0/email/send", content);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"[EmailJS] Welcome email sent successfully to {SanitizeLogValue(toEmail)}");
                    return true;
                }
                else
                {
                    Console.WriteLine($"[EmailJS] Failed to send welcome email: HTTP {(int)response.StatusCode} - {responseBody}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailJS] Exception: {ex.Message}");
                return false;
            }
        }

        private static string SanitizeLogValue(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return string.Empty;

            return value.Replace("\r", "\\r").Replace("\n", "\\n").Replace("\t", "\\t");
        }
    }
}