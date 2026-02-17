# Email Service Configuration

This document explains how to configure the email service for sending approval and rejection notifications to organizations.

## Setup Options

### Option 1: Gmail (Recommended for Development/Testing)

1. **Enable 2-Step Verification** on your Gmail account:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification if not already enabled

2. **Generate App Password**:
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and your device
   - Click "Generate"
   - Copy the 16-character password

3. **Add to `.env` file**:
   ```env
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-character-app-password
   EMAIL_FROM=your-email@gmail.com
   FRONTEND_URL=http://localhost:3000
   ```

### Option 2: Custom SMTP Server (Recommended for Production)

Add the following to your `.env` file:

```env
# SMTP Configuration
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false  # true for port 465, false for other ports
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-smtp-password

# Email Settings
EMAIL_FROM=noreply@yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

### Option 3: Other Email Services

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
EMAIL_FROM=noreply@yourdomain.com
```

#### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-aws-ses-username
SMTP_PASS=your-aws-ses-password
EMAIL_FROM=noreply@yourdomain.com
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GMAIL_USER` | Gmail email address (for Gmail option) | No | - |
| `GMAIL_APP_PASSWORD` | Gmail app password (for Gmail option) | No | - |
| `SMTP_HOST` | SMTP server hostname | No | - |
| `SMTP_PORT` | SMTP server port | No | 587 |
| `SMTP_SECURE` | Use TLS/SSL (true for 465, false for others) | No | false |
| `SMTP_USER` | SMTP username | No | - |
| `SMTP_PASS` | SMTP password | No | - |
| `EMAIL_FROM` | Email address to send from | No | GMAIL_USER or noreply@homelessapp.com |
| `FRONTEND_URL` | Frontend URL for email links | No | http://localhost:3000 |

## Testing

If email configuration is not set up, the system will:
- Log a warning message
- Continue processing the approval/rejection (non-blocking)
- Skip sending the email

This ensures that the approval/rejection process works even if email is not configured.

## Email Templates

The service includes two email templates:

1. **Approval Email**: Sent when an organization is approved
   - Includes congratulations message
   - Shows request ID
   - Provides link to dashboard

2. **Rejection Email**: Sent when an organization is rejected
   - Includes rejection reason
   - Shows request ID and rejection ID
   - Provides guidance on next steps
   - Includes link to update profile

## Troubleshooting

### Emails not sending?

1. Check that environment variables are set correctly
2. Verify SMTP credentials are correct
3. Check server logs for error messages
4. For Gmail: Ensure you're using an App Password, not your regular password
5. For production: Check firewall/security group settings allow outbound SMTP

### Common Errors

- **"Invalid login"**: Check your credentials
- **"Connection timeout"**: Check SMTP host and port
- **"Authentication failed"**: Verify username/password
- **"Self-signed certificate"**: Set `SMTP_SECURE=false` or configure SSL properly

## Security Notes

- Never commit `.env` file to version control
- Use App Passwords for Gmail instead of your main password
- Rotate passwords regularly
- Use environment-specific credentials (dev/staging/production)

