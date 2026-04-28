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
    [Route("api/rfqs")]
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
        public async Task<IActionResult> GetAll(
            [FromQuery] string? search,
            [FromQuery] int? categoryId,
            [FromQuery] string? city,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var query = _db.RFQs
                .Include(r => r.Category)
                .Include(r => r.Buyer)
                .Include(r => r.Quotations)
                .Where(r => r.Status == "Open")
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(r => r.Title.Contains(search) || r.Description.Contains(search));

            if (categoryId.HasValue)
                query = query.Where(r => r.CategoryId == categoryId);

            if (!string.IsNullOrWhiteSpace(city))
                query = query.Where(r => r.DeliveryCity != null && r.DeliveryCity.Contains(city));

            // Featured first, then newest
            query = query.OrderByDescending(r => r.IsFeatured).ThenByDescending(r => r.CreatedAt);

            var total = await query.CountAsync();
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new RFQListDto
                {
                    RFQId = r.RFQId,
                    Title = r.Title,
                    Quantity = r.Quantity,
                    Unit = r.Unit,
                    DeliveryCity = r.DeliveryCity,
                    CategoryName = r.Category.Name,
                    Status = r.Status,
                    IsFeatured = r.IsFeatured,
                    QuotationCount = r.Quotations.Count,
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
                .Include(r => r.Category)
                .Include(r => r.Quotations)
                .Where(r => r.BuyerId == CurrentUserId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new RFQListDto
                {
                    RFQId = r.RFQId,
                    Title = r.Title,
                    Quantity = r.Quantity,
                    Unit = r.Unit,
                    DeliveryCity = r.DeliveryCity,
                    CategoryName = r.Category.Name,
                    Status = r.Status,
                    IsFeatured = r.IsFeatured,
                    QuotationCount = r.Quotations.Count,
                    CreatedAt = r.CreatedAt,
                    BuyerCompany = string.Empty
                })
                .ToListAsync();

            return Ok(rfqs);
        }

        // POST /api/rfqs
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
                DeadlineDate = dto.DeadlineDate
            };

            _db.RFQs.Add(rfq);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = rfq.RFQId }, new { rfq.RFQId });
        }

        // PUT /api/rfqs/{id}
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
        [Authorize(Roles = "Buyer,Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var role = User.FindFirstValue(ClaimTypes.Role);
            var rfq = role == "Admin"
                ? await _db.RFQs.FindAsync(id)
                : await _db.RFQs.FirstOrDefaultAsync(r => r.RFQId == id && r.BuyerId == CurrentUserId);

            if (rfq == null) return NotFound();
            _db.RFQs.Remove(rfq);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
