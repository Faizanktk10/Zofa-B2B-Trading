# SendGrid migration (URGENT)

## Goal
Stop Gmail SMTP (535) and use SendGrid API for all outbound emails.

## Implemented in codebase
- `ZofaB2B.API/Services/EmailService.cs` already contains SendGrid integration:
  - reads `SendGrid:ApiKey`, `SendGrid:FromAddress`, `SendGrid:FromName`
  - sends via `SendGridClient.SendEmailAsync()`
  - falls back to SMTP if SendGrid config is missing

## Required configuration
1. Create/update secrets / config with:
   - `SendGrid:ApiKey` (required)
   - `SendGrid:FromAddress` (required)
   - `SendGrid:FromName` (optional)
2. For production: set `App:EnableDevEmailFallback = false`.

## What to verify now
1. Deploy with SendGrid env/secrets correctly set.
2. Trigger registration/verification.
3. Confirm logs contain:
   - `[Email] Using SendGrid for <email>`
4. If still failing, check:
   - API key permissions
   - FromAddress verified in SendGrid
   - SendGrid account sender identity settings

## Next hardening (optional)
- Remove SMTP fallback entirely once confirmed.
- Add structured logging for SendGrid failures.
- Ensure timeout behavior is enforced even with SendGrid client.

