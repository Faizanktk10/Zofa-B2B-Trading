# TODO - Database Connection Fix (DivideByZeroException / Npgsql)

## Step 1: Investigate current DB config
- [x] Read appsettings.json / appsettings.Production.json and Program.cs for connection string usage.
- [x] Identify how Npgsql connection string is parsed and validated.

## Step 2: Update Npgsql package versions
- [x] Update Npgsql.EntityFrameworkCore.PostgreSQL to latest compatible version.
- [x] Update Npgsql core package if referenced/implicitly required.



## Step 3: Fix connection string format defensively
- [x] Ensure required keys exist (Host/Port/Database/Username/Password).
- [x] Normalize common Supabase formats (SSL Mode casing, Trusted cert flag, Command Timeout token correctness).


## Step 4: Add/verify retry logic
- [x] Confirm retry logic handles transient failures without crashing.
- [x] Optionally add a small exponential backoff + jitter.
## faizan


## Step 5: Verify build
- [x] Run `dotnet build` successfully.


## Step 6: Validation on Render
- [x] Confirm logs show successful DB connectivity and no DivideByZeroException.




