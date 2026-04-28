using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ZofaB2B.API.Data;
using ZofaB2B.API.DTOs;
using ZofaB2B.API.Models;

namespace ZofaB2B.API.Controllers
{
    [ApiController]
    [Route("api/messages")]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly AppDbContext _db;
        public MessagesController(AppDbContext db) => _db = db;
        private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpPost]
        public async Task<IActionResult> Send(SendMessageDto dto)
        {
            var msg = new Message
            {
                SenderId = CurrentUserId,
                ReceiverId = dto.ReceiverId,
                Body = dto.Body,
                RFQId = dto.RFQId
            };
            _db.Messages.Add(msg);
            await _db.SaveChangesAsync();
            return Ok(new { msg.MessageId });
        }

        [HttpGet("inbox")]
        public async Task<IActionResult> Inbox()
        {
            var messages = await _db.Messages
                .Include(m => m.Sender)
                .Where(m => m.ReceiverId == CurrentUserId)
                .OrderByDescending(m => m.SentAt)
                .Select(m => new MessageDto
                {
                    MessageId = m.MessageId,
                    SenderId = m.SenderId,
                    SenderName = m.Sender.FullName,
                    Body = m.Body,
                    IsRead = m.IsRead,
                    SentAt = m.SentAt
                })
                .ToListAsync();

            return Ok(messages);
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> Thread(int userId)
        {
            var messages = await _db.Messages
                .Include(m => m.Sender)
                .Where(m => (m.SenderId == CurrentUserId && m.ReceiverId == userId) ||
                            (m.SenderId == userId && m.ReceiverId == CurrentUserId))
                .OrderBy(m => m.SentAt)
                .Select(m => new MessageDto
                {
                    MessageId = m.MessageId,
                    SenderId = m.SenderId,
                    SenderName = m.Sender.FullName,
                    Body = m.Body,
                    IsRead = m.IsRead,
                    SentAt = m.SentAt
                })
                .ToListAsync();

            return Ok(messages);
        }

        [HttpPatch("{id}/read")]
        public async Task<IActionResult> MarkRead(int id)
        {
            var msg = await _db.Messages.FirstOrDefaultAsync(m => m.MessageId == id && m.ReceiverId == CurrentUserId);
            if (msg == null) return NotFound();
            msg.IsRead = true;
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }

    [ApiController]
    [Route("api/categories")]
    public class CategoriesController : ControllerBase
    {
        private readonly AppDbContext _db;
        public CategoriesController(AppDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var cats = await _db.Categories
                .Where(c => c.ParentId == null)
                .Include(c => c.SubCategories)
                .Select(c => new
                {
                    c.CategoryId,
                    c.Name,
                    c.Slug,
                    c.IconUrl,
                    SubCategories = c.SubCategories.Select(s => new { s.CategoryId, s.Name, s.Slug })
                })
                .ToListAsync();

            return Ok(cats);
        }

        [HttpGet("{id}/rfqs")]
        public async Task<IActionResult> GetRFQsByCategory(int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var query = _db.RFQs
                .Include(r => r.Buyer)
                .Include(r => r.Quotations)
                .Where(r => r.CategoryId == id && r.Status == "Open");

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(r => r.IsFeatured).ThenByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize).Take(pageSize)
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
    }
}
