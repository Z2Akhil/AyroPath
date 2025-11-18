import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(to, subject, html, text = '') {
    try {
      if (!this.transporter) {
        this.initializeTransporter();
      }

      const mailOptions = {
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to,
        subject,
        text,
        html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmail(email, firstName) {
    const subject = 'Welcome to AryoPath - Your Health Journey Starts Here!';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to AryoPath!</h1>
            <p>Your trusted partner in health diagnostics</p>
          </div>
          <div class="content">
            <h2>Hello ${firstName},</h2>
            <p>Welcome to AryoPath! We're excited to have you on board and look forward to helping you with all your health diagnostic needs.</p>
            
            <p>With your AryoPath account, you can:</p>
            <ul>
              <li>Book diagnostic tests easily</li>
              <li>Track your test results</li>
              <li>Manage your health profile</li>
              <li>Access exclusive health packages</li>
            </ul>

            <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
            
            <p>Best regards,<br>The AryoPath Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Welcome to AryoPath, ${firstName}! We're excited to have you on board. You can now book diagnostic tests, track results, and manage your health profile.`;

    return await this.sendEmail(email, subject, html, text);
  }

  async sendPasswordResetEmail(email, resetToken) {
    const subject = 'Reset Your AryoPath Password';
    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello,</h2>
            <p>We received a request to reset your password for your AryoPath account.</p>
            <p>Click the button below to reset your password:</p>
            
            <a href="${resetLink}" class="button">Reset Password</a>
            
            <p>If you didn't request this reset, please ignore this email. Your password will remain unchanged.</p>
            <p>This link will expire in 1 hour for security reasons.</p>
            
            <p>Best regards,<br>The AryoPath Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Password Reset Request\n\nWe received a request to reset your password. Click this link to reset: ${resetLink}\n\nIf you didn't request this, please ignore this email.`;

    return await this.sendEmail(email, subject, html, text);
  }

  async sendPasswordChangedEmail(email, firstName) {
    const subject = 'Your AryoPath Password Has Been Changed';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Updated</h1>
          </div>
          <div class="content">
            <h2>Hello ${firstName},</h2>
            <p>This is a confirmation that your AryoPath account password has been successfully changed.</p>
            
            <p>If you made this change, no further action is needed.</p>
            <p>If you didn't make this change, please contact our support team immediately.</p>
            
            <p>Best regards,<br>The AryoPath Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Your AryoPath password has been successfully changed. If you didn't make this change, please contact support immediately.`;

    return await this.sendEmail(email, subject, html, text);
  }

  async sendEmailOTP(email, otp) {
    // Development mode - log OTP to console instead of sending email
    if (process.env.NODE_ENV === 'development' || !process.env.SMTP_HOST || process.env.SMTP_HOST === 'your-smtp-host') {
      console.log(`📧 [DEV MODE] Email OTP for ${email}: ${otp}`);
      console.log(`📧 [DEV MODE] In production, this OTP would be sent via email to ${email}`);
      return { success: true, messageId: 'dev-mode-otp-logged' };
    }

    const subject = 'Your AryoPath Verification Code';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-code { background: #667eea; color: white; padding: 15px 30px; font-size: 24px; font-weight: bold; text-align: center; border-radius: 5px; margin: 20px 0; letter-spacing: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Verification</h1>
          </div>
          <div class="content">
            <h2>Hello,</h2>
            <p>Thank you for registering with AryoPath. Please use the following verification code to complete your registration:</p>
            
            <div class="otp-code">${otp}</div>
            
            <p>This code will expire in 10 minutes for security reasons.</p>
            <p>If you didn't request this verification, please ignore this email.</p>
            
            <p>Best regards,<br>The AryoPath Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Your AryoPath verification code is: ${otp}\n\nThis code will expire in 10 minutes. If you didn't request this verification, please ignore this email.`;

    return await this.sendEmail(email, subject, html, text);
  }
}

export default new EmailService();
