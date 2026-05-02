using System.ComponentModel.DataAnnotations;

namespace ZofaB2B.API.DTOs
{
    // ─── Auth ───────────────────────────────────────────────
    public class RegisterDto
    {
        [Required] public string FullName { get; set; } = string.Empty;
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        [Required, MinLength(6)] public string Password { get; set; } = string.Empty;
        public string? Phone { get; set; }
        [Required] public string Role { get; set; } = "Buyer"; // Buyer or Supplier
        public string? City { get; set; }
        public string? Province { get; set; }
        public string? CompanyName { get; set; }
    }

    public class LoginDto
    {
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        [Required] public string Password { get; set; } = string.Empty;
    }

    public class ForgotPasswordDto
    {
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
    }

    public class ResetPasswordDto
    {
        [Required] public string Token { get; set; } = string.Empty;
        [Required, MinLength(6)] public string NewPassword { get; set; } = string.Empty;
    }

    public class UploadImageDto
    {
        [Required] public string Base64Data { get; set; } = string.Empty;
        public string Folder { get; set; } = "zofa-uploads";
    }

    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public int UserId { get; set; }
        public string Plan { get; set; } = "Free";
    }

    // ─── RFQ ────────────────────────────────────────────────
    public class CreateRFQDto
    {
        [Required] public string Title { get; set; } = string.Empty;
        [Required] public string Description { get; set; } = string.Empty;
        [Required] public string Quantity { get; set; } = string.Empty;
        [Required] public string Unit { get; set; } = string.Empty;
        public decimal? TargetPrice { get; set; }
        public string? DeliveryCity { get; set; }
        public DateTime? DeadlineDate { get; set; }
        [Required] public int CategoryId { get; set; }
    }

    public class RFQListDto
    {
        public int RFQId { get; set; }
        public int BuyerId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Quantity { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public string? DeliveryCity { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public bool IsFeatured { get; set; }
        public int QuotationCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public string BuyerCompany { get; set; } = string.Empty;
    }

    public class RFQDetailDto : RFQListDto
    {
        public string Description { get; set; } = string.Empty;
        public decimal? TargetPrice { get; set; }
        public DateTime? DeadlineDate { get; set; }
        public int ViewCount { get; set; }
        // Buyer contact — only shown to premium suppliers or if unlocked
        public string? BuyerEmail { get; set; }
        public string? BuyerPhone { get; set; }
    }

    // ─── Quotation ──────────────────────────────────────────
    public class CreateQuotationDto
    {
        [Required] public int RFQId { get; set; }
        [Required] public decimal UnitPrice { get; set; }
        [Required] public decimal TotalPrice { get; set; }
        [Required] public int DeliveryDays { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class QuotationDto
    {
        public int QuotationId { get; set; }
        public int RFQId { get; set; }
        public string RFQTitle { get; set; } = string.Empty;
        public int SupplierId { get; set; }
        public string SupplierName { get; set; } = string.Empty;
        public string? SupplierCompany { get; set; }
        public int BuyerId { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public int DeliveryDays { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    // ─── Message ────────────────────────────────────────────
    public class SendMessageDto
    {
        [Required] public int ReceiverId { get; set; }
        [Required] public string Body { get; set; } = string.Empty;
        public int? RFQId { get; set; }
    }

    public class MessageDto
    {
        public int MessageId { get; set; }
        public int SenderId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public int ReceiverId { get; set; }
        public string ReceiverName { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public int? RFQId { get; set; }
        public bool IsRead { get; set; }
        public DateTime SentAt { get; set; }
    }

    public class ConversationDto
    {
        public int ContactUserId { get; set; }
        public string ContactName { get; set; } = string.Empty;
        public string? ContactCompany { get; set; }
        public string LastMessage { get; set; } = string.Empty;
        public DateTime LastMessageAt { get; set; }
        public int UnreadCount { get; set; }
        public int? RFQId { get; set; }
        public string? RFQTitle { get; set; }
    }

    // ─── Subscription / Payment ─────────────────────────────
    public class UpgradeSubscriptionDto
    {
        [Required] public string BillingCycle { get; set; } = "Monthly"; // Monthly, Yearly
        [Required] public string PaymentMethod { get; set; } = string.Empty;
        public string? ReferenceNo { get; set; }
        public string? PlanType { get; set; } = "Premium";
        public string? ProofImage { get; set; }
    }

    public class SubscriptionStatusDto
    {
        public string PlanType { get; set; } = "Free";
        public DateTime? EndDate { get; set; }
        public bool IsActive { get; set; }
    }

    // ─── Admin ──────────────────────────────────────────────
    public class AdminDashboardDto
    {
        public int TotalUsers { get; set; }
        public int TotalBuyers { get; set; }
        public int TotalSuppliers { get; set; }
        public int TotalRFQs { get; set; }
        public int OpenRFQs { get; set; }
        public int PendingPayments { get; set; }
        public int ActivePremiumUsers { get; set; }
        public int TotalQuotations { get; set; }
        public decimal MonthlyRevenue { get; set; }
        public int PremiumSuppliers { get; set; }
    }

    public class UpdateUserPlanDto
    {
        [Required] public string PlanType { get; set; } = "Premium";
        public int DurationDays { get; set; } = 30;
    }

    // ─── Supplier Profile ───────────────────────────────────
    public class UpdateProfileDto
    {
        public string? BusinessType { get; set; }
        public int YearsInBusiness { get; set; }
        public string? Description { get; set; }
        public string? MainProducts { get; set; }
        public string? Website { get; set; }
        public string? Phone { get; set; }
        public string? City { get; set; }
        public string? Province { get; set; }
        public string? CompanyName { get; set; }
    }

    public class SupplierPublicDto
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? CompanyName { get; set; }
        public string? City { get; set; }
        public string? BusinessType { get; set; }
        public int YearsInBusiness { get; set; }
        public string? Description { get; set; }
        public string? MainProducts { get; set; }
        public string? LogoUrl { get; set; }
        public string? Website { get; set; }
        public bool IsFeatured { get; set; }
        public decimal Rating { get; set; }
        public bool IsPremium { get; set; }
        public bool IsVerified { get; set; }
    }
}
