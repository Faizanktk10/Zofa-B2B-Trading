using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZofaB2B.API.Data;
using ZofaB2B.API.DTOs;
using ZofaB2B.API.Helpers;
using ZofaB2B.API.Models;
using ZofaB2B.API.Services;

namespace ZofaB2B.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly JwtHelper _jwt;
        private readonly EmailService _email;

        public AuthController(AppDbContext db, JwtHelper jwt, EmailService email)
        {
            _db = db;
            _jwt = jwt;
            _email = email;
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

            if (user.Role == "Supplier")
            {
                _db.SupplierProfiles.Add(new SupplierProfile { UserId = user.UserId });
                await _db.SaveChangesAsync();
            }

            // Send welcome email (fire and forget)
            _ = _email.SendWelcomeAsync(user.Email, user.FullName, user.Role);

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

            var plan = await new SubscriptionService(_db).GetActivePlanAsync(user.UserId);
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

        // POST /api/auth/forgot-password
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

            // Always return success to prevent email enumeration
            if (user == null)
                return Ok(new { message = "If this email exists, a reset link has been sent." });

            // Invalidate old tokens
            var oldTokens = await _db.PasswordResetTokens
                .Where(t => t.UserId == user.UserId && !t.IsUsed)
                .ToListAsync();
            oldTokens.ForEach(t => t.IsUsed = true);

            var resetToken = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
            _db.PasswordResetTokens.Add(new PasswordResetToken
            {
                UserId = user.UserId,
                Token = resetToken,
                ExpiresAt = DateTime.UtcNow.AddHours(1)
            });
            await _db.SaveChangesAsync();

            _ = _email.SendPasswordResetAsync(user.Email, user.FullName, resetToken);

            return Ok(new { message = "If this email exists, a reset link has been sent." });
        }

        // POST /api/auth/reset-password
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            var record = await _db.PasswordResetTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Token == dto.Token && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow);

            if (record == null)
                return BadRequest(new { message = "Invalid or expired reset link." });

            record.User.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            record.IsUsed = true;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Password reset successfully. You can now login." });
        }
    }
}
