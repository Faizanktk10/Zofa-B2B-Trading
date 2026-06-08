using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ZofaB2B.API.Data;
using ZofaB2B.API.DTOs;
using ZofaB2B.API.Models;
using ZofaB2B.API.Services;

namespace ZofaB2B.API.Controllers
{
    [ApiController]
    [IgnoreAntiforgeryToken]
    [Route("api/subscriptions")]
    [EnableCors("AllowFrontend")]
    [Authorize]
    public class SubscriptionController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly SubscriptionService _subService;

        public SubscriptionController(AppDbContext db, SubscriptionService subService)
        {
            _db = db;
            _subService = subService;
        }

        private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // GET /api/subscriptions/plans
        [AllowAnonymous]
        [HttpGet("plans")]
        public IActionResult GetPlans()
        {
            return Ok(new[]
            {
                new { Plan = "Free", Price = 0, Features = new[] { "Browse RFQs", "1 quote/day", "No buyer contact", "Basic profile" } },
                new { Plan = "Premium Monthly", Price = 2500, Features = new[] { "Unlimited quotes/day", "Full buyer contact", "Priority listing", "Verified badge" } },
                new { Plan = "Premium Yearly", Price = 20000, Features = new[] { "All monthly features", "Save PKR 10,000/year" } },
                new { Plan = "Pay Per Lead", Price = 200, Features = new[] { "Unlock 1 buyer contact", "No subscription needed", "Pay only when needed" } }
            });
        }

        // GET /api/subscriptions/status
        [HttpGet("status")]
        public async Task<IActionResult> GetStatus()
        {
            var sub = await _db.Subscriptions
                .Where(s => s.UserId == CurrentUserId && s.IsActive && s.EndDate > DateTime.UtcNow)
                .OrderByDescending(s => s.EndDate)
                .FirstOrDefaultAsync();

            return Ok(new SubscriptionStatusDto
            {
                PlanType = sub?.PlanType ?? "Free",
                EndDate = sub?.EndDate,
                IsActive = sub != null
            });
        }

        // POST /api/subscriptions/upgrade
        [IgnoreAntiforgeryToken]
        [Authorize(Roles = "Supplier")]
        [HttpPost("upgrade")]
        public async Task<IActionResult> Upgrade(UpgradeSubscriptionDto dto)
        {
            decimal amount = dto.BillingCycle == "Yearly" ? 20000 : 2500;
            var endDate = dto.BillingCycle == "Yearly"
                ? DateTime.UtcNow.AddYears(1)
                : DateTime.UtcNow.AddMonths(1);

            // Create payment record (pending until admin confirms)
            var payment = new Payment
            {
                UserId = CurrentUserId,
                Type = "Subscription",
                Amount = amount,
                Plan = dto.PlanType ?? "Premium",
                Method = dto.PaymentMethod,
                ReferenceNo = dto.ReferenceNo,
                ProofImage = dto.ProofImage,
                Status = "Pending"
            };

            _db.Payments.Add(payment);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Payment submitted. Your account will be upgraded after admin confirmation.",
                paymentId = payment.PaymentId,
                amount
            });
        }
    }

    [ApiController]
    [IgnoreAntiforgeryToken]
    [Route("api/leads")]
    [EnableCors("AllowFrontend")]
    [Authorize(Roles = "Supplier")]
    public class LeadController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly SubscriptionService _subService;

        public LeadController(AppDbContext db, SubscriptionService subService)
        {
            _db = db;
            _subService = subService;
        }

        private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // POST /api/leads/unlock/{rfqId}
        [IgnoreAntiforgeryToken]
        [HttpPost("unlock/{rfqId}")]
        public async Task<IActionResult> Unlock(int rfqId, [FromBody] string paymentReference)
        {
            if (await _subService.HasUnlockedLeadAsync(CurrentUserId, rfqId))
                return BadRequest(new { message = "Already unlocked." });

            var rfq = await _db.RFQs.Include(r => r.Buyer).FirstOrDefaultAsync(r => r.RFQId == rfqId);
            if (rfq == null) return NotFound();

            var payment = new Payment
            {
                UserId = CurrentUserId,
                Type = "LeadUnlock",
                Amount = 200,
                Plan = "PayPerLead",
                Method = "Manual",
                ReferenceNo = paymentReference,
                Status = "Pending"
            };
            _db.Payments.Add(payment);

            var unlock = new LeadUnlock
            {
                SupplierId = CurrentUserId,
                RFQId = rfqId,
                AmountPaid = 200
            };
            _db.LeadUnlocks.Add(unlock);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Lead unlocked. Buyer contact details are now visible.",
                buyerEmail = rfq.Buyer.Email,
                buyerPhone = rfq.Buyer.Phone
            });
        }

        // GET /api/leads/unlocked
        [HttpGet("unlocked")]
        public async Task<IActionResult> GetUnlocked()
        {
            var unlocks = await _db.LeadUnlocks
                .Include(l => l.RFQ).ThenInclude(r => r.Buyer)
                .Where(l => l.SupplierId == CurrentUserId)
                .Select(l => new
                {
                    l.RFQId,
                    l.RFQ.Title,
                    BuyerEmail = l.RFQ.Buyer.Email,
                    BuyerPhone = l.RFQ.Buyer.Phone,
                    BuyerCompany = l.RFQ.Buyer.CompanyName,
                    l.UnlockedAt
                })
                .ToListAsync();

            return Ok(unlocks);
        }
    }
}
