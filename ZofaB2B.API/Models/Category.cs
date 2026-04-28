using System.ComponentModel.DataAnnotations;

namespace ZofaB2B.API.Models
{
    public class Category
    {
        public int CategoryId { get; set; }
        [Required, MaxLength(100)] public string Name { get; set; } = string.Empty;
        [MaxLength(100)] public string Slug { get; set; } = string.Empty;
        [MaxLength(255)] public string? IconUrl { get; set; }
        public int? ParentId { get; set; }
        public Category? Parent { get; set; }
        public ICollection<Category> SubCategories { get; set; } = new List<Category>();
        public ICollection<RFQ> RFQs { get; set; } = new List<RFQ>();
    }
}
