using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZofaB2B.API.Data;
using ZofaB2B.API.DTOs;
using ZofaB2B.API.Models;

namespace ZofaB2B.API.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _db;
        public AdminController(AppDbContext db) => _db = db;

        // GET /api/admin/dashboard
        [HttpGet("dashboard")]
        public async Task<IActionResult> Dashboard()
        {
            var now = DateTime.UtcNow;
            var monthStart = new DateTime(now.Year, now.Month, 1);

            return Ok(new AdminDashboardDto
            {
                TotalUsers = await _db.Users.CountAsync(u => u.Role != "Admin"),
                TotalBuyers = await _db.Users.CountAsync(u => u.Role == "Buyer"),
                TotalSuppliers = await _db.Users.CountAsync(u => u.Role == "Supplier"),
                TotalRFQs = await _db.RFQs.CountAsync(),
                OpenRFQs = await _db.RFQs.CountAsync(r => r.Status == "Open"),
                PendingPayments = await _db.Payments.CountAsync(p => p.Status == "Pending"),
                ActivePremiumUsers = await _db.Users.CountAsync(u => u.IsPremium && u.SubscriptionExpiry > now),
                TotalQuotations = await _db.Quotations.CountAsync(),
                MonthlyRevenue = await _db.Payments
                    .Where(p => p.Status == "Confirmed" && p.CreatedAt >= monthStart)
                    .SumAsync(p => (decimal?)p.Amount) ?? 0,
                PremiumSuppliers = await _db.Subscriptions
                    .CountAsync(s => s.IsActive && s.PlanType == "Premium" && s.EndDate > now)
            });
        }

        // GET /api/admin/stats — public stats for pricing page
        [AllowAnonymous]
        [HttpGet("stats")]
        public async Task<IActionResult> PublicStats()
        {
            var now = DateTime.UtcNow;
            return Ok(new
            {
                TotalBuyers = await _db.Users.CountAsync(u => u.Role == "Buyer"),
                TotalSuppliers = await _db.Users.CountAsync(u => u.Role == "Supplier"),
                TotalRFQs = await _db.RFQs.CountAsync(),
                TotalQuotations = await _db.Quotations.CountAsync()
            });
        }

        // GET /api/admin/users
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] string? role, [FromQuery] string? search)
        {
            var query = _db.Users.AsQueryable();
            if (!string.IsNullOrWhiteSpace(role)) query = query.Where(u => u.Role == role);
            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(u => u.FullName.Contains(search) || u.Email.Contains(search));

            var users = await query.Select(u => new
            {
                u.UserId, u.FullName, u.Email, u.Role, u.Phone,
                u.CompanyName, u.City, u.IsVerified, u.IsActive, u.CreatedAt,
                u.IsPremium, u.PlanType, u.SubscriptionExpiry
            }).ToListAsync();

            return Ok(users);
        }

        // PATCH /api/admin/users/{id}/ban
        [HttpPatch("users/{id}/ban")]
        public async Task<IActionResult> BanUser(int id, [FromBody] bool ban)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) return NotFound();
            user.IsActive = !ban;
            await _db.SaveChangesAsync();
            return Ok(new { message = ban ? "User banned." : "User unbanned." });
        }

        // PATCH /api/admin/users/{id}/verify
        [HttpPatch("users/{id}/verify")]
        public async Task<IActionResult> VerifyUser(int id)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) return NotFound();
            user.IsVerified = true;
            await _db.SaveChangesAsync();
            return Ok(new { message = "User verified." });
        }

        // GET /api/admin/rfqs
        [HttpGet("rfqs")]
        public async Task<IActionResult> GetRFQs([FromQuery] string? status)
        {
            var query = _db.RFQs.Include(r => r.Buyer).Include(r => r.Category).AsQueryable();
            if (!string.IsNullOrWhiteSpace(status)) query = query.Where(r => r.Status == status);

            var rfqs = await query.OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.RFQId, r.Title, r.Status, r.IsFeatured,
                    r.ViewCount, r.CreatedAt,
                    Category = r.Category.Name,
                    Buyer = r.Buyer.FullName,
                    BuyerEmail = r.Buyer.Email
                }).ToListAsync();

            return Ok(rfqs);
        }

        // PATCH /api/admin/rfqs/{id}/feature
        [HttpPatch("rfqs/{id}/feature")]
        public async Task<IActionResult> FeatureRFQ(int id, [FromBody] bool featured)
        {
            var rfq = await _db.RFQs.FindAsync(id);
            if (rfq == null) return NotFound();
            rfq.IsFeatured = featured;
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // GET /api/admin/payments
        [HttpGet("payments")]
        public async Task<IActionResult> GetPayments([FromQuery] string? status)
        {
            var query = _db.Payments.Include(p => p.User).AsQueryable();
            if (!string.IsNullOrWhiteSpace(status)) query = query.Where(p => p.Status == status);

            var payments = await query.OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    p.PaymentId, p.Type, p.Amount, p.Method,
                    p.Plan, p.Status, p.ReferenceNo, p.ProofImage, p.CreatedAt,
                    UserName = p.User.FullName,
                    UserEmail = p.User.Email,
                    UserPlan = p.User.PlanType,
                    p.UserId
                }).ToListAsync();

            return Ok(payments);
        }

        // PATCH /api/admin/payments/{id}/confirm?planType=Premium
        [HttpPatch("payments/{id}/confirm")]
        public async Task<IActionResult> ConfirmPayment(int id, [FromQuery] string? planType)
        {
            var payment = await _db.Payments.Include(p => p.User).FirstOrDefaultAsync(p => p.PaymentId == id);
            if (payment == null) return NotFound();

            payment.Status = "Confirmed";
            var approvedPlan = string.IsNullOrWhiteSpace(planType) ? payment.Plan : planType;
            approvedPlan = approvedPlan == "Star" ? "Star" : "Premium";

            // Activate subscription if it's a subscription payment
            if (payment.Type == "Subscription")
            {
                var existing = await _db.Subscriptions
                    .Where(s => s.UserId == payment.UserId && s.IsActive)
                    .ToListAsync();
                existing.ForEach(s => s.IsActive = false);

                // Determine billing cycle from amount
                var cycle = payment.Amount >= 20000 ? "Yearly" : "Monthly";
                var endDate = cycle == "Yearly" ? DateTime.UtcNow.AddYears(1) : DateTime.UtcNow.AddMonths(1);

                _db.Subscriptions.Add(new Subscription
                {
                    UserId = payment.UserId,
                    PlanType = approvedPlan,
                    BillingCycle = cycle,
                    StartDate = DateTime.UtcNow,
                    EndDate = endDate,
                    IsActive = true,
                    AmountPaid = payment.Amount
                });

                payment.User.IsPremium = true;
                payment.User.PlanType = approvedPlan;
                payment.User.SubscriptionExpiry = endDate;
            }

            await _db.SaveChangesAsync();
            return Ok(new { message = "Payment confirmed and subscription activated.", planType = approvedPlan });
        }

        // PATCH /api/admin/payments/{id}/reject
        [HttpPatch("payments/{id}/reject")]
        public async Task<IActionResult> RejectPayment(int id)
        {
            var payment = await _db.Payments.FindAsync(id);
            if (payment == null) return NotFound();
            payment.Status = "Rejected";
            await _db.SaveChangesAsync();
            return Ok(new { message = "Payment rejected." });
        }

        // PATCH /api/admin/users/{id}/subscription
        [HttpPatch("users/{id}/subscription")]
        public async Task<IActionResult> UpdateUserSubscription(int id, [FromBody] UpdateUserPlanDto dto)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) return NotFound();
            if (user.Role == "Admin") return BadRequest(new { message = "Admin plan cannot be changed." });

            if (dto.PlanType == "Free")
            {
                user.IsPremium = false;
                user.PlanType = "Free";
                user.SubscriptionExpiry = null;
            }
            else
            {
                var safeDays = dto.DurationDays <= 0 ? 30 : dto.DurationDays;
                user.IsPremium = true;
                user.PlanType = dto.PlanType == "Star" ? "Star" : "Premium";
                user.SubscriptionExpiry = DateTime.UtcNow.AddDays(safeDays);
            }

            await _db.SaveChangesAsync();
            return Ok(new
            {
                message = "User subscription updated.",
                user.UserId,
                user.IsPremium,
                user.PlanType,
                user.SubscriptionExpiry
            });
        }

        // GET /api/admin/suppliers/{id}/feature
        [HttpPatch("suppliers/{id}/feature")]
        public async Task<IActionResult> FeatureSupplier(int id, [FromBody] bool featured)
        {
            var profile = await _db.SupplierProfiles.FirstOrDefaultAsync(p => p.UserId == id);
            if (profile == null) return NotFound();
            profile.IsFeatured = featured;
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
