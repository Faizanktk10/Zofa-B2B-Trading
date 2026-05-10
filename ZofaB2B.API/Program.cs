    using AspNetCoreRateLimit;
    using Microsoft.AspNetCore.Authentication.JwtBearer;
    using Microsoft.EntityFrameworkCore;
    using Microsoft.IdentityModel.Tokens;
    using Microsoft.OpenApi.Models;
    using System.Text;
    using ZofaB2B.API.Data;
    using ZofaB2B.API.Helpers;
    using ZofaB2B.API.Services;

    var builder = WebApplication.CreateBuilder(args);

   // Direct connection string bina kisi configuration file ke dependency ke
var connectionString = "Host=db.txhucwgwklbkvrkyyjsh.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=#zofafaizan#123;SSL Mode=Require;Trust Server Certificate=true;";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

    // 2. JWT Authentication
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

    // 3. Dependency Injection (Services)
    builder.Services.AddScoped<JwtHelper>();
    builder.Services.AddScoped<SubscriptionService>();
    builder.Services.AddScoped<EmailService>();
    builder.Services.AddScoped<CloudinaryService>();
    builder.Services.AddHttpClient();

    // 4. Rate Limiting
    builder.Services.AddMemoryCache();
    builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("IpRateLimiting"));
    builder.Services.AddInMemoryRateLimiting();
    builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();

    // 5. CORS Policy
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend", policy =>
            policy.WithOrigins(
                "http://localhost:3000",
                "http://localhost:5173",
                "https://zofa.pk",
                "https://www.zofa.pk")
                .AllowAnyHeader()
                .AllowAnyMethod());
    });

    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();

    // 6. Swagger Setup
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo { Title = "Zofa B2B Trading API", Version = "v1" });
        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Description = "JWT Authorization header. Enter: Bearer {token}",
            Name = "Authorization",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.ApiKey,
            Scheme = "Bearer"
        });
        c.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
                Array.Empty<string>()
            }
        });
    });

    var app = builder.Build();

    // 7. Auto-migrate on startup (Critical for Production)
   // 7. Auto-migrate on startup (Updated for Force Create)
using (var scope = app.Services.CreateScope())
{
    try 
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        
        // Ye line pehle check karegi connection, phir tables banayegi
        // Agar migrations kaam nahi kar rahi, to ye direct schema bana deta hai
        db.Database.EnsureCreated(); 
        
        Console.WriteLine("Database check/creation successful!");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database Error: {ex.Message}");
    }
}

    // 8. Middleware Pipeline
    app.UseSwagger();
    app.UseSwaggerUI();

    app.UseIpRateLimiting();
    app.UseCors("AllowFrontend");
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();

    // 9. Port Binding for Render (Critical Fix)
    var port = Environment.GetEnvironmentVariable("PORT") ?? "10000";
    app.Run($"http://0.0.0.0:{port}");