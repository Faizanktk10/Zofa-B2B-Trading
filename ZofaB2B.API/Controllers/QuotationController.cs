using Microsoft.AspNetCore.Authorization;
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
    [Route("api/quotations")]
    [Authorize]
    public class QuotationController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly SubscriptionService _subService;
        private readonly EmailService _email;

        public QuotationController(AppDbContext db, SubscriptionService subService, EmailService email)
        {
            _db = db;
            _subService = subService;
            _email = email;
        }

        private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // POST /api/quotations — supplier submits quote
        [Authorize(Roles = "Supplier")]
        [HttpPost]
        public async Task<IActionResult> Submit(CreateQuotationDto dto)
        {
            var rfq = await _db.RFQs.FindAsync(dto.RFQId);
            if (rfq == null || rfq.Status != "Open")
                return BadRequest(new { message = "RFQ not found or not open." });

            // Check daily limit for free suppliers — 5 quotes per day
            bool isPremium = await _subService.IsPremiumAsync(CurrentUserId);
            if (!isPremium)
            {
                int todayCount = await _subService.GetTodayQuoteCountAsync(CurrentUserId);
                if (todayCount >= 5)
                    return BadRequest(new { message = "Free plan allows 5 quotes per day. Upgrade to Premium for unlimited quotes." });
            }

            // Prevent duplicate quote
            bool alreadyQuoted = await _db.Quotations
                .AnyAsync(q => q.RFQId == dto.RFQId && q.SupplierId == CurrentUserId);
            if (alreadyQuoted)
                return BadRequest(new { message = "You have already submitted a quote for this RFQ." });

            var quote = new Quotation
            {
                RFQId = dto.RFQId,
                SupplierId = CurrentUserId,
                UnitPrice = dto.UnitPrice,
                TotalPrice = dto.TotalPrice,
                DeliveryDays = dto.DeliveryDays,
                Message = dto.Message
            };

            _db.Quotations.Add(quote);
            await _db.SaveChangesAsync();

            // Email notification to buyer
            var rfqWithBuyer = await _db.RFQs.Include(r => r.Buyer).FirstAsync(r => r.RFQId == dto.RFQId);
            var supplier = await _db.Users.FindAsync(CurrentUserId);
            _ = _email.SendNewQuoteAsync(
                rfqWithBuyer.Buyer.Email,
                rfqWithBuyer.Buyer.FullName,
                rfqWithBuyer.Title,
                supplier?.CompanyName ?? supplier?.FullName ?? "A Supplier");

            return Ok(new { quote.QuotationId });
        }

        // GET /api/quotations/rfq/{rfqId} — buyer views quotes on their RFQ
        [Authorize(Roles = "Buyer")]
        [HttpGet("rfq/{rfqId}")]
        public async Task<IActionResult> GetByRFQ(int rfqId)
        {
            var rfq = await _db.RFQs.FindAsync(rfqId);
            if (rfq == null || rfq.BuyerId != CurrentUserId)
                return Forbid();

            var quotes = await _db.Quotations
                .Include(q => q.Supplier)
                .Where(q => q.RFQId == rfqId)
                .OrderByDescending(q => q.CreatedAt)
                .Select(q => new QuotationDto
                {
                    QuotationId = q.QuotationId,
                    RFQId = q.RFQId,
                    RFQTitle = q.RFQ.Title,
                    SupplierId = q.SupplierId,
                    SupplierName = q.Supplier.FullName,
                    SupplierCompany = q.Supplier.CompanyName,
                    BuyerId = q.RFQ.BuyerId,
                    UnitPrice = q.UnitPrice,
                    TotalPrice = q.TotalPrice,
                    DeliveryDays = q.DeliveryDays,
                    Message = q.Message,
                    Status = q.Status,
                    CreatedAt = q.CreatedAt
                })
                .ToListAsync();

            return Ok(quotes);
        }

        // GET /api/quotations/my — supplier views their submitted quotes
        [Authorize(Roles = "Supplier")]
        [HttpGet("my")]
        public async Task<IActionResult> GetMine()
        {
            var quotes = await _db.Quotations
                .Include(q => q.RFQ)
                .Where(q => q.SupplierId == CurrentUserId)
                .OrderByDescending(q => q.CreatedAt)
                .Select(q => new QuotationDto
                {
                    QuotationId = q.QuotationId,
                    RFQId = q.RFQId,
                    RFQTitle = q.RFQ.Title,
                    SupplierId = q.SupplierId,
                    SupplierName = q.Supplier.FullName,
                    SupplierCompany = q.Supplier.CompanyName,
                    BuyerId = q.RFQ.BuyerId,
                    UnitPrice = q.UnitPrice,
                    TotalPrice = q.TotalPrice,
                    DeliveryDays = q.DeliveryDays,
                    Message = q.Message,
                    Status = q.Status,
                    CreatedAt = q.CreatedAt
                })
                .ToListAsync();

            return Ok(quotes);
        }

        // PATCH /api/quotations/{id}/accept
        [Authorize(Roles = "Buyer")]
        [HttpPatch("{id}/accept")]
        public async Task<IActionResult> Accept(int id)
        {
            var quote = await _db.Quotations.Include(q => q.RFQ).FirstOrDefaultAsync(q => q.QuotationId == id);
            if (quote == null || quote.RFQ.BuyerId != CurrentUserId) return Forbid();

            quote.Status = "Accepted";
            quote.RFQ.Status = "Awarded";
            await _db.SaveChangesAsync();

            // Email notification to supplier
            var supplier = await _db.Users.FindAsync(quote.SupplierId);
            if (supplier != null)
                _ = _email.SendQuoteAcceptedAsync(supplier.Email, supplier.FullName, quote.RFQ.Title);

            return NoContent();
        }

        // PATCH /api/quotations/{id}/reject
        [Authorize(Roles = "Buyer")]
        [HttpPatch("{id}/reject")]
        public async Task<IActionResult> Reject(int id)
        {
            var quote = await _db.Quotations.Include(q => q.RFQ).FirstOrDefaultAsync(q => q.QuotationId == id);
            if (quote == null || quote.RFQ.BuyerId != CurrentUserId) return Forbid();

            quote.Status = "Rejected";
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
