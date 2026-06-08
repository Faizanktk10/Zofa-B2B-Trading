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
    [Route("api/upload")]
    [EnableCors("AllowFrontend")]
    [Authorize]
    public class UploadController : ControllerBase
    {
        private readonly CloudinaryService _cloudinary;
        private readonly AppDbContext _db;

        public UploadController(CloudinaryService cloudinary, AppDbContext db)
        {
            _cloudinary = cloudinary;
            _db = db;
        }

        private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // POST /api/upload/logo — supplier logo upload
        [IgnoreAntiforgeryToken]
        [HttpPost("logo")]
        public async Task<IActionResult> UploadLogo([FromBody] UploadImageDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Base64Data))
                return BadRequest(new { message = "No image data provided." });

            var url = await _cloudinary.UploadBase64Async(dto.Base64Data, "zofa/logos");
            if (url == null)
                return StatusCode(500, new { message = "Image upload failed. Check Cloudinary config." });

            // Save to supplier profile
            var profile = await _db.SupplierProfiles.FirstOrDefaultAsync(p => p.UserId == CurrentUserId);
            if (profile != null)
            {
                profile.LogoUrl = url;
                await _db.SaveChangesAsync();
            }

            return Ok(new { url });
        }

        // POST /api/upload/payment-proof — payment proof upload
        [IgnoreAntiforgeryToken]
        [HttpPost("payment-proof")]
        public async Task<IActionResult> UploadPaymentProof([FromBody] UploadImageDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Base64Data))
                return BadRequest(new { message = "No image data provided." });

            var url = await _cloudinary.UploadBase64Async(dto.Base64Data, "zofa/payments");
            if (url == null)
                return StatusCode(500, new { message = "Image upload failed. Check Cloudinary config." });

            return Ok(new { url });
        }
    }
}
