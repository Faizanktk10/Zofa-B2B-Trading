using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZofaB2B.API.Data;
using ZofaB2B.API.DTOs;
using ZofaB2B.API.Helpers;
using ZofaB2B.API.Models;

namespace ZofaB2B.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly JwtHelper _jwt;

        public AuthController(AppDbContext db, JwtHelper jwt)
        {
            _db = db;
            _jwt = jwt;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            if (await _db.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest(new { message = "Email already registered." });

            if (dto.Role != "Buyer" && dto.Role != "Supplier")
                return BadRequest(new { message = "Role must be Buyer or Supplier." });

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Phone = dto.Phone,
                Role = dto.Role,
                City = dto.City,
                Province = dto.Province,
                CompanyName = dto.CompanyName
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            // Create empty supplier profile if supplier
            if (user.Role == "Supplier")
            {
                _db.SupplierProfiles.Add(new SupplierProfile { UserId = user.UserId });
                await _db.SaveChangesAsync();
            }

            var token = _jwt.GenerateToken(user, "Free");
            return Ok(new AuthResponseDto
            {
                Token = token,
                Role = user.Role,
                FullName = user.FullName,
                UserId = user.UserId,
                Plan = "Free"
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                return Unauthorized(new { message = "Invalid email or password." });

            if (!user.IsActive)
                return Unauthorized(new { message = "Account is banned. Contact support." });

            var plan = await new Services.SubscriptionService(_db).GetActivePlanAsync(user.UserId);
            var token = _jwt.GenerateToken(user, plan);

            return Ok(new AuthResponseDto
            {
                Token = token,
                Role = user.Role,
                FullName = user.FullName,
                UserId = user.UserId,
                Plan = plan
            });
        }
    }
}
