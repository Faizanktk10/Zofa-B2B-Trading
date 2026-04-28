namespace ZofaB2B.API.Models
{
    public class Subscription
    {
        public int SubscriptionId { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public string PlanType { get; set; } = "Free"; // Free, Premium
        public string BillingCycle { get; set; } = "Monthly"; // Monthly, Yearly
        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; } = true;
        public decimal AmountPaid { get; set; }
    }
}
