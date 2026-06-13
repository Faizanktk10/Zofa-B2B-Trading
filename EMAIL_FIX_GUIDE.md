# Email Sending Fix Guide

## Problem
Emails are not being sent from your Render deployment. The logs show:
```
[Email] Using SMTP for faizanktk2006@gmail.com
[Email] SMTP host=smtp.gmail.com, port=587, username=faizanktk2006@gmail.com
[Email] Timeout - Could not send within 10000ms to faizanktk2006@gmail.com
```

## Root Cause
The application is configured to use Gmail SMTP (`smtp.gmail.com:587`), but this is failing because:

1. **Gmail requires an App Password** - If you have 2-Factor Authentication (2FA) enabled on your Google account (which is recommended), you cannot use your regular Gmail password. You must generate an **App Password** from your Google Account settings.

2. **Cloud platform restrictions** - Render and other cloud platforms may have network restrictions that block or throttle outbound SMTP connections to Gmail.

3. **Gmail rate limits** - Gmail has strict rate limits for SMTP sending, especially from cloud IP addresses.

## Solutions (Choose One)

### Option 1: Fix Gmail SMTP (Quick Fix)
If you want to continue using Gmail:

1. **Enable 2FA on your Google Account** (if not already enabled):
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate an App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)
   - **Remove spaces** from the password when configuring

3. **Update Render Environment Variables**:
   - Go to your Render dashboard
   - Find your web service
   - Update the environment variables:
     ```
     Email__Host=smtp.gmail.com
     Email__Port=587
     Email__Username=faizanktk2006@gmail.com
     Email__Password=your_16_character_app_password (no spaces)
     Email__FromName=Zofa B2B Trading
     Email__FromAddress=faizanktk2006@gmail.com
     ```

4. **Redeploy** your application

### Option 2: Use Brevo (Recommended - Free & Reliable)
Brevo (formerly Sendinblue) is a professional email service with a generous free tier (300 emails/day).

1. **Sign up for Brevo**: https://www.brevo.com

2. **Get your SMTP credentials**:
   - Go to Dashboard → SMTP & API section
   - Copy your SMTP credentials

3. **Update Render Environment Variables**:
   ```
   Email__Host=smtp-relay.brevo.com
   Email__Port=587
   Email__Username=your-brevo-username@smtp-brevo.com
   Email__Password=your-brevo-password
   Email__FromName=Zofa B2B Trading
   Email__FromAddress=your-verified-sender@domain.com
   ```

4. **Redeploy** your application

### Option 3: Use Resend API (Most Reliable)
Resend is a modern email API that's more reliable than SMTP.

1. **Sign up for Resend**: https://resend.com

2. **Get your API Key**:
   - Go to Dashboard → API Keys
   - Create a new API key

3. **Add a verified domain** (required for production):
   - Go to Dashboard → Domains
   - Add your domain and configure DNS records

4. **Update Render Environment Variables**:
   ```
   Resend__ApiKey=re_your_api_key_here
   Resend__FromAddress=onboarding@resend.dev (or your verified domain email)
   Resend__FromName=Zofa B2B Trading
   ```

5. **Redeploy** your application

### Option 4: Use SendGrid API
SendGrid is another reliable email service (100 emails/day free).

1. **Sign up for SendGrid**: https://sendgrid.com

2. **Create an API Key**:
   - Go to Settings → API Keys
   - Create a new API key with "Full Access"

3. **Update Render Environment Variables**:
   ```
   SendGrid__ApiKey=SG.your_api_key_here
   SendGrid__FromAddress=your-verified-sender@domain.com
   SendGrid__FromName=Zofa B2B Trading
   ```

4. **Redeploy** your application

## Code Changes Applied
I've already updated the `EmailService.cs` with the following improvements:

1. **Increased timeout** from 10 seconds to 30 seconds for better reliability
2. **Enhanced error logging** to show specific SMTP errors and inner exceptions
3. **Better error messages** to help diagnose authentication issues

## Verifying the Fix
After applying one of the solutions above:

1. **Redeploy** your application on Render
2. **Check the logs** for email sending attempts
3. Look for success messages like:
   ```
   [Email] Sent successfully to user@example.com (SMTP)
   ```
   or
   ```
   [Email] Sent successfully to user@example.com (Resend)
   ```

## Current Configuration
Based on your `appsettings.json`, you have Brevo configured:
```json
"Email": {
  "Host": "smtp-relay.brevo.com",
  "Port": 587,
  "Username": "ae0498001@smtp-brevo.com",
  "Password": "xsmtpsib-...",
  "FromName": "Zofa B2B Trading",
  "FromAddress": "faizanktk2006@gmail.com"
}
```

However, Render environment variables are overriding this with Gmail settings. You should either:
- **Remove the Gmail environment variables** from Render to use the Brevo config from appsettings.json
- **Update the Gmail environment variables** to use Brevo settings instead

## Important Notes
- Never commit passwords or API keys to Git
- Always use environment variables for sensitive configuration
- The verification code will still be printed in the console logs as a fallback for debugging