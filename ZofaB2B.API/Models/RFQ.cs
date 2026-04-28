using System.ComponentModel.DataAnnotations;

namespace ZofaB2B.API.Models
{
    public class RFQ
    {
        public int RFQId { get; set; }
        public int BuyerId { get; set; }
        public User Buyer { get; set; } = null!;
        public int CategoryId { get; set; }
        public Category Category { get; set; } = null!;
        [Required, MaxLength(200)] public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        [MaxLength(100)] public string Quantity { get; set; } = string.Empty;
        [MaxLength(50)] public string Unit { get; set; } = string.Empty;
        public decimal? TargetPrice { get; set; }
        [MaxLength(100)] public string? DeliveryCity { get; set; }
        public DateTime? DeadlineDate { get; set; }
        public string Status { get; set; } = "Open"; // Open, Closed, Awarded, Expired
        public bool IsFeatured { get; set; } = false;
        public int ViewCount { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Quotation> Quotations { get; set; } = new List<Quotation>();
    }
}
