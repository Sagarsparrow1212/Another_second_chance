const nodemailer = require('nodemailer');

/**
 * Validate email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidEmail = (email) => {
  if (typeof email !== 'string') return false;

  const normalized = email.trim().toLowerCase();

  // Standard email regex (simple & safe)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(normalized)) return false;

  // Explicitly blocked fake emails
  const blockedEmails = new Set([
    'test@test.com',
    'example@example.com',
    'invalid@invalid.com',
  ]);

  if (blockedEmails.has(normalized)) return false;

  return true;
};


/**
 * Check if error is a bounce/invalid email error
 * @param {Error} error - Error object
 * @returns {boolean} - True if it's a bounce error
 */
const isBounceError = (error) => {
  if (!error || !error.message) {
    return false;
  }
  
  const errorMessage = error.message.toLowerCase();
  const bouncePatterns = [
    'address not found',
    'user unknown',
    'mailbox unavailable',
    'mailbox does not exist',
    'no such user',
    'recipient address rejected',
    'invalid recipient',
    '550',
    '551',
    '553',
    'mail delivery subsystem',
    'delivery failure',
    'undeliverable',
    'bounce',
    'address rejected',
  ];
  
  return bouncePatterns.some(pattern => errorMessage.includes(pattern));
};

// Create transporter - configure with your SMTP settings
// For production, use environment variables for credentials
const createTransporter = () => {
  // Check if email configuration exists in environment variables
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Add error handling for bounces
      pool: true,
      maxConnections: 1,
      maxMessages: 3,
    });
  }

  // If no email configuration, return null (emails will be skipped)
  console.warn('Email configuration not found. Email notifications will be disabled.');
  return null;
};

/**
 * Send approval email to organization
 * @param {string} recipientEmail - Organization email address
 * @param {string} organizationName - Name of the organization
 * @param {string} requestId - Request ID for reference
 */
const sendApprovalEmail = async (recipientEmail, organizationName, requestId) => {
  try {
    // Validate email address before sending
    if (!isValidEmail(recipientEmail)) {
      console.warn(`Invalid email address for approval email: ${recipientEmail}`);
      return { 
        success: false, 
        message: "Invalid email address",
        error: "Email address format is invalid or contains invalid patterns"
      };
    }

    const transporter = createTransporter();

    if (!transporter) {
      console.log("Email service not configured. Skipping approval email.");
      return { success: false, message: "Email service not configured" };
    }

    // App Branding
    const APP_NAME = "HomelyHope";
    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
    const LOGO_URL = 'https://drive.google.com/uc?export=view&id=1RG786HfMBfpRakTrx7_1dp8DzQR1_bnh';


    const dashboardUrl = `${FRONTEND_URL}/dashboard/organizations`;

    const htmlContent = `<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>HomelyHope – Organization Approved</title>

  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f5f7fa;
      font-family: "Arial", sans-serif;
    }
.app-title {
  font-size: 30px;
  font-weight: 700;
  color: #ffffff;
  margin: 10px 0 4px;
  letter-spacing: 0.5px;
}

.app-subtitle {
  font-size: 16px;
  color: #e0e7ff;
  margin: 0;
  font-weight: 500;
}

    .container {
      max-width: 640px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    /* HEADER */
    .header {
      background: linear-gradient(135deg, #1c398e, #3749bb);
      padding: 36px 20px;
      text-align: center;
    }

    .header img {
      width: 110px;
      margin-bottom: 8px;
    }

    .header-title {
      font-size: 28px;
      font-weight: bold;
      color: #ffffff;
      margin: 0;
    }

    /* BODY */
    .content {
      padding: 28px 32px;
      color: #333;
      font-size: 16px;
      line-height: 1.6;
    }

    .highlight-box {
      background: #e8fdf5;
      border-left: 5px solid #10b981;
      padding: 14px 18px;
      border-radius: 6px;
      margin: 18px 0;
      font-size: 15px;
    }

    .btn-container {
      text-align: center;
      margin-top: 28px;
    }

    .button {
      display: inline-block;
      background: #1c398e;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 28px;
      font-size: 16px;
      border-radius: 6px;
      font-weight: bold;
    }

    /* FOOTER */
    .footer {
      padding: 20px;
      text-align: center;
      font-size: 13px;
      color: #777;
    }
  </style>
</head>

<body>

  <div class="container">
    <!-- HEADER -->
   <!-- HEADER -->
<div class="header">
  <h1 class="app-title">HomelyHope</h1>
  <p class="app-subtitle">Organization Approved 🎉</p>
</div>

    <!-- CONTENT -->
    <div class="content">

      <p>Hello <strong>${organizationName}</strong>,</p>

      <p>We are happy to inform you that your organization has been successfully
        <strong style="color:#10b981;">approved</strong> and activated on the HomelyHope platform.</p>

      <div class="highlight-box">
        <p><strong>Request ID:</strong> ${requestId}</p>
        <p><strong>Status:</strong> Approved ✔</p>
      </div>

      <p>You can now:</p>
      <ul>
        <li>Access your organization dashboard</li>
        <li>Post job opportunities</li>
        <li>Manage homeless profiles</li>
        <li>Track applications and connect with users</li>
      </ul>


      <p style="margin-top: 30px;">
        If you need any assistance, our support team is here to help anytime.
      </p>

      <p style="margin-top: 12px;">
        Best Regards,<br />
        <strong>Team HomelyHope</strong>
      </p>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      © 2026 HomelyHope — All Rights Reserved.
    </div>

  </div>

</body>

</html>
`;

    const mailOptions = {
      from:
        process.env.EMAIL_FROM ||
        process.env.GMAIL_USER ||
        "noreply@homelyhope.com",
      to: recipientEmail,
      subject: `🎉 ${APP_NAME} – Your Organization Has Been Approved`,
      html: htmlContent,
      text: `
  Congratulations!
  
  Dear ${organizationName},
  
  Your organization profile has been approved and is now active on the platform.
  
  Request ID: ${requestId}
  Status: Approved
  
  Go to Dashboard: ${FRONTEND_URL}/dashboard/organizations
  
  Best regards,
  The ${APP_NAME} Team
        `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Approval email sent:", info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    // Check if it's a bounce/invalid email error
    if (isBounceError(error)) {
      console.warn(`Email bounce detected for ${recipientEmail}:`, error.message);
      return { 
        success: false, 
        error: "Invalid email address - email could not be delivered",
        bounce: true,
        message: "The email address appears to be invalid or does not exist"
      };
    }
    
    console.error("Error sending approval email:", error);
    return { success: false, error: error.message };
  }
};


/**
 * Send rejection email to organization
 * @param {string} recipientEmail - Organization email address
 * @param {string} organizationName - Name of the organization
 * @param {string} rejectionReason - Reason for rejection
 * @param {string} requestId - Request ID for reference
 * @param {string} rejectionId - Rejection ID for reference
 */
const sendRejectionEmail = async (recipientEmail, organizationName, rejectionReason, requestId, rejectionId) => {
  try {
    // Validate email address before sending
    if (!isValidEmail(recipientEmail)) {
      console.warn(`Invalid email address for rejection email: ${recipientEmail}`);
      return { 
        success: false, 
        message: "Invalid email address",
        error: "Email address format is invalid or contains invalid patterns"
      };
    }

    const transporter = createTransporter();

    if (!transporter) {
      console.log('Email service not configured. Skipping rejection email.');
      return { success: false, message: 'Email service not configured' };
    }

    // App Branding
    const APP_NAME = "HomelyHope";
    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
    const LOGO_URL = 'https://drive.google.com/uc?export=view&id=1RG786HfMBfpRakTrx7_1dp8DzQR1_bnh';

    const dashboardUrl = `${FRONTEND_URL}/dashboard/organizations`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.GMAIL_USER || 'noreply@homelyhope.com',
      to: recipientEmail,
      subject: `${APP_NAME} – Organization Profile Review Update`,
      html: `<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">

  <title>HomelyHope – Profile Review Update</title>

  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f5f7fa;
      font-family: Arial, sans-serif;
    }
.app-title {
  font-size: 30px;
  font-weight: 700;
  color: #ffffff;
  margin: 10px 0 4px;
  letter-spacing: 0.5px;
}

.app-subtitle {
  font-size: 16px;
  color: #e0e7ff;
  margin: 0;
  font-weight: 500;
}

    .container {
      max-width: 640px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    /* HEADER */
    .header {
      background: linear-gradient(135deg, #dc2626, #b91c1c);
      padding: 36px 20px;
      text-align: center;
    }

    .header img {
      width: 110px;
      margin-bottom: 10px;
    }

    .header-title {
      font-size: 26px;
      font-weight: bold;
      color: #ffffff;
      margin: 0;
    }

    /* BODY */
    .content {
      padding: 28px 32px;
      color: #333;
      line-height: 1.6;
      font-size: 16px;
    }

    .alert-box {
      background: #fef2f2;
      padding: 16px 20px;
      border-left: 5px solid #dc2626;
      border-radius: 6px;
      margin: 18px 0;
    }

    .reason-box {
      background: #fff7ed;
      padding: 16px 20px;
      border-left: 5px solid #f59e0b;
      border-radius: 6px;
      margin-top: 18px;
    }

    .btn-container {
      text-align: center;
      margin-top: 28px;
    }

    .button {
      display: inline-block;
      background: #1c398e;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 28px;
      font-size: 16px;
      border-radius: 6px;
      font-weight: bold;
    }

    /* FOOTER */
    .footer {
      padding: 20px;
      text-align: center;
      font-size: 13px;
      color: #777;
    }
  </style>
</head>

<body>

  <div class="container">

    <!-- HEADER -->
   <!-- HEADER -->
<div class="header">
  <h1 class="app-title">HomelyHope</h1>
  <p class="app-subtitle">Profile Review Update</p>
</div>


    <!-- CONTENT -->
    <div class="content">

      <p>Hello <strong>${organizationName}</strong>,</p>

      <p>Thank you for submitting your organization profile for review. After careful evaluation, we regret to inform you that your submission has been <strong style="color:#dc2626;">rejected</strong> for now.</p>

      <!-- STATUS BOX -->
      <div class="alert-box">
        <p><strong>Request ID:</strong> ${requestId}</p>
        <p><strong>Rejection ID:</strong> ${rejectionId}</p>
        <p><strong>Status:</strong> <span style="color:#dc2626;">Rejected</span></p>
      </div>

      <!-- REASON BOX -->
      <div class="reason-box">
        <h3 style="color:#c2410c; margin-top:0;">Reason for Rejection:</h3>
        <p style="margin:0; color:#78350f;">${rejectionReason}</p>
      </div>

      <p style="margin-top:24px;"><strong>Next Steps</strong></p>
      <p>You may:</p>

      <ul>
        <li>Review the feedback provided above</li>
        <li>Update your organization details accordingly</li>
        <li>Resubmit your profile for verification</li>
      </ul>

      <p style="margin-top:30px;">
        If you need clarification or assistance, our team is always here to help.
      </p>

      <p style="margin-top:15px;">
        Best regards,<br>
        <strong>Team HomelyHope</strong>
      </p>

    </div>

    <!-- FOOTER -->
    <div class="footer">
      © 2026 HomelyHope — All Rights Reserved.
    </div>

  </div>

</body>

</html>
`,
      text: `
Profile Review Update

Organization Profile Review

Dear ${organizationName},

Thank you for submitting your organization profile for review. After careful consideration, we regret to inform you that your profile has been rejected at this time.

Request ID: ${requestId}
Rejection ID: ${rejectionId}
Status: Rejected

Reason for Rejection:
${rejectionReason}

What's Next?
You can:
- Review the feedback provided above
- Update your organization profile with the necessary corrections
- Resubmit your profile for review

Visit your dashboard: ${FRONTEND_URL}/dashboard/organizations

If you have any questions about this decision or need clarification on the feedback, please don't hesitate to contact our support team.

Best regards,
The ${APP_NAME} Team
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Rejection email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    // Check if it's a bounce/invalid email error
    if (isBounceError(error)) {
      console.warn(`Email bounce detected for ${recipientEmail}:`, error.message);
      return { 
        success: false, 
        error: "Invalid email address - email could not be delivered",
        bounce: true,
        message: "The email address appears to be invalid or does not exist"
      };
    }
    
    console.error('Error sending rejection email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send Reset Password OTP email
 * @param {string} recipientEmail - User email address
 * @param {string} otp - The One-Time Password
 */
const sendResetPasswordOtpEmail = async (recipientEmail, otp) => {
  try {
    // Validate email address before sending
    if (!isValidEmail(recipientEmail)) {
      console.warn(`Invalid email address for OTP email: ${recipientEmail}`);
      return { 
        success: false, 
        message: "Invalid email address",
        error: "Email address format is invalid or contains invalid patterns"
      };
    }

    const transporter = createTransporter();

    if (!transporter) {
      console.log("Email service not configured.");
      return { success: false, message: "Email service not configured" };
    }

    const APP_NAME = "HomelyHope";
    const LOGO_URL =
      "https://drive.google.com/uc?export=view&id=1RG786HfMBfpRakTrx7_1dp8DzQR1_bnh";

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${APP_NAME} – Reset Password OTP</title>

  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f5f7fa;
      font-family: Arial, sans-serif;
    }
.content-title {
  text-align: center;
  font-size: 22px;
  font-weight: 700;
  color: #1c398e;
  margin: 0 0 16px;
}

.content-subtitle {
  text-align: center;
  font-size: 15px;
  color: #6b7280;
  margin-bottom: 28px;
}

    .container {
      max-width: 640px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .header {
  background: linear-gradient(135deg, #1c398e, #3749bb);
  padding: 32px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
}


  .header img {
  width: 48px;
  height: 48px;
}


   .header-title {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  letter-spacing: 0.5px;
}


    .content {
      padding: 28px 32px;
      color: #333;
      font-size: 16px;
      line-height: 1.6;
    }

    .otp-box {
      margin: 24px 0;
      text-align: center;
    }

    .otp {
      display: inline-block;
      background: #eef2ff;
      color: #1c398e;
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 6px;
      padding: 14px 28px;
      border-radius: 8px;
      border: 1px dashed #1c398e;
    }

    .warning {
      background: #fff7ed;
      border-left: 5px solid #f97316;
      padding: 14px 18px;
      border-radius: 6px;
      margin-top: 20px;
      font-size: 14px;
    }

    .footer {
      padding: 20px;
      text-align: center;
      font-size: 13px;
      color: #777;
    }
  </style>
</head>

<body>

  <div class="container">

    <!-- HEADER -->
   <div class="header">
  <h1 class="header-title">${APP_NAME}</h1>
</div>

    <!-- CONTENT -->
    <div class="content">
      <h2 class="content-title">Reset Your Password</h2>
      <p class="content-subtitle">
       Use the OTP below to securely reset your password
     </p>
     <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p>Hello,</p>

      <p>
        We received a request to reset your password.
        Please use the One-Time Password (OTP) below to continue.
      </p>

      <div class="otp-box">
        <div class="otp">${otp}</div>
      </div>

      <p>This OTP is valid for a limited time.</p>

      <p style="font-size: 14px; color: #666; text-align: center;">
        Never share this OTP with anyone.
      </p>

      <div class="warning">
        If you did not request a password reset, please ignore this email.
        Your account will remain secure.
      </div>

      <p style="margin-top: 24px;">
        Regards,<br />
        <strong>Team ${APP_NAME}</strong>
      </p>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      © ${new Date().getFullYear()} ${APP_NAME} — All Rights Reserved.
    </div>

  </div>

</body>
</html>
`;

    const mailOptions = {
      from:
        process.env.EMAIL_FROM ||
        process.env.GMAIL_USER ||
        "noreply@homelyhope.com",
      to: recipientEmail,
      subject: `${APP_NAME} – Reset Password OTP`,
      html: htmlContent,
      text: `
Reset Password Request

Your OTP: ${otp}

This OTP is valid for a short time.
If you did not request this, ignore this email.

— Team ${APP_NAME}
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("OTP email sent:", info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    // Check if it's a bounce/invalid email error
    if (isBounceError(error)) {
      console.warn(`Email bounce detected for ${recipientEmail}:`, error.message);
      return { 
        success: false, 
        error: "Invalid email address - email could not be delivered",
        bounce: true,
        message: "The email address appears to be invalid or does not exist"
      };
    }
    
    console.error("Error sending OTP email:", error);
    return { success: false, error: error.message };
  }
};



module.exports = {
  sendApprovalEmail,
  sendRejectionEmail,
  sendResetPasswordOtpEmail,
};

