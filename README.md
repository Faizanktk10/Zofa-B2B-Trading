<<<<<<< HEAD
# ZOFA B2B TRADING

Pakistan's #1 B2B Marketplace — connecting buyers and suppliers for industrial goods.

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Backend    | ASP.NET Core 8 Web API            |
| Database   | SQL Server + EF Core 8            |
| Auth       | JWT Bearer Tokens                 |
| Frontend   | React 18 + Vite + Bootstrap 5     |
| Payments   | JazzCash / EasyPaisa (manual)     |

---

## Project Structure

```
Zofa B2B Trading/
├── ZofaB2B.API/          # .NET 8 Web API
│   ├── Controllers/      # API endpoints
│   ├── Models/           # EF Core entities
│   ├── DTOs/             # Request/Response DTOs
│   ├── Data/             # DbContext + migrations
│   ├── Services/         # Business logic
│   └── Helpers/          # JWT helper
└── zofa-frontend/        # React + Vite app
    └── src/
        ├── pages/        # All page components
        ├── components/   # Navbar, Footer, SEO, NotificationBell
        ├── context/      # AuthContext
        └── api.js        # Axios client
```

---

## Local Development Setup

### Prerequisites
- .NET 8 SDK
- SQL Server (LocalDB or full)
- Node.js 18+

### Backend

1. Update connection string in `ZofaB2B.API/appsettings.json`:
```json
"DefaultConnection": "Server=localhost;Database=ZofaB2BDb;Trusted_Connection=True;TrustServerCertificate=True;"
```

2. Run the API:
```bash
cd ZofaB2B.API
dotnet run
```

- API runs at: `http://localhost:5000`
- Swagger UI: `http://localhost:5000/swagger`
- Database is auto-migrated on first run
- Seeded admin: `admin@zofa.pk` / `Admin@123`

### Frontend

```bash
cd zofa-frontend
npm install
npm run dev
```

- Runs at: `http://localhost:3000`

---

## Production Deployment

### Backend (IIS / Windows Server)

1. Publish the API:
```bash
cd ZofaB2B.API
dotnet publish -c Release -o ./publish
```

2. Copy `publish/` to your IIS site folder
3. Update `appsettings.Production.json` with real DB credentials and JWT secret
4. Set environment variable: `ASPNETCORE_ENVIRONMENT=Production`
5. Create IIS Application Pool (.NET CLR: No Managed Code)

### Frontend (IIS)

1. Build the frontend:
```bash
cd zofa-frontend
npm run build
```

2. Copy `dist/` contents to IIS wwwroot
3. The included `web.config` handles SPA routing automatically

### Update API URL for Production

In `zofa-frontend/src/api.js`, change:
```js
baseURL: 'http://localhost:5000/api'
```
to:
```js
baseURL: 'https://api.zofa.pk/api'
```

---

## Default Credentials

| Role     | Email              | Password   |
|----------|--------------------|------------|
| Admin    | admin@zofa.pk      | Admin@123  |

---

## Key Features

- RFQ posting and browsing system
- Quotation submission with daily limits (free: 5/day)
- Premium subscription (PKR 2,500/month or PKR 20,000/year)
- Lead unlock system (PKR 200/lead)
- In-platform messaging with notification bell
- Admin panel: users, RFQs, payments, suppliers
- SEO meta tags on all pages
- Mobile responsive (Bootstrap 5)
- JWT authentication with role-based access

---

## Monetization

| Revenue Stream        | Price (PKR)     |
|-----------------------|-----------------|
| Premium Monthly       | 2,500 / month   |
| Premium Yearly        | 20,000 / year   |
| Lead Unlock           | 200 / lead      |
| Featured RFQ          | 500 / 7 days    |
| Featured Supplier     | 1,500 / month   |
=======
# zofa-b2b
B2B marketplace platform like Tradewheel (RFQ + Supplier system)
>>>>>>> c9dc2ef78a52c7077df80c34e5b4758ab990971e
