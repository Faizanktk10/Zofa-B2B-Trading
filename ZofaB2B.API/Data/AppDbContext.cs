using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using ZofaB2B.API.Models;

namespace ZofaB2B.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<Category> Categories => Set<Category>();
        public DbSet<RFQ> RFQs => Set<RFQ>();
        public DbSet<Quotation> Quotations => Set<Quotation>();
        public DbSet<Subscription> Subscriptions => Set<Subscription>();
        public DbSet<Message> Messages => Set<Message>();
        public DbSet<LeadUnlock> LeadUnlocks => Set<LeadUnlock>();
        public DbSet<Payment> Payments => Set<Payment>();
        public DbSet<SupplierProfile> SupplierProfiles => Set<SupplierProfile>();
        public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
        public DbSet<EmailVerificationCode> EmailVerificationCodes => Set<EmailVerificationCode>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Ensure all DateTime values are stored as UTC for PostgreSQL
            var dateTimeConverter = new ValueConverter<DateTime, DateTime>(
                v => v.Kind == DateTimeKind.Utc ? v : v.ToUniversalTime(),
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

            var nullableDateTimeConverter = new ValueConverter<DateTime?, DateTime?>(
                v => v.HasValue ? (v.Value.Kind == DateTimeKind.Utc ? v.Value : v.Value.ToUniversalTime()) : v,
                v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v);

            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                foreach (var property in entityType.GetProperties())
                {
                    if (property.ClrType == typeof(DateTime))
                        property.SetValueConverter(dateTimeConverter);
                    else if (property.ClrType == typeof(DateTime?))
                        property.SetValueConverter(nullableDateTimeConverter);
                }
            }

            // Self-referencing category
            modelBuilder.Entity<Category>()
                .HasOne(c => c.Parent)
                .WithMany(c => c.SubCategories)
                .HasForeignKey(c => c.ParentId)
                .OnDelete(DeleteBehavior.Restrict);

            // RFQ → Buyer
            modelBuilder.Entity<RFQ>()
                .HasOne(r => r.Buyer)
                .WithMany(u => u.RFQs)
                .HasForeignKey(r => r.BuyerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Quotation → Supplier
            modelBuilder.Entity<Quotation>()
                .HasOne(q => q.Supplier)
                .WithMany(u => u.Quotations)
                .HasForeignKey(q => q.SupplierId)
                .OnDelete(DeleteBehavior.Restrict);

            // Message sender/receiver
            modelBuilder.Entity<Message>()
                .HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Message>()
                .HasOne(m => m.Receiver)
                .WithMany()
                .HasForeignKey(m => m.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            // LeadUnlock → Supplier
            modelBuilder.Entity<LeadUnlock>()
                .HasOne(l => l.Supplier)
                .WithMany()
                .HasForeignKey(l => l.SupplierId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<EmailVerificationCode>()
                .HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Decimal precision — prevents silent truncation warnings
            modelBuilder.Entity<LeadUnlock>().Property(l => l.AmountPaid).HasPrecision(18, 2);
            modelBuilder.Entity<Payment>().Property(p => p.Amount).HasPrecision(18, 2);
            modelBuilder.Entity<Quotation>().Property(q => q.UnitPrice).HasPrecision(18, 2);
            modelBuilder.Entity<Quotation>().Property(q => q.TotalPrice).HasPrecision(18, 2);
            modelBuilder.Entity<RFQ>().Property(r => r.TargetPrice).HasPrecision(18, 2);
            modelBuilder.Entity<Subscription>().Property(s => s.AmountPaid).HasPrecision(18, 2);
            modelBuilder.Entity<SupplierProfile>().Property(s => s.Rating).HasPrecision(3, 2);

            // Seed Categories
            modelBuilder.Entity<Category>().HasData(
                new Category { CategoryId = 1, Name = "Scrap", Slug = "scrap", ParentId = null },
                new Category { CategoryId = 2, Name = "Textile", Slug = "textile", ParentId = null },
                new Category { CategoryId = 3, Name = "Agriculture", Slug = "agriculture", ParentId = null },
                new Category { CategoryId = 4, Name = "Machinery", Slug = "machinery", ParentId = null },
                new Category { CategoryId = 5, Name = "Packaging", Slug = "packaging", ParentId = null },
                new Category { CategoryId = 6, Name = "Raw Materials", Slug = "raw-materials", ParentId = null },
                new Category { CategoryId = 7, Name = "Chemicals", Slug = "chemicals", ParentId = null },
                new Category { CategoryId = 8, Name = "Electronics", Slug = "electronics", ParentId = null }
            );

            // Seed Admin user
            modelBuilder.Entity<User>().HasData(new User
            {
                UserId = 1,
                FullName = "Admin",
                Email = "admin@zofa.pk",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                Role = "Admin",
                IsVerified = true,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1)
            });
        }
    }
}
