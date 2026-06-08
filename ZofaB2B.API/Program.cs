using AspNetCoreRateLimit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi.Models;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using ZofaB2B.API.Data;
using ZofaB2B.API.Helpers;
using ZofaB2B.API.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;

Environment.SetEnvironmentVariable("ASPNETCORE_URLS", "");

var builder = WebApplication.CreateBuilder(args);

// Load appsettings.Local.json for local development secrets (gitignored)
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: false);

// 🔥 CRITICAL: Configure Kestrel at builder stage to prevent "Addresses IsReadOnly" error
// Must be done BEFORE .Build() is called
// Bind Kestrel explicitly to the platform-provided port.
// Render may inject PORT; also we fall back to 10000 to match your logs.
var portStr = Environment.GetEnvironmentVariable("PORT")
              ?? Environment.GetEnvironmentVariable("ASPNETCORE_HTTP_PORT")
              ?? "10000";

if (!int.TryParse(portStr, out var port))
{
    port = 10000;
    Console.WriteLine($"⚠️ Invalid PORT='{portStr}', falling back to {port}");
}

builder.WebHost.UseKestrel(options =>
{
    options.ListenAnyIP(port);
    Console.WriteLine($"📡 Kestrel listening on port {port}");
});


// 🔥 IMPORTANT: Force IPv4 (fix Render + Supabase IPv6 issues)
AppContext.SetSwitch("System.Net.DisableIPv6", true);

// =======================
// DATABASE CONNECTION
// =======================

// Use environment variable ConnectionStrings__DefaultConnection (Azure-friendly)
var dbConnectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(dbConnectionString))
{
    throw new InvalidOperationException("ConnectionStrings:DefaultConnection is required. Please set it in appsettings or environment variables.");
}

var npgsqlBuilder = new Npgsql.NpgsqlConnectionStringBuilder(dbConnectionString);
npgsqlBuilder.Pooling = false;  // Supabase pooler handles pooling
if (string.IsNullOrWhiteSpace(npgsqlBuilder.Database))
{
    throw new InvalidOperationException("ConnectionStrings:DefaultConnection must include a valid Database value.");
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(npgsqlBuilder.ConnectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(5),
            errorCodesToAdd: null);
        npgsqlOptions.CommandTimeout(180); // pooler latency may exceed default 60s
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
builder.Services.AddResponseCaching();
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

var defaultDataProtectionPath = RuntimeInformation.IsOSPlatform(OSPlatform.Linux)
    ? "/data/DataProtection-Keys"
    : Path.Combine(AppContext.BaseDirectory, "DataProtection-Keys");

var dataProtectionKeyPath = builder.Configuration["DataProtection:KeyPath"]
    ?? Environment.GetEnvironmentVariable("DATAPROTECTION_KEY_PATH")
    ?? defaultDataProtectionPath;

Directory.CreateDirectory(dataProtectionKeyPath);

var dataProtectionBuilder = builder.Services.AddDataProtection()
    .SetApplicationName("ZofaB2B.API")
    .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionKeyPath));

var dataProtectionCertificate = builder.Configuration["DataProtection:CertificateThumbprint"]
    ?? Environment.GetEnvironmentVariable("DATAPROTECTION_CERT_THUMBPRINT");

if (!string.IsNullOrWhiteSpace(dataProtectionCertificate))
{
    dataProtectionBuilder.ProtectKeysWithCertificate(dataProtectionCertificate);
    Console.WriteLine($"🔐 DataProtection keys will be encrypted with certificate thumbprint {dataProtectionCertificate}.");
}
else
{
    Console.WriteLine($"ℹ️ DataProtection keys will be persisted to {dataProtectionKeyPath}.");
}

// =======================
// CONTROLLERS + SWAGGER
// =======================

builder.Services.AddControllers(options =>
{
    // API is stateless and uses JWT bearer authentication, so antiforgery tokens are not required.
    // This prevents false-positive MVC CSRF findings for JSON API endpoints.
    options.Filters.Add(new IgnoreAntiforgeryTokenAttribute());
});
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

builder.Services.AddHealthChecks();

// Default to true so /swagger is reachable in Production while troubleshooting.
var enableSwaggerInProd = builder.Configuration.GetValue<bool?>("EnableSwaggerInProd") ?? true;


var app = builder.Build();

// =======================
// DATABASE INIT
// =======================

using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // ===== Runtime DB diagnostics (mask password) =====
        var connString = npgsqlBuilder.ConnectionString;
        if (string.IsNullOrWhiteSpace(connString))
        {
            Console.WriteLine("❌ ConnectionStrings:DefaultConnection is NULL/empty at runtime.");
        }
        else
        {
            // Mask Password=... so logs are safe

            var masked = System.Text.RegularExpressions.Regex.Replace(
                connString,
                @"(?i)(password\s*=)\s*[^;]+",
                "$1***",
                System.Text.RegularExpressions.RegexOptions.Compiled);

            Console.WriteLine($"ℹ️ Using DB connection string: {masked}");

            // Try extracting Host/Port for clarity
            var hostMatch = System.Text.RegularExpressions.Regex.Match(masked, @"(?i)(Host=)([^;]+)");
            var portMatch = System.Text.RegularExpressions.Regex.Match(masked, @"(?i)(Port=)([^;]+)");
            var host = hostMatch.Success ? hostMatch.Groups[2].Value : "(unknown)";
            var portVal = portMatch.Success ? portMatch.Groups[2].Value : "(default)";
            Console.WriteLine($"ℹ️ DB host={host}, port={portVal}");
        }

        // ===== Retrying startup connectivity test =====
        // Useful for transient DNS/network glitches on platform startup.
        var maxAttempts = builder.Configuration.GetValue<int?>("DbConnect:MaxAttempts") ?? 5;
        var delayMs = builder.Configuration.GetValue<int?>("DbConnect:DelayMs") ?? 1500;

        var lastConnectException = (Exception?)null;
        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                Console.WriteLine($"Checking database connectivity (attempt {attempt}/{maxAttempts})...");

                // Create a fresh NpgsqlConnection each attempt to avoid disposed/pooled instance issues.
                // IMPORTANT: do not touch db.Database.GetDbConnection() here.
                await using (var conn = new Npgsql.NpgsqlConnection(connString))
                {
                    await conn.OpenAsync();
                    // explicit close for clean lifecycle
                    await conn.CloseAsync();
                }

                Console.WriteLine("Database connectivity OK (connection opened).");
                lastConnectException = null;
                break;
            }
            catch (Exception connectEx)
            {
                lastConnectException = connectEx;
                Console.WriteLine($"Database connectivity attempt {attempt} failed: {connectEx.Message}");
                Console.WriteLine(connectEx.ToString());

                if (attempt < maxAttempts)
                {
                    var waitFor = delayMs * attempt; // simple linear backoff
                    Console.WriteLine($"Waiting {waitFor}ms before next attempt...");
                    await Task.Delay(waitFor);
                }
            }
        }


        if (lastConnectException != null)
        {
            Console.WriteLine("❌ Unable to connect to database after retries.");
            // In dev, we don't want to crash the whole web host (prevents diagnosing other issues).
            // Login requests will still fail, but Swagger/health endpoints stay up.
            // For production, you can enable fail-fast by setting DbConnect:FailFast=true.
            var failFast = builder.Configuration.GetValue<bool?>("DbConnect:FailFast") ?? false;
            if (failFast)
                throw lastConnectException;
        }

        // NOTE:
        // Running migrations automatically on Render can crash/poison the first DB operation.
        // We keep migrations disabled by default; controlled release should enable them.
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

if (app.Environment.IsDevelopment() || enableSwaggerInProd)
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseResponseCaching();
app.UseCors("AllowFrontend"); // MUST be before UseAuthentication

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapHealthChecks("/health");

// Port-agnostic: do not attempt to bind/modify URLs in code.
// Host/platform (IIS reverse proxy / container mapping) controls the listen address.
app.Run();

//faizan
