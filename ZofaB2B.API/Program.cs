using AspNetCoreRateLimit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using ZofaB2B.API.Data;
using ZofaB2B.API.Helpers;
using ZofaB2B.API.Services;
using Npgsql;
var builder = WebApplication.CreateBuilder(args);

// 🔥 IMPORTANT: Force IPv4 (fix Render + Supabase IPv6 issues)
AppContext.SetSwitch("System.Net.DisableIPv6", true);

// =======================
// DATABASE CONNECTION
// =======================

// NOTE: Pooler + correct port + project ref username
var connectionStringBuilder = new NpgsqlConnectionStringBuilder
{
    Host = "db.txhucwgwklbkvrkyyjsh.supabase.co",
    Port = 5432,
    Database = "postgres",
    Username = "postgres",
    Password = "zofafaizan123",
    Pooling = false,
    SslMode = SslMode.Require,
    TrustServerCertificate = true
};

var connectionString = connectionStringBuilder.ConnectionString;
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// =======================
// JWT AUTH
// =======================

var jwtKey = builder.Configuration["Jwt:Key"] ?? "YourFallbackSecretKeyForLocalOnly";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

builder.Services.AddAuthorization();

// =======================
// DEPENDENCY INJECTION
// =======================

builder.Services.AddScoped<JwtHelper>();
builder.Services.AddScoped<SubscriptionService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<CloudinaryService>();
builder.Services.AddHttpClient();

// =======================
// RATE LIMITING
// =======================

builder.Services.AddMemoryCache();
builder.Services.Configure<IpRateLimitOptions>(
    builder.Configuration.GetSection("IpRateLimiting"));

builder.Services.AddInMemoryRateLimiting();
builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();

// =======================
// CORS
// =======================

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins(
            "http://localhost:3000",
            "http://localhost:5173",
            "https://zofa.pk",
            "https://www.zofa.pk"
        )
        .AllowAnyHeader()
        .AllowAnyMethod());
});

// =======================
// CONTROLLERS + SWAGGER
// =======================

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Zofa B2B Trading API",
        Version = "v1"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Enter: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// =======================
// DATABASE INIT
// =======================

using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        // NOTE: Render + Supabase + Npgsql can throw DivideByZeroException during migrations.
        // Keep app booting even if migration fails.
        try
        {
            db.Database.Migrate();
            Console.WriteLine("Database.Migrate() completed successfully.");
        }
        catch (Exception migrateEx)
        {
            Console.WriteLine($"Database.Migrate() failed (ignored): {migrateEx.Message}");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database Error: {ex.Message}");
        Console.WriteLine(ex.ToString());
        // Rethrow in case we need the full stack trace in logs (Render)
        // throw;
    }
}

// =======================
// MIDDLEWARE
// =======================

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// =======================
// RENDER PORT
// =======================

var port = Environment.GetEnvironmentVariable("PORT") ?? "10000";
app.Run($"http://0.0.0.0:{port}");

