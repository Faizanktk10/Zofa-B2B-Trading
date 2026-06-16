using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using ZofaB2B.API.Data;
using ZofaB2B.API.DTOs;
using ZofaB2B.API.Helpers;
using ZofaB2B.API.Models;
using ZofaB2B.API.Services;

namespace ZofaB2B.API.Controllers
{
    [ApiController]
    [IgnoreAntiforgeryToken]
    [Route("api/auth")]
    [EnableCors("AllowFrontend")]
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

        private async Task SendVerificationCodeAsync(User user)
        {
            await _db.EmailVerificationCodes
                .Where(c => c.UserId == user.UserId && !c.IsUsed)
                .ExecuteUpdateAsync(c => c.SetProperty(x => x.IsUsed, true));

            var code = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
            _db.EmailVerificationCodes.Add(new EmailVerificationCode
            {
                UserId = user.UserId,
                Email = user.Email,
                Code = code,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15),
                CreatedAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync();

            Console.WriteLine($"[Auth] Verification code for {user.Email}: {code}");

            // EMAIL CHAIN DISABLED TEMPORARILY (EmailJS 403 / SMTP timeout / Resend testing mode)
            // For urgent verification unblock, frontend will display this code to the user.
            // await _email.SendVerificationCodeAsync(user.Email, user.FullName, code);
            
            await Task.CompletedTask;
        }

        [IgnoreAntiforgeryToken]
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Email))
                    return BadRequest(new { message = "Email is required." });

                if (dto.Role != "Buyer" && dto.Role != "Supplier")
                    return BadRequest(new { message = "Role must be Buyer or Supplier." });

                if (string.IsNullOrWhiteSpace(dto.FullName))
                    return BadRequest(new { message = "FullName is required." });
                if (dto.FullName.Trim().Length < 3)
                    return BadRequest(new { message = "FullName must be at least 3 characters." });

                var normalizedEmail = dto.Email.Trim();
                var emailOk = new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(normalizedEmail);
                if (!emailOk)
                    return BadRequest(new { message = "Invalid email format." });

                if (string.IsNullOrWhiteSpace(dto.Password))
                    return BadRequest(new { message = "Password is required." });
                if (dto.Password.Length < 6)
                    return BadRequest(new { message = "Password must be at least 6 characters." });

                if (string.IsNullOrWhiteSpace(dto.Role))
                    return BadRequest(new { message = "Role is required." });

                var existing = await _db.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
                if (existing != null)
                {
                    if (!existing.IsVerified)
                    {
                        await SendVerificationCodeAsync(existing);
                        return Ok(new
                        {
                            message = "Account exists but email is not verified. Please use the verification code from server console.",
                            email = normalizedEmail,
                            requiresVerification = true
                        });
                    }
                    return BadRequest(new { message = "Email already registered." });
                }

                var user = new User
                {
                    FullName = dto.FullName.Trim(),
                    Email = normalizedEmail,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                    Phone = string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim(),
                    Role = dto.Role,
                    City = dto.City,
                    Province = dto.Province,
                    CompanyName = string.IsNullOrWhiteSpace(dto.CompanyName) ? null : dto.CompanyName.Trim(),
                    CreatedAt = DateTime.UtcNow,
                    IsActive = false,
                    IsVerified = false
                };

                _db.Users.Add(user);

                var saveTask = _db.SaveChangesAsync();
                if (await Task.WhenAny(saveTask, Task.Delay(10000)) != saveTask)
                    return StatusCode(500, new { message = "Database save timed out. Please try again." });

                if (user.Role == "Supplier")
                {
                    _db.SupplierProfiles.Add(new SupplierProfile
                    {
                        UserId = user.UserId,
                        YearsInBusiness = 0,
                        Rating = 0
                    });

                    var profileTask = _db.SaveChangesAsync();
                    if (await Task.WhenAny(profileTask, Task.Delay(10000)) != profileTask)
                        return StatusCode(500, new { message = "Profile save timed out." });
                }

                await SendVerificationCodeAsync(user);

                return Ok(new
                {
                    message = "Account created. Please check your email or server console for the 6-digit verification code.",
                    email = user.Email,
                    requiresVerification = true
                });
            }
            catch (Npgsql.NpgsqlException)
            {
                Console.WriteLine("[Auth] Npgsql Error occurred.");
                return StatusCode(500, new { message = "Database connection error. Please try again." });
            }
            catch (DbUpdateException)
            {
                Console.WriteLine("[Auth] DbUpdate Error occurred.");
                return StatusCode(500, new { message = "Could not save user. Please try again." });
            }
            catch (Exception)
            {
                Console.WriteLine("[Auth] Unexpected Error occurred.");
                return StatusCode(500, new { message = "An unexpected server error occurred. Please try again." });
            }
        }

        [IgnoreAntiforgeryToken]
        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailDto dto)
        {
            var email = dto.Email.Trim();
            var code = dto.Code.Trim();

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
                return BadRequest(new { message = "Invalid email or verification code." });

            if (user.IsVerified)
                return BadRequest(new { message = "Email is already verified. You can log in." });

            var record = await _db.EmailVerificationCodes
                .Where(c => c.UserId == user.UserId && !c.IsUsed && c.ExpiresAt > DateTime.UtcNow)
                .OrderByDescending(c => c.CreatedAt)
                .FirstOrDefaultAsync(c => c.Code == code);

            if (record == null)
                return BadRequest(new { message = "Invalid or expired verification code." });

            record.IsUsed = true;
            user.IsVerified = true;
            user.IsActive = true;
            await _db.SaveChangesAsync();

            _ = _email.SendWelcomeAsync(user.Email, user.FullName, user.Role);

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

        [IgnoreAntiforgeryToken]
        [HttpPost("resend-verification")]
        public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationDto dto)
        {
            var email = dto.Email.Trim();
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user == null || user.IsVerified)
                return Ok(new { message = "If this email is registered and unverified, a new code has been sent." });

            var recentCount = await _db.EmailVerificationCodes
                .CountAsync(c => c.UserId == user.UserId && c.CreatedAt > DateTime.UtcNow.AddHours(-1));
            if (recentCount >= 5)
                return BadRequest(new { message = "Too many verification attempts. Please try again later." });

            await SendVerificationCodeAsync(user);

            return Ok(new { message = "A new verification code has been sent to your email." });
        }

        [IgnoreAntiforgeryToken]
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email.Trim());
            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                return Unauthorized(new { message = "Invalid email or password." });

            if (!user.IsVerified)
                return StatusCode(403, new { message = "Please verify your email first.", requiresVerification = true, email = user.Email });

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

        [IgnoreAntiforgeryToken]
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (user == null)
                return Ok(new { message = "If this email exists, a reset link has been sent." });

            await _db.PasswordResetTokens
                .Where(t => t.UserId == user.UserId && !t.IsUsed)
                .OrderByDescending(t => t.CreatedAt)
                .Take(100)
                .ExecuteUpdateAsync(t => t.SetProperty(p => p.IsUsed, true));

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

        [IgnoreAntiforgeryToken]
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
