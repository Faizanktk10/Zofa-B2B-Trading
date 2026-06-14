# Formspree Email Integration for Zofa B2B

## Overview

This document describes the Formspree email integration for sending verification codes in the Zofa B2B Trading application.

## Configuration

### Formspree Endpoint
- **Endpoint URL**: `https://formspree.io/f/mzdqyvbq`
- **Verified Email**: `faizanktk2006@gmail.com`

### Configuration Files

Add the following to your `appsettings.json` or environment variables:

```json
{
  "Formspree": {
    "Endpoint": "https://formspree.io/f/mzdqyvbq"
  }
}
```

Or set the environment variable:
```
Formspree__Endpoint=https://formspree.io/f/mzdqyvbq
```

## Implementation Details

### EmailService Changes

The `EmailService.SendVerificationCodeAsync` method now:

1. **First attempts** to send via Formspree API using HTTP POST
2. **Falls back** to the existing provider chain (Resend > SendGrid > SMTP) if Formspree fails
3. **Returns** a boolean indicating success/failure

### Formspree API Call

```csharp
private async Task<bool> SendWithFormspreeAsync(string email, string name, string subject, string code, string verificationLink)
{
    var formspreeEndpoint = _config["Formspree:Endpoint"];
    
    if (string.IsNullOrWhiteSpace(formspreeEndpoint))
    {
        Console.WriteLine("[Email] Formspree endpoint not configured");
        return false;
    }

    try
    {
        using var client = new HttpClient();
        client.Timeout = TimeSpan.FromSeconds(30);

        var content = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("email", email),
            new KeyValuePair<string, string>("name", name ?? string.Empty),
            new KeyValuePair<string, string>("code", code),
            new KeyValuePair<string, string>("verificationLink", verificationLink),
            new KeyValuePair<string, string>("subject", subject),
            new KeyValuePair<string, string>("_subject", subject),
            new KeyValuePair<string, string>("_cc", "faizanktk2006@gmail.com"),
            new KeyValuePair<string, string>("_next", verificationLink),
            new KeyValuePair<string, string>("_captcha", "false"),
            new KeyValuePair<string, string>("message", $"Verification code for {name}: {code}")
        });

        var response = await client.PostAsync(formspreeEndpoint, content);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (response.IsSuccessStatusCode)
        {
            Console.WriteLine($"[Email] Formspree response: {responseBody}");
            return true;
        }
        else
        {
            Console.WriteLine($"[Email] Formspree failed: HTTP {(int)response.StatusCode} - {responseBody}");
            return false;
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Email] Formspree exception: {ex.Message}");
        return false;
    }
}
```

## Data Sent to Formspree

| Field | Description |
|-------|-------------|
| `email` | Recipient's email address |
| `name` | Recipient's name |
| `code` | 6-digit verification code |
| `verificationLink` | Full verification URL |
| `subject` | Email subject line |
| `_subject` | Formspree-specific subject override |
| `_cc` | CC to verified admin email |
| `_next` | Redirect URL after form submission |
| `_captcha` | Disable captcha for API calls |
| `message` | Human-readable message with code |

## Error Handling

The integration handles the following scenarios:

1. **Missing Configuration**: Returns `false` if endpoint is not configured
2. **Network Errors**: Catches exceptions and returns `false`
3. **HTTP Errors**: Logs status code and response body
4. **Timeout**: 30-second timeout for HTTP requests

## Fallback Behavior

If Formspree fails, the system automatically falls back to:
1. Resend API (if configured)
2. SendGrid API (if configured)
3. SMTP (if configured)

This ensures verification emails are delivered even if Formspree is unavailable.

## Testing

To test the Formspree integration:

1. Ensure `Formspree:Endpoint` is configured
2. Trigger a verification email (e.g., user registration)
3. Check the console logs for `[Email] Formspree response` messages
4. Verify the email is received at the recipient's address

## Security Notes

- The Formspree endpoint is public and can be called from the server
- Verification codes are transmitted over HTTPS
- No sensitive credentials are required (unlike SMTP)
- The `_cc` field sends a copy to the admin email for monitoring

## Troubleshooting

### Formspree not sending emails

1. Check that the endpoint URL is correct
2. Verify the endpoint is active in your Formspree dashboard
3. Check the console logs for error messages
4. Ensure the verified email is configured in Formspree

### Emails going to spam

1. Verify your domain in Formspree
2. Add SPF/DKIM records to your DNS
3. Check Formspree's sending reputation

### Rate limiting

Formspree has rate limits on free plans. Consider upgrading if you exceed limits.