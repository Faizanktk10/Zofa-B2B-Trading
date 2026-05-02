using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace ZofaB2B.API.Services
{
    public class EmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config) => _config = config;

        public async Task SendAsync(string toEmail, string toName, string subject, string htmlBody)
        {
            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(
                    _config["Email:FromName"]!,
                    _config["Email:FromAddress"]!));
                message.To.Add(new MailboxAddress(toName, toEmail));
                message.Subject = subject;
                message.Body = new TextPart("html") { Text = htmlBody };

                using var client = new SmtpClient();
                await client.ConnectAsync(_config["Email:Host"]!, int.Parse(_config["Email:Port"]!), SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(_config["Email:Username"]!, _config["Email:Password"]!);
                await client.SendAsync(message);
                await client.DisconnectAsync(true);
            }
            catch
            {
                // Email failure should never crash the app — log silently
            }
        }

        // ── Templates ──────────────────────────────────────────────

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
