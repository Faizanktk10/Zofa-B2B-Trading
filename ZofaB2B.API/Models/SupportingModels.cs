namespace ZofaB2B.API.Models
{
    public class Message
    {
        public int MessageId { get; set; }
        public int SenderId { get; set; }
        public User Sender { get; set; } = null!;
        public int ReceiverId { get; set; }
        public User Receiver { get; set; } = null!;
        public int? RFQId { get; set; }
        public string Body { get; set; } = string.Empty;
        public bool IsRead { get; set; } = false;
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
    }

    public class LeadUnlock
    {
        public int LeadUnlockId { get; set; }
        public int SupplierId { get; set; }
        public User Supplier { get; set; } = null!;
        public int RFQId { get; set; }
        public RFQ RFQ { get; set; } = null!;
        public decimal AmountPaid { get; set; }
        public DateTime UnlockedAt { get; set; } = DateTime.UtcNow;
    }

    public class Payment
    {
        public int PaymentId { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public string Type { get; set; } = string.Empty; // Subscription, LeadUnlock, FeaturedRFQ
        public decimal Amount { get; set; }
        public string Plan { get; set; } = "Premium"; // Premium, Star, PayPerLead
        public string Method { get; set; } = string.Empty; // JazzCash, EasyPaisa, BankTransfer
        public string Status { get; set; } = "Pending"; // Pending, Confirmed, Failed
        public string? ReferenceNo { get; set; }
        public string? ProofImage { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class PasswordResetToken
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public bool IsUsed { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class SupplierProfile
    {
        public int SupplierProfileId { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public string? BusinessType { get; set; }
        public int YearsInBusiness { get; set; }
        public string? Description { get; set; }
        public string? MainProducts { get; set; } // comma-separated
        public string? LogoUrl { get; set; }
        public string? Website { get; set; }
        public bool IsFeatured { get; set; } = false;
        public decimal Rating { get; set; } = 0;
    }
}
