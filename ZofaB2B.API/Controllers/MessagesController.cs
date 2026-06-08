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
    [Route("api/messages")]
    [EnableCors("AllowFrontend")]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly EmailService _email;
        public MessagesController(AppDbContext db, EmailService email) { _db = db; _email = email; }
        private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // POST /api/messages
        [HttpPost]
        public async Task<IActionResult> Send(SendMessageDto dto)
        {
            var receiver = await _db.Users.FirstOrDefaultAsync(u => u.UserId == dto.ReceiverId);
            if (receiver == null) return NotFound(new { message = "Recipient not found." });

            var msg = new Message
            {
                SenderId = CurrentUserId,
                ReceiverId = dto.ReceiverId,
                Body = dto.Body,
                RFQId = dto.RFQId
            };
            _db.Messages.Add(msg);
            await _db.SaveChangesAsync();

            // Email notification — only if receiver has no unread messages from this sender already
            var hasUnread = await _db.Messages.AnyAsync(m =>
                m.SenderId == CurrentUserId && m.ReceiverId == dto.ReceiverId && !m.IsRead && m.MessageId != msg.MessageId);
            if (!hasUnread)
            {
                var sender = await _db.Users.FirstOrDefaultAsync(u => u.UserId == CurrentUserId);
                _ = _email.SendNewMessageAsync(receiver.Email, receiver.FullName, sender?.CompanyName ?? sender?.FullName ?? "Someone");
            }

            return Ok(new
            {
                msg.MessageId, msg.SenderId, msg.ReceiverId,
                msg.Body, msg.RFQId, msg.IsRead, msg.SentAt
            });
        }

        // GET /api/messages/conversations — all unique threads for sidebar
        [HttpGet("conversations")]
        public async Task<IActionResult> Conversations()
        {
            var userId = CurrentUserId;

            var allMessages = await _db.Messages
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Where(m => m.SenderId == userId || m.ReceiverId == userId)
                .OrderByDescending(m => m.SentAt)
                .Take(500)
                .ToListAsync();

            var conversations = allMessages
                .GroupBy(m => m.SenderId == userId ? m.ReceiverId : m.SenderId)
                .Select(g =>
                {
                    var latest = g.First();
                    var contact = latest.SenderId == userId ? latest.Receiver : latest.Sender;
                    var unread = g.Count(m => m.ReceiverId == userId && !m.IsRead);
                    var rfqMsg = g.FirstOrDefault(m => m.RFQId.HasValue);
                    return new ConversationDto
                    {
                        ContactUserId = contact.UserId,
                        ContactName = contact.CompanyName ?? contact.FullName,
                        ContactCompany = contact.CompanyName,
                        LastMessage = latest.Body,
                        LastMessageAt = latest.SentAt,
                        UnreadCount = unread,
                        RFQId = rfqMsg?.RFQId
                    };
                })
                .OrderByDescending(c => c.LastMessageAt)
                .ToList();

            return Ok(conversations);
        }

        // GET /api/messages/{userId} — full thread with a specific user
        [HttpGet("{userId}")]
        public async Task<IActionResult> Thread(int userId)
        {
            var me = CurrentUserId;
            var messages = await _db.Messages
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Where(m => (m.SenderId == me && m.ReceiverId == userId) ||
                            (m.SenderId == userId && m.ReceiverId == me))
                .OrderBy(m => m.SentAt)
                .Select(m => new MessageDto
                {
                    MessageId = m.MessageId,
                    SenderId = m.SenderId,
                    SenderName = m.Sender.CompanyName ?? m.Sender.FullName,
                    ReceiverId = m.ReceiverId,
                    ReceiverName = m.Receiver.CompanyName ?? m.Receiver.FullName,
                    Body = m.Body,
                    RFQId = m.RFQId,
                    IsRead = m.IsRead,
                    SentAt = m.SentAt
                })
                .ToListAsync();

            return Ok(messages);
        }

        // GET /api/messages/inbox — unread count only (for notification bell)
        [HttpGet("inbox")]
        public async Task<IActionResult> Inbox()
        {
            var unreadCount = await _db.Messages
                .CountAsync(m => m.ReceiverId == CurrentUserId && !m.IsRead);
            return Ok(new { unreadCount });
        }

        // PATCH /api/messages/{id}/read
        [HttpPatch("{id}/read")]
        public async Task<IActionResult> MarkRead(int id)
        {
            var msg = await _db.Messages.FirstOrDefaultAsync(m => m.MessageId == id && m.ReceiverId == CurrentUserId);
            if (msg == null) return NotFound();
            msg.IsRead = true;
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // PATCH /api/messages/read-all/{userId} — mark all messages from a user as read
        [HttpPatch("read-all/{userId}")]
        public async Task<IActionResult> MarkAllRead(int userId)
        {
            var msgs = await _db.Messages
                .Where(m => m.SenderId == userId && m.ReceiverId == CurrentUserId && !m.IsRead)
                .ToListAsync();
            msgs.ForEach(m => m.IsRead = true);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }

    [ApiController]
    [IgnoreAntiforgeryToken]
    [Route("api/categories")]
    [EnableCors("AllowFrontend")]
    public class CategoriesController : ControllerBase
    {
        private readonly AppDbContext _db;
        public CategoriesController(AppDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var cats = await _db.Categories
                .AsNoTracking()
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
        [ResponseCache(Duration = 60, Location = ResponseCacheLocation.Any, VaryByQueryKeys = new[] { "page", "pageSize" })]
        public async Task<IActionResult> GetRFQsByCategory(int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 50) pageSize = 50;

            var filtered = _db.RFQs
                .AsNoTracking()
                .Where(r => r.CategoryId == id && r.Status == "Open");

            var total = await filtered.CountAsync();
            var items = await filtered
                .OrderByDescending(r => r.IsFeatured).ThenByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize).Take(pageSize)
                .GroupJoin(
                    _db.Quotations.AsNoTracking(),
                    r => r.RFQId,
                    q => q.RFQId,
                    (r, quotes) => new RFQListDto
                    {
                        RFQId = r.RFQId,
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
    }
}
