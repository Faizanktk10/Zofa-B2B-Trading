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
    [Route("api/rfqs")]
    [EnableCors("AllowFrontend")]
    public class RFQController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly SubscriptionService _subService;

        public RFQController(AppDbContext db, SubscriptionService subService)
        {
            _db = db;
            _subService = subService;
        }

        private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // GET /api/rfqs — public listing with search + filter
        [HttpGet]
        [ResponseCache(Duration = 60, Location = ResponseCacheLocation.Any, VaryByQueryKeys = new[] { "search", "categoryId", "city", "page", "pageSize" })]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? search,
            [FromQuery] int? categoryId,
            [FromQuery] string? city,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 50) pageSize = 50;

            var filtered = _db.RFQs
                .AsNoTracking()
                .Where(r => r.Status == "Open");

            if (!string.IsNullOrWhiteSpace(search))
                filtered = filtered.Where(r => r.Title.Contains(search) || r.Description.Contains(search));

            if (categoryId.HasValue)
                filtered = filtered.Where(r => r.CategoryId == categoryId);

            if (!string.IsNullOrWhiteSpace(city))
                filtered = filtered.Where(r => r.DeliveryCity != null && r.DeliveryCity.Contains(city));

            // Simple count on RFQs only — no joins or subqueries
            var total = await filtered.CountAsync();

            // Paginate first, then project with JOINs (Category, Buyer, Quotations)
            var items = await filtered
                .OrderByDescending(r => r.IsFeatured)
                .ThenByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .GroupJoin(
                    _db.Quotations.AsNoTracking(),
                    r => r.RFQId,
                    q => q.RFQId,
                    (r, quotes) => new RFQListDto
                    {
                        RFQId = r.RFQId,
                        BuyerId = r.BuyerId,
                        Title = r.Title,
                        Quantity = r.Quantity,
                        Unit = r.Unit,
                        DeliveryCity = r.DeliveryCity,
                        CategoryName = r.Category.Name,
                        Status = r.Status,
                        IsFeatured = r.IsFeatured,
                        QuotationCount = quotes.Count(),
                        CreatedAt = r.CreatedAt,
                        BuyerCompany = r.Buyer.CompanyName ?? r.Buyer.FullName
                    })
                .ToListAsync();

            return Ok(new { total, page, pageSize, items });
        }

        // GET /api/rfqs/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var rfq = await _db.RFQs
                .Include(r => r.Category)
                .Include(r => r.Buyer)
                .Include(r => r.Quotations)
                .FirstOrDefaultAsync(r => r.RFQId == id);

            if (rfq == null) return NotFound();

            // Increment view count
            rfq.ViewCount++;
            await _db.SaveChangesAsync();

            var dto = new RFQDetailDto
            {
                RFQId = rfq.RFQId,
                BuyerId = rfq.BuyerId,
                Title = rfq.Title,
                Description = rfq.Description,
                Quantity = rfq.Quantity,
                Unit = rfq.Unit,
                TargetPrice = rfq.TargetPrice,
                DeliveryCity = rfq.DeliveryCity,
                DeadlineDate = rfq.DeadlineDate,
                CategoryName = rfq.Category.Name,
                Status = rfq.Status,
                IsFeatured = rfq.IsFeatured,
                ViewCount = rfq.ViewCount,
                QuotationCount = rfq.Quotations.Count,
                CreatedAt = rfq.CreatedAt,
                BuyerCompany = rfq.Buyer.CompanyName ?? rfq.Buyer.FullName
            };

            // Show buyer contact only to premium suppliers or unlocked leads
            if (User.Identity?.IsAuthenticated == true)
            {
                var userId = CurrentUserId;
                var role = User.FindFirstValue(ClaimTypes.Role);

                if (role == "Supplier")
                {
                    bool isPremium = await _subService.IsPremiumAsync(userId);
                    bool hasUnlocked = await _subService.HasUnlockedLeadAsync(userId, id);

                    if (isPremium || hasUnlocked)
                    {
                        dto.BuyerEmail = rfq.Buyer.Email;
                        dto.BuyerPhone = rfq.Buyer.Phone;
                    }
                }
                else if (role == "Admin" || (role == "Buyer" && userId == rfq.BuyerId))
                {
                    dto.BuyerEmail = rfq.Buyer.Email;
                    dto.BuyerPhone = rfq.Buyer.Phone;
                }
            }

            return Ok(dto);
        }

        // GET /api/rfqs/my
        [Authorize(Roles = "Buyer")]
        [HttpGet("my")]
        public async Task<IActionResult> GetMyRFQs()
        {
            var rfqs = await _db.RFQs
                .AsNoTracking()
                .Where(r => r.BuyerId == CurrentUserId)
                .OrderByDescending(r => r.CreatedAt)
                .GroupJoin(
                    _db.Quotations.AsNoTracking(),
                    r => r.RFQId,
                    q => q.RFQId,
                    (r, quotes) => new RFQListDto
                    {
                        RFQId = r.RFQId,
                        BuyerId = r.BuyerId,
                        Title = r.Title,
                        Quantity = r.Quantity,
                        Unit = r.Unit,
                        DeliveryCity = r.DeliveryCity,
                        CategoryName = r.Category.Name,
                        Status = r.Status,
                        IsFeatured = r.IsFeatured,
                        QuotationCount = quotes.Count(),
                        CreatedAt = r.CreatedAt,
                        BuyerCompany = string.Empty
                    })
                .ToListAsync();

            return Ok(rfqs);
        }

        // POST /api/rfqs
        [IgnoreAntiforgeryToken]
        [Authorize(Roles = "Buyer")]
        [HttpPost]
        public async Task<IActionResult> Create(CreateRFQDto dto)
        {
            var rfq = new RFQ
            {
                BuyerId = CurrentUserId,
                CategoryId = dto.CategoryId,
                Title = dto.Title,
                Description = dto.Description,
                Quantity = dto.Quantity,
                Unit = dto.Unit,
                TargetPrice = dto.TargetPrice,
                DeliveryCity = dto.DeliveryCity,
                DeadlineDate = dto.DeadlineDate.HasValue
                    ? (dto.DeadlineDate.Value.Kind == DateTimeKind.Unspecified
                        ? DateTime.SpecifyKind(dto.DeadlineDate.Value, DateTimeKind.Utc)
                        : dto.DeadlineDate.Value.ToUniversalTime())
                    : DateTime.UtcNow
            };

            _db.RFQs.Add(rfq);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = rfq.RFQId }, new { rfq.RFQId });
        }

        // PUT /api/rfqs/{id}
        [IgnoreAntiforgeryToken]
        [Authorize(Roles = "Buyer")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, CreateRFQDto dto)
        {
            var rfq = await _db.RFQs.FirstOrDefaultAsync(r => r.RFQId == id && r.BuyerId == CurrentUserId);
            if (rfq == null) return NotFound();

            rfq.Title = dto.Title;
            rfq.Description = dto.Description;
            rfq.Quantity = dto.Quantity;
            rfq.Unit = dto.Unit;
            rfq.TargetPrice = dto.TargetPrice;
            rfq.DeliveryCity = dto.DeliveryCity;
            rfq.DeadlineDate = dto.DeadlineDate;
            rfq.CategoryId = dto.CategoryId;

            await _db.SaveChangesAsync();
            return NoContent();
        }

        // PATCH /api/rfqs/{id}/close
        [IgnoreAntiforgeryToken]
        [Authorize(Roles = "Buyer")]
        [HttpPatch("{id}/close")]
        public async Task<IActionResult> Close(int id)
        {
            var rfq = await _db.RFQs.FirstOrDefaultAsync(r => r.RFQId == id && r.BuyerId == CurrentUserId);
            if (rfq == null) return NotFound();
            rfq.Status = "Closed";
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // DELETE /api/rfqs/{id}
        [IgnoreAntiforgeryToken]
        [Authorize(Roles = "Buyer,Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var role = User.FindFirstValue(ClaimTypes.Role);
            var rfq = role == "Admin"
                ? await _db.RFQs.FirstOrDefaultAsync(r => r.RFQId == id)
                : await _db.RFQs.FirstOrDefaultAsync(r => r.RFQId == id && r.BuyerId == CurrentUserId);

            if (rfq == null) return NotFound();
            _db.RFQs.Remove(rfq);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
