import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EmailService {
  constructor() {
    this.transporter = null;
    this.templates = {};
    this.initializeTransporter();
    this.loadTemplates();
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

  async loadTemplates() {
    try {
      const templatesDir = path.join(__dirname, '../templates/email');
      
      // Load all HTML templates
      const files = await fs.readdir(templatesDir);
      const htmlFiles = files.filter(file => file.endsWith('.html'));
      
      for (const file of htmlFiles) {
        const templateName = path.basename(file, '.html');
        const templatePath = path.join(templatesDir, file);
        const content = await fs.readFile(templatePath, 'utf-8');
        this.templates[templateName] = content;
      }
      
      console.log(`Loaded ${htmlFiles.length} email templates`);
    } catch (error) {
      console.error('Error loading email templates:', error);
      // Use fallback templates if file loading fails
      this.loadFallbackTemplates();
    }
  }

  loadFallbackTemplates() {
    // Fallback templates (same as before but stored in memory)
    this.templates = {
      'welcome': `<!DOCTYPE html><html>...welcome template...</html>`,
      'password-reset': `<!DOCTYPE html><html>...password reset template...</html>`,
      'password-changed': `<!DOCTYPE html><html>...password changed template...</html>`,
      'otp': `<!DOCTYPE html><html>...otp template...</html>`,
      'notification-promotional': `<!DOCTYPE html><html>...promotional notification template...</html>`,
      'notification-informational': `<!DOCTYPE html><html>...informational notification template...</html>`
    };
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

  renderTemplate(templateName, variables = {}) {
    let template = this.templates[templateName];
    
    if (!template) {
      throw new Error(`Template "${templateName}" not found`);
    }

    // Replace variables in template
    Object.keys(variables).forEach(key => {
      const placeholder = `{{${key}}}`;
      const value = variables[key] || '';
      template = template.replace(new RegExp(placeholder, 'g'), value);
    });

    return template;
  }

  async sendWelcomeEmail(email, firstName) {
    const subject = 'Welcome to AyroPath - Your Health Journey Starts Here!';
    
    const html = this.renderTemplate('welcome', { firstName });
    
    const text = `Welcome to AyroPath, ${firstName}! We're excited to have you on board. You can now book diagnostic tests, track results, and manage your health profile.`;

    return await this.sendEmail(email, subject, html, text);
  }

  async sendPasswordResetEmail(email, resetToken) {
    const subject = 'Reset Your AyroPath Password';
    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const html = this.renderTemplate('password-reset', { resetLink });
    
    const text = `Password Reset Request\n\nWe received a request to reset your password. Click this link to reset: ${resetLink}\n\nIf you didn't request this, please ignore this email.`;

    return await this.sendEmail(email, subject, html, text);
  }

  async sendPasswordChangedEmail(email, firstName) {
    const subject = 'Your AyroPath Password Has Been Changed';
    
    const html = this.renderTemplate('password-changed', { firstName });
    
    const text = `Your AyroPath password has been successfully changed. If you didn't make this change, please contact support immediately.`;

    return await this.sendEmail(email, subject, html, text);
  }

  async sendEmailOTP(email, otp, purpose = "Verification") {
    // Check if SMTP is configured - if not, log to console
    if (!process.env.SMTP_HOST || process.env.SMTP_HOST === 'your-smtp-host' || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`📧 [DEV MODE] ${purpose} OTP for ${email}: ${otp}`);
      console.log(`📧 [DEV MODE] In production, this OTP would be sent via email to ${email}`);
      return { success: true, messageId: 'dev-mode-otp-logged' };
    }

    const subject = `Your AyroPath ${purpose} Code`;
    
    const html = this.renderTemplate('otp', { purpose, otp });
    
    const text = `Your AyroPath ${purpose.toLowerCase()} code is: ${otp}\n\nThis code will expire in 10 minutes. If you didn't request this verification, please ignore this email.`;

    return await this.sendEmail(email, subject, html, text);
  }

  async sendNotificationEmail(email, subject, content, emailType, variables = {}) {
    try {
      // Check if SMTP is configured - if not, log to console
      if (!process.env.SMTP_HOST || process.env.SMTP_HOST === 'your-smtp-host' || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log(`📧 [DEV MODE] Notification email to ${email}: ${subject}`);
        console.log(`📧 [DEV MODE] Content: ${content.substring(0, 100)}...`);
        return { success: true, messageId: 'dev-mode-notification-logged' };
      }

      const templateName = emailType === 'promotional' 
        ? 'notification-promotional' 
        : 'notification-informational';

      // Add content to variables
      const templateVariables = {
        ...variables,
        subject,
        content,
        unsubscribeLink: `${process.env.CLIENT_URL || 'http://localhost:3000'}/unsubscribe`,
        preferencesLink: `${process.env.CLIENT_URL || 'http://localhost:3000'}/account/preferences`
      };

      const html = this.renderTemplate(templateName, templateVariables);
      
      // Create plain text version (content with line breaks)
      const text = `${subject}\n\n${content}\n\nThank you for being a valued AyroPath customer!\n\nBest regards,\nThe AyroPath Team`;

      return await this.sendEmail(email, subject, html, text);
    } catch (error) {
      console.error('Error sending notification email:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new EmailService();
