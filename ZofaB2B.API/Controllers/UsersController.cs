using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ZofaB2B.API.Data;
using ZofaB2B.API.DTOs;
using ZofaB2B.API.Services;

namespace ZofaB2B.API.Controllers
{
    [ApiController]
    [IgnoreAntiforgeryToken]
    [Route("api/users")]
    [EnableCors("AllowFrontend")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly SubscriptionService _subService;

        public UsersController(AppDbContext db, SubscriptionService subService)
        {
            _db = db;
            _subService = subService;
        }

        private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // GET /api/users/me
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetMe()
        {
            var user = await _db.Users
                .Include(u => u.SupplierProfile)
                .FirstOrDefaultAsync(u => u.UserId == CurrentUserId);
            if (user == null) return NotFound();

            var plan = await _subService.GetActivePlanAsync(CurrentUserId);

            return Ok(new
            {
                user.UserId, user.FullName, user.Email, user.Phone,
                user.Role, user.City, user.Province, user.CompanyName,
                user.IsVerified, Plan = plan,
                BusinessType = user.SupplierProfile?.BusinessType,
                YearsInBusiness = user.SupplierProfile?.YearsInBusiness ?? 0,
                Description = user.SupplierProfile?.Description,
                MainProducts = user.SupplierProfile?.MainProducts,
                Website = user.SupplierProfile?.Website
            });
        }

        // PUT /api/users/me
        [Authorize]
        [HttpPut("me")]
        public async Task<IActionResult> UpdateMe(UpdateProfileDto dto)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == CurrentUserId);
            if (user == null) return NotFound();

            user.Phone = dto.Phone ?? user.Phone;
            user.City = dto.City ?? user.City;
            user.Province = dto.Province ?? user.Province;
            user.CompanyName = dto.CompanyName ?? user.CompanyName;

            if (user.Role == "Supplier")
            {
                var profile = await _db.SupplierProfiles.FirstOrDefaultAsync(p => p.UserId == CurrentUserId);
                if (profile != null)
                {
                    profile.BusinessType = dto.BusinessType ?? profile.BusinessType;
                    profile.YearsInBusiness = dto.YearsInBusiness > 0 ? dto.YearsInBusiness : profile.YearsInBusiness;
                    profile.Description = dto.Description ?? profile.Description;
                    profile.MainProducts = dto.MainProducts ?? profile.MainProducts;
                    profile.Website = dto.Website ?? profile.Website;
                }
            }

            await _db.SaveChangesAsync();
            return NoContent();
        }

        // GET /api/suppliers — browse suppliers
        [HttpGet("/api/suppliers")]
        public async Task<IActionResult> GetSuppliers([FromQuery] string? search, [FromQuery] string? city)
        {
            var query = _db.Users
                .Include(u => u.SupplierProfile)
                .Include(u => u.Subscriptions)
                .Where(u => u.Role == "Supplier" && u.IsActive);

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(u => u.FullName.Contains(search) || (u.CompanyName != null && u.CompanyName.Contains(search)));

            if (!string.IsNullOrWhiteSpace(city))
                query = query.Where(u => u.City != null && u.City.Contains(city));

            var now = DateTime.UtcNow;
            var suppliers = await query
                .Select(u => new SupplierPublicDto
                {
                    UserId = u.UserId,
                    FullName = u.FullName,
                    CompanyName = u.CompanyName,
                    City = u.City,
                    BusinessType = u.SupplierProfile != null ? u.SupplierProfile.BusinessType : null,
                    YearsInBusiness = u.SupplierProfile != null ? u.SupplierProfile.YearsInBusiness : 0,
                    Description = u.SupplierProfile != null ? u.SupplierProfile.Description : null,
                    MainProducts = u.SupplierProfile != null ? u.SupplierProfile.MainProducts : null,
                    LogoUrl = u.SupplierProfile != null ? u.SupplierProfile.LogoUrl : null,
                    Website = u.SupplierProfile != null ? u.SupplierProfile.Website : null,
                    IsFeatured = u.SupplierProfile != null && u.SupplierProfile.IsFeatured,
                    Rating = u.SupplierProfile != null ? u.SupplierProfile.Rating : 0,
                    IsPremium = u.Subscriptions.Any(s => s.IsActive && s.PlanType == "Premium" && s.EndDate > now),
                    IsVerified = u.IsVerified
                })
                .OrderByDescending(s => s.IsFeatured)
                .ThenByDescending(s => s.IsPremium)
                .ToListAsync();

            return Ok(suppliers);
        }

        // GET /api/suppliers/{id}
        [HttpGet("/api/suppliers/{id}")]
        public async Task<IActionResult> GetSupplier(int id)
        {
            var now = DateTime.UtcNow;
            var user = await _db.Users
                .Include(u => u.SupplierProfile)
                .Include(u => u.Subscriptions)
                .FirstOrDefaultAsync(u => u.UserId == id && u.Role == "Supplier");

            if (user == null) return NotFound();

            return Ok(new SupplierPublicDto
            {
                UserId = user.UserId,
                FullName = user.FullName,
                CompanyName = user.CompanyName,
                City = user.City,
                BusinessType = user.SupplierProfile?.BusinessType,
                YearsInBusiness = user.SupplierProfile?.YearsInBusiness ?? 0,
                Description = user.SupplierProfile?.Description,
                MainProducts = user.SupplierProfile?.MainProducts,
                LogoUrl = user.SupplierProfile?.LogoUrl,
                Website = user.SupplierProfile?.Website,
                IsFeatured = user.SupplierProfile?.IsFeatured ?? false,
                Rating = user.SupplierProfile?.Rating ?? 0,
                IsPremium = user.Subscriptions.Any(s => s.IsActive && s.PlanType == "Premium" && s.EndDate > now),
                IsVerified = user.IsVerified
            });
        }
    }
}
