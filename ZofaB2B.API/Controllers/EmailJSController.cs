using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using ZofaB2B.API.Services;

namespace ZofaB2B.API.Controllers
{
    [ApiController]
    [Route("api/emailjs")]
    [EnableCors("AllowFrontend")]
    public class EmailJSController : ControllerBase
    {
        private readonly EmailJSService _emailJSService;

        public EmailJSController(EmailJSService emailJSService)
        {
            _emailJSService = emailJSService;
        }

        /// <summary>
        /// Send verification code via EmailJS
        /// POST: /api/emailjs/send-verification
        /// </summary>
        [HttpPost("send-verification")]
        public async Task<IActionResult> SendVerificationCode([FromBody] SendVerificationCodeRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email))
                return BadRequest(new { message = "Email is required." });

            if (string.IsNullOrWhiteSpace(request.Code) || request.Code.Length != 6)
                return BadRequest(new { message = "Verification code must be 6 digits." });

            var success = await _emailJSService.SendVerificationCodeAsync(
                request.Email,
                request.Name ?? "User",
                request.Code
            );

            if (success)
            {
                return Ok(new { message = "Verification code sent successfully." });
            }
            else
            {
                return StatusCode(500, new { message = "Failed to send verification email. Please try again." });
            }
        }

        /// <summary>
        /// Send welcome email via EmailJS
        /// POST: /api/emailjs/send-welcome
        /// </summary>
        [HttpPost("send-welcome")]
        public async Task<IActionResult> SendWelcomeEmail([FromBody] SendWelcomeEmailRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email))
                return BadRequest(new { message = "Email is required." });

            var success = await _emailJSService.SendWelcomeEmailAsync(
                request.Email,
                request.Name ?? "User",
                request.Role
            );

            if (success)
            {
                return Ok(new { message = "Welcome email sent successfully." });
            }
            else
            {
                return StatusCode(500, new { message = "Failed to send welcome email." });
            }
        }
    }

    public class SendVerificationCodeRequest
    {
        public string Email { get; set; } = string.Empty;
        public string? Name { get; set; }
        public string Code { get; set; } = string.Empty;
    }

    public class SendWelcomeEmailRequest
    {
        public string Email { get; set; } = string.Empty;
        public string? Name { get; set; }
        public string Role { get; set; } = string.Empty;
    }
}