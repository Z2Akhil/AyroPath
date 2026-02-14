import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';

class EmailService {
    private transporter: nodemailer.Transporter | null = null;
    private templates: Record<string, string> = {};

    constructor() {
        this.initializeTransporter();
        this.loadTemplates();
    }

    private initializeTransporter() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: process.env.SMTP_PORT === '465',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    private async loadTemplates() {
        try {
            const templatesDir = path.join(process.cwd(), 'lib/templates/email');
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
            this.loadFallbackTemplates();
        }
    }

    private loadFallbackTemplates() {
        this.templates = {
            'welcome': '<!DOCTYPE html><html><body><h1>Welcome {{firstName}}!</h1></body></html>',
            'password-reset': '<!DOCTYPE html><html><body><h1>Reset Password</h1></body></html>',
            'password-changed': '<!DOCTYPE html><html><body><h1>Password Changed</h1></body></html>',
            'otp': '<!DOCTYPE html><html><body><h1>Your OTP: {{otp}}</h1></body></html>',
            'notification-promotional': '<!DOCTYPE html><html><body><h1>{{subject}}</h1></body></html>',
            'notification-informational': '<!DOCTYPE html><html><body><h1>{{subject}}</h1></body></html>'
        };
    }

    async sendEmail(to: string, subject: string, html: string, text = '') {
        try {
            if (!this.transporter) {
                this.initializeTransporter();
            }

            const mailOptions = {
                from: `"${process.env.SMTP_FROM_NAME || 'AryoPath'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
                to,
                subject,
                text,
                html,
            };

            const result = await this.transporter!.sendMail(mailOptions);
            console.log('Email sent successfully:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error: any) {
            console.error('Email sending failed:', error);
            return { success: false, error: error.message };
        }
    }

    renderTemplate(templateName: string, variables: Record<string, string> = {}) {
        let template = this.templates[templateName];

        if (!template) {
            throw new Error(`Template "${templateName}" not found`);
        }

        Object.keys(variables).forEach(key => {
            const placeholder = `{{${key}}}`;
            const value = variables[key] || '';
            template = template.replace(new RegExp(placeholder, 'g'), value);
        });

        return template;
    }

    async sendWelcomeEmail(email: string, firstName: string, verifyLink?: string) {
        const subject = 'Welcome to AryoPath - Your Health Journey Starts Here!';

        const html = this.templates['welcome']
            ? this.renderTemplate('welcome', { firstName, verifyLink: verifyLink || '' })
            : `<h1>Welcome ${firstName}!</h1><p>Please verify your email by clicking here: <a href="${verifyLink}">Verify Email</a></p>`;

        const text = `Welcome to AryoPath, ${firstName}! We're excited to have you on board.\n\n${verifyLink ? `Please verify your email by clicking the following link:\n${verifyLink}\n\n` : ''}You can now book diagnostic tests, track results, and manage your health profile.`;

        return await this.sendEmail(email, subject, html, text);
    }

    async sendPasswordResetEmail(email: string, resetToken: string) {
        const subject = 'Reset Your AryoPath Password';
        const resetLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

        const html = this.renderTemplate('password-reset', { resetLink });

        const text = `Password Reset Request\n\nWe received a request to reset your password. Click this link to reset: ${resetLink}\n\nIf you didn't request this, please ignore this email.`;

        return await this.sendEmail(email, subject, html, text);
    }

    async sendPasswordChangedEmail(email: string, firstName: string) {
        const subject = 'Your AryoPath Password Has Been Changed';

        const html = this.renderTemplate('password-changed', { firstName });

        const text = `Your AryoPath password has been successfully changed. If you didn't make this change, please contact support immediately.`;

        return await this.sendEmail(email, subject, html, text);
    }

    async sendEmailOTP(email: string, otp: string, purpose = "Verification") {
        if (!process.env.SMTP_HOST || process.env.SMTP_HOST === 'your-smtp-host' || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log(`📧 [DEV MODE] ${purpose} OTP for ${email}: ${otp}`);
            console.log(`📧 [DEV MODE] In production, this OTP would be sent via email to ${email}`);
            return { success: true, messageId: 'dev-mode-otp-logged' };
        }

        const subject = `Your AryoPath ${purpose} Code`;

        const html = this.renderTemplate('otp', { purpose, otp });

        const text = `Your AryoPath ${purpose.toLowerCase()} code is: ${otp}\n\nThis code will expire in 10 minutes. If you didn't request this verification, please ignore this email.`;

        return await this.sendEmail(email, subject, html, text);
    }

    async sendNotificationEmail(email: string, subject: string, content: string, emailType: string, variables: Record<string, string> = {}) {
        try {
            if (!process.env.SMTP_HOST || process.env.SMTP_HOST === 'your-smtp-host' || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
                console.log(`📧 [DEV MODE] Notification email to ${email}: ${subject}`);
                console.log(`📧 [DEV MODE] Content: ${content.substring(0, 100)}...`);
                return { success: true, messageId: 'dev-mode-notification-logged' };
            }

            const templateName = emailType === 'promotional'
                ? 'notification-promotional'
                : 'notification-informational';

            const templateVariables = {
                ...variables,
                subject,
                content,
                unsubscribeLink: `${process.env.CLIENT_URL || 'http://localhost:3000'}/unsubscribe`,
                preferencesLink: `${process.env.CLIENT_URL || 'http://localhost:3000'}/account/preferences`
            };

            const html = this.renderTemplate(templateName, templateVariables);

            const text = `${subject}\n\n${content}\n\nThank you for being a valued AryoPath customer!\n\nBest regards,\nThe AryoPath Team`;

            return await this.sendEmail(email, subject, html, text);
        } catch (error: any) {
            console.error('Error sending notification email:', error);
            return { success: false, error: error.message };
        }
    }
}

export default new EmailService();
