using AspNetCoreRateLimit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using ZofaB2B.API.Data;
using ZofaB2B.API.Helpers;
using ZofaB2B.API.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);




// 🔥 IMPORTANT: Force IPv4 (fix Render + Supabase IPv6 issues)
AppContext.SetSwitch("System.Net.DisableIPv6", true);

// =======================
// DATABASE CONNECTION
// =======================

// Use Render env var (recommended) instead of hardcoding secrets/hostnames
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"),
    npgsqlOptions =>
    {
        npgsqlOptions.CommandTimeout(60);
        npgsqlOptions.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null);
    }));



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

        // Startup connectivity test (helps diagnose 500s during first request)
        try
        {
            Console.WriteLine("Checking database connectivity...");
            await db.Database.CanConnectAsync();
            Console.WriteLine("Database connectivity OK.");
        }
        catch (Exception connectEx)
        {
            Console.WriteLine($"Database connectivity test failed: {connectEx.Message}");
            Console.WriteLine(connectEx.ToString());
        }

        // NOTE:
        // Running migrations automatically on Render can crash/poison the first DB operation (your stack shows DivideByZeroException inside Npgsql).
        // Disable auto-migrate by default; run migrations in a controlled release step instead.
        var runMigrations = builder.Configuration.GetValue<bool>("RunMigrations");
        if (runMigrations)
        {
            try
            {
                db.Database.Migrate();
                Console.WriteLine("Database.Migrate() completed successfully.");
            }
            catch (Exception migrateEx)
            {
                Console.WriteLine($"Database.Migrate() failed: {migrateEx.Message}");
                Console.WriteLine(migrateEx);
                throw; // fail fast when migrations are explicitly requested
            }
        }
        else
        {
            Console.WriteLine("Skipping Database.Migrate() (set RunMigrations=true to enable). ");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database Error: {ex.Message}");
        Console.WriteLine(ex.ToString());
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

