# TODO - Email timeout + SMTP + dev verification tooling

- [x] Update `ZofaB2B.API/Services/EmailService.cs` timeout from 2500ms to 10000ms.
- [x] Add console fallback in `EmailService` for verification emails: print email, code, verification link when SMTP fails/timeout.
- [x] Add dev-only endpoint in `ZofaB2B.API/Controllers/AuthController.cs` to fetch latest unused verification code by email.

- [ ] Update `README.md` with Gmail SMTP configuration steps + env vars.
- [x] Run `dotnet build` for `ZofaB2B.API` and fix any build errors.



