# Zofa B2B Trading — Amazon Q Code Review Rules

## Severity Filter
Only report CRITICAL and HIGH severity findings.
Suppress INFO, LOW, and MEDIUM severity findings entirely.

## Focus On (always report these)
- CWE-798: Hardcoded credentials in active source code files
- CWE-89: SQL Injection via string concatenation or FromSqlRaw
- CWE-352: CSRF vulnerabilities in state-changing form endpoints
- CWE-209: Stack trace or internal exception detail exposed to client
- CWE-400: Denial of service via unbounded queries or resource exhaustion
- CWE-22: Path traversal vulnerabilities
- CWE-78: OS command injection

## Suppress / Ignore (never report these)
- Any finding in files matching: **/bin/**
- Any finding in files matching: **/obj/**
- Any finding in files matching: **/*.deps.json
- Any finding in files matching: **/*.runtimeconfig.json
- Any finding in files matching: **/Migrations/*.Designer.cs
- Any finding in files matching: **/Migrations/*ModelSnapshot.cs
- Any finding in files matching: **/node_modules/**
- Any finding in files matching: **/dist/**
- Any finding in files matching: **/package-lock.json
- i18n and internationalization warnings
- Missing translation warnings
- Seed data credentials in migration files (these are not production credentials)
- Package vulnerability warnings sourced from *.deps.json auto-generated files

## Project Context
- Backend: ASP.NET Core 8 Web API using Entity Framework Core (all DB queries are parameterized by default — no raw SQL)
- Auth: JWT Bearer tokens (not cookies, so CSRF via cookies does not apply)
- Database: PostgreSQL via Npgsql + EF Core
- Frontend: React 18 SPA (no server-rendered forms, so traditional CSRF does not apply)
- All secrets have been moved to appsettings.Local.json (gitignored) and User Secrets
- Migration Designer files contain only seed data hashes, not production credentials
