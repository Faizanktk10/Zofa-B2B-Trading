using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ZofaB2B.API.Data;
using ZofaB2B.API.Models;
using ZofaB2B.API.Services;

namespace ZofaB2B.API.Controllers
{
    [ApiController]
    [Route("api/payments")]
    public class PaymentsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly CloudinaryService _cloudinary;
        private readonly EmailService _email;

        public PaymentsController(AppDbContext db, CloudinaryService cloudinary, EmailService email)
        {
            _db = db;
            _cloudinary = cloudinary;
            _email = email;
        }

        private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // POST /api/payments/submit-proof
        [Authorize(Roles = "Supplier")]
        [HttpPost("submit-proof")]
        public async Task<IActionResult> SubmitProof([FromBody] SubmitProofDto dto)
        {
            // Upload proof image to Cloudinary
            string? proofUrl = null;
            if (!string.IsNullOrWhiteSpace(dto.ProofImageBase64))
            {
                proofUrl = await _cloudinary.UploadBase64Async(dto.ProofImageBase64, "zofa/payments");
                if (proofUrl == null)
                    return StatusCode(500, new { message = "Image upload failed. Please try again." });
            }

            decimal amount = dto.BillingCycle == "Yearly" ? 20000 : 2500;

            var payment = new Payment
            {
                UserId = CurrentUserId,
                Type = "Subscription",
                Amount = amount,
                Plan = "Premium",
                Method = dto.PaymentMethod,
                ReferenceNo = dto.ReferenceNo,
                ProofImage = proofUrl,
                Status = "Pending"
            };

            _db.Payments.Add(payment);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Payment proof submitted. Your account will be upgraded within 2 hours after admin verification.",
                paymentId = payment.PaymentId,
                amount
            });
        }

        // GET /api/payments/my — supplier sees their own payment history
        [Authorize(Roles = "Supplier")]
        [HttpGet("my")]
        public async Task<IActionResult> MyPayments()
        {
            var payments = await _db.Payments
                .Where(p => p.UserId == CurrentUserId)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    p.PaymentId, p.Type, p.Amount, p.Method,
                    p.Plan, p.Status, p.ReferenceNo, p.CreatedAt
                })
                .ToListAsync();

            return Ok(payments);
        }

        // PATCH /api/payments/{id}/approve — Admin only
        [Authorize(Roles = "Admin")]
        [HttpPatch("{id}/approve")]
        public async Task<IActionResult> Approve(int id)
        {
            var payment = await _db.Payments
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.PaymentId == id);

            if (payment == null) return NotFound();
            if (payment.Status == "Confirmed")
                return BadRequest(new { message = "Payment already approved." });

            payment.Status = "Confirmed";

            // Deactivate old subscriptions
            var oldSubs = await _db.Subscriptions
                .Where(s => s.UserId == payment.UserId && s.IsActive)
                .ToListAsync();
            oldSubs.ForEach(s => s.IsActive = false);

            var cycle = payment.Amount >= 20000 ? "Yearly" : "Monthly";
            var endDate = cycle == "Yearly"
                ? DateTime.UtcNow.AddYears(1)
                : DateTime.UtcNow.AddMonths(1);

            _db.Subscriptions.Add(new Subscription
            {
                UserId = payment.UserId,
                PlanType = "Premium",
                BillingCycle = cycle,
                StartDate = DateTime.UtcNow,
                EndDate = endDate,
                IsActive = true,
                AmountPaid = payment.Amount
            });

            payment.User.IsPremium = true;
            payment.User.PlanType = "Premium";
            payment.User.SubscriptionExpiry = endDate;

            await _db.SaveChangesAsync();

            // Notify supplier
            _ = _email.SendAsync(
                payment.User.Email,
                payment.User.FullName,
                "🎉 Your Premium Plan is Now Active — Zofa B2B",
                $@"<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>
                  <div style='background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:30px;text-align:center'>
                    <h1 style='color:#fff;margin:0'><span style='color:#e94560'>ZOFA</span> B2B TRADING</h1>
                  </div>
                  <div style='padding:30px;background:#fff'>
                    <h2>🎉 Premium Activated!</h2>
                    <p>Hi {payment.User.FullName}, your <strong>Premium Plan</strong> is now active.</p>
                    <p>Valid until: <strong>{endDate:dd MMM yyyy}</strong></p>
                    <ul>
                      <li>✅ Unlimited quotes per day</li>
                      <li>✅ Priority listing</li>
                      <li>✅ Verified Premium badge</li>
                    </ul>
                    <a href='https://zofa.pk/dashboard/supplier' style='display:inline-block;background:#e94560;color:#fff;padding:12px 30px;border-radius:6px;text-decoration:none;font-weight:bold'>
                      Go to Dashboard →
                    </a>
                  </div>
                </div>");

            return Ok(new
            {
                message = "Payment approved and Premium plan activated.",
                userId = payment.UserId,
                validUntil = endDate
            });
        }

        // PATCH /api/payments/{id}/reject — Admin only
        [Authorize(Roles = "Admin")]
        [HttpPatch("{id}/reject")]
        public async Task<IActionResult> Reject(int id)
        {
            var payment = await _db.Payments.Include(p => p.User).FirstOrDefaultAsync(p => p.PaymentId == id);
            if (payment == null) return NotFound();

            payment.Status = "Rejected";
            await _db.SaveChangesAsync();

            _ = _email.SendAsync(
                payment.User.Email,
                payment.User.FullName,
                "Payment Proof Rejected — Zofa B2B",
                $@"<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>
                  <div style='padding:30px;background:#fff'>
                    <h2>Payment Not Verified</h2>
                    <p>Hi {payment.User.FullName}, unfortunately your payment proof could not be verified.</p>
                    <p>Please resubmit with a clear screenshot of your transaction.</p>
                    <a href='https://zofa.pk/upgrade' style='display:inline-block;background:#e94560;color:#fff;padding:12px 30px;border-radius:6px;text-decoration:none;font-weight:bold'>
                      Resubmit Payment →
                    </a>
                  </div>
                </div>");

            return Ok(new { message = "Payment rejected." });
        }
    }

    public class SubmitProofDto
    {
        public string BillingCycle { get; set; } = "Monthly";
        public string PaymentMethod { get; set; } = "Bank Transfer";
        public string ReferenceNo { get; set; } = string.Empty;
        public string? ProofImageBase64 { get; set; }
    }
}
