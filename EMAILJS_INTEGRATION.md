# EmailJS Integration Guide

This document describes the EmailJS integration for sending verification codes and other emails in the Zofa B2B Trading application.

## Overview

EmailJS is integrated at both the frontend and backend levels to provide reliable email delivery for verification codes and other transactional emails.

## Configuration

### EmailJS Credentials

| Parameter | Value |
|-----------|-------|
| Service ID | `service_2ccciqm` |
| Template ID | `template_j2419fj` |
| Public Key | `0rpuOjkQdLmEVGOSP` |
| Connected Gmail | `faizanktk2006@gmail.com` |

### Environment Variables

#### Frontend (.env / .env.production)
```env
VITE_EMAILJS_SERVICE_ID=service_2ccciqm
VITE_EMAILJS_TEMPLATE_ID=template_j2419fj
VITE_EMAILJS_PUBLIC_KEY=0rpuOjkQdLmEVGOSP
```

#### Backend (appsettings.json)
```json
"EmailJS": {
  "ServiceId": "service_2ccciqm",
  "TemplateId": "template_j2419fj",
  "PublicKey": "0rpuOjkQdLmEVGOSP",
  "GmailAddress": "faizanktk2006@gmail.com"
}
```

## Frontend Integration

### EmailJS Service (`zofa-frontend/src/services/emailjs.js`)

The frontend EmailJS service provides methods for sending emails directly from the browser:

```javascript
import { sendVerificationEmail, sendWelcomeEmail } from './services/emailjs';

// Send verification code
const result = await sendVerificationEmail(
  'user@example.com',
  'John Doe',
  '123456',
  'https://zofa.pk/verify-email?email=user@example.com&code=123456'
);

// Send welcome email
const welcomeResult = await sendWelcomeEmail(
  'user@example.com',
  'John Doe',
  'Buyer'
);
```

### Template Parameters

The EmailJS template should accept the following parameters:

| Parameter | Description |
|-----------|-------------|
| `to_email` | Recipient email address |
| `to_name` | Recipient name |
| `verification_code` | 6-digit verification code |
| `verification_link` | Direct verification link |
| `from_name` | Sender name (Zofa B2B Trading) |
| `subject` | Email subject |
| `user_role` | User role (Buyer/Supplier) |

## Backend Integration

### EmailJSService (`ZofaB2B.API/Services/EmailJSService.cs`)

The backend service provides HTTP-based email sending:

```csharp
public class EmailJSService
{
    public async Task<bool> SendVerificationCodeAsync(string toEmail, string toName, string code);
    public async Task<bool> SendWelcomeEmailAsync(string toEmail, string toName, string role);
}
```

### EmailJS Controller (`ZofaB2B.API/Controllers/EmailJSController.cs`)

REST API endpoints for sending emails via EmailJS:

#### Send Verification Code
```http
POST /api/emailjs/send-verification
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "code": "123456"
}
```

#### Send Welcome Email
```http
POST /api/emailjs/send-welcome
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "role": "Buyer"
}
```

## Email Template Setup

To configure the EmailJS template:

1. Log in to [EmailJS Dashboard](https://dashboard.emailjs.com/)
2. Go to **Email Services** → Select your service (`service_2ccciqm`)
3. Go to **Email Templates** → Create or edit template (`template_j2419fj`)
4. Use the following template structure:

```html
<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>
  <div style='background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:30px;text-align:center'>
    <h1 style='color:#fff;margin:0'><span style='color:#e94560'>ZOFA</span> B2B TRADING</h1>
  </div>
  <div style='padding:30px;background:#fff'>
    <h2>Verify Your Email</h2>
    <p>Hi {{to_name}}, use this 6-digit code to activate your Zofa B2B account:</p>
    <div style='background:#f8f9fa;padding:20px;border-radius:8px;text-align:center;margin:20px 0;border:2px dashed #e94560'>
      <span style='font-size:32px;font-weight:bold;letter-spacing:8px;color:#e94560'>{{verification_code}}</span>
    </div>
    <p style='color:#666;font-size:14px'>This code expires in <strong>15 minutes</strong>. Do not share it with anyone.</p>
    <p style='margin-top:18px;font-size:14px;color:#444'>
      If you prefer, you can open this link:
      <br/>
      <a href='{{verification_link}}'>{{verification_link}}</a>
    </p>
  </div>
  <div style='padding:15px;background:#f8f9fa;text-align:center;color:#999;font-size:12px'>
    Zofa B2B Trading · Pakistan's #1 B2B Marketplace
  </div>
</div>
```

## Files Modified/Created

### Frontend
- `zofa-frontend/src/services/emailjs.js` (new)
- `zofa-frontend/.env` (modified)
- `zofa-frontend/.env.production` (modified)
- `zofa-frontend/package.json` (modified - added @emailjs/browser)

### Backend
- `ZofaB2B.API/Services/EmailJSService.cs` (new)
- `ZofaB2B.API/Controllers/EmailJSController.cs` (new)
- `ZofaB2B.API/Program.cs` (modified - registered EmailJSService)
- `ZofaB2B.API/appsettings.json` (modified - added EmailJS config)

## Testing

### Test Frontend EmailJS
```javascript
// In browser console on the frontend
import { sendVerificationEmail } from './services/emailjs';
await sendVerificationEmail('test@example.com', 'Test User', '123456', 'https://zofa.pk/verify');
```

### Test Backend API
```bash
curl -X POST https://zofa-b2b-trading.onrender.com/api/emailjs/send-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","code":"123456"}'
```

## Troubleshooting

1. **Emails not sending**: Check EmailJS dashboard for error logs
2. **Template not found**: Verify Template ID matches in both frontend and backend
3. **Rate limits**: EmailJS free plan has limits (200 emails/month)
4. **CORS issues**: Ensure EmailJS service is properly initialized with public key