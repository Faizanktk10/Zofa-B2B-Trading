using System.ComponentModel.DataAnnotations;

namespace ZofaB2B.API.Models
{
    public class User
    {
        public int UserId { get; set; }
        [Required, MaxLength(100)] public string FullName { get; set; } = string.Empty;
        [Required, MaxLength(150)] public string Email { get; set; } = string.Empty;
        [Required] public string PasswordHash { get; set; } = string.Empty;
        [MaxLength(20)] public string? Phone { get; set; }
        [Required] public string Role { get; set; } = "Buyer"; // Buyer, Supplier, Admin
        [MaxLength(50)] public string? City { get; set; }
        [MaxLength(50)] public string? Province { get; set; }
        [MaxLength(150)] public string? CompanyName { get; set; }
        public bool IsPremium { get; set; } = false;
        [MaxLength(30)] public string PlanType { get; set; } = "Free";
        public DateTime? SubscriptionExpiry { get; set; }
        // Used for email verification (OTP)
        public bool IsVerified { get; set; } = false;

        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<RFQ> RFQs { get; set; } = new List<RFQ>();
        public ICollection<Quotation> Quotations { get; set; } = new List<Quotation>();
        public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
        public SupplierProfile? SupplierProfile { get; set; }
    }
}
