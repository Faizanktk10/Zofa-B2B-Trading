using System.ComponentModel.DataAnnotations;

namespace ZofaB2B.API.Models
{
    public class Quotation
    {
        public int QuotationId { get; set; }
        public int RFQId { get; set; }
        public RFQ RFQ { get; set; } = null!;
        public int SupplierId { get; set; }
        public User Supplier { get; set; } = null!;
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public int DeliveryDays { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending"; // Pending, Accepted, Rejected
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
