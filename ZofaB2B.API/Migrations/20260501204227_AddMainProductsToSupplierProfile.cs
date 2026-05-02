using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZofaB2B.API.Migrations
{
    /// <inheritdoc />
    public partial class AddMainProductsToSupplierProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MainProducts",
                table: "SupplierProfiles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$YHzNNIha7PijZz2kajzQhuLVkxH2.6IsRyoGtqd9FTxibMICvhv4K");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MainProducts",
                table: "SupplierProfiles");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$iIdY6nP0ICH8.ZQZ./bPD.xD9pVGwtlpnvPihMKvDMAXtvKGSUYge");
        }
    }
}
