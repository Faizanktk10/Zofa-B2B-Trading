using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZofaB2B.API.Migrations
{
    /// <inheritdoc />
    public partial class AdminPanelEnhancements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPremium",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PlanType",
                table: "Users",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "SubscriptionExpiry",
                table: "Users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Plan",
                table: "Payments",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProofImage",
                table: "Payments",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "IsPremium", "PasswordHash", "PlanType", "SubscriptionExpiry" },
                values: new object[] { false, "$2a$11$iIdY6nP0ICH8.ZQZ./bPD.xD9pVGwtlpnvPihMKvDMAXtvKGSUYge", "Free", null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPremium",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PlanType",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SubscriptionExpiry",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Plan",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "ProofImage",
                table: "Payments");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$hPco6UCLSbKx8wyBrLeymu.6U105VSkugd1VfNxnPfFc/Wy6rorKG");
        }
    }
}
