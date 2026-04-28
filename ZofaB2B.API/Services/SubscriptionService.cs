using Microsoft.EntityFrameworkCore;
using ZofaB2B.API.Data;

namespace ZofaB2B.API.Services
{
    public class SubscriptionService
    {
        private readonly AppDbContext _db;

        public SubscriptionService(AppDbContext db) => _db = db;

        public async Task<string> GetActivePlanAsync(int userId)
        {
            var sub = await _db.Subscriptions
                .Where(s => s.UserId == userId && s.IsActive && s.EndDate > DateTime.UtcNow)
                .OrderByDescending(s => s.EndDate)
                .FirstOrDefaultAsync();

            return sub?.PlanType ?? "Free";
        }

        public async Task<bool> IsPremiumAsync(int userId)
        {
            return await _db.Subscriptions
                .AnyAsync(s => s.UserId == userId && s.IsActive && s.PlanType == "Premium" && s.EndDate > DateTime.UtcNow);
        }

        public async Task<bool> HasUnlockedLeadAsync(int supplierId, int rfqId)
        {
            return await _db.LeadUnlocks
                .AnyAsync(l => l.SupplierId == supplierId && l.RFQId == rfqId);
        }

        public async Task<int> GetTodayQuoteCountAsync(int supplierId)
        {
            var today = DateTime.UtcNow.Date;
            return await _db.Quotations
                .CountAsync(q => q.SupplierId == supplierId && q.CreatedAt >= today);
        }
    }
}
