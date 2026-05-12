import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    const isProduction = process.env.NODE_ENV === 'production';
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT');
    const smtpUser = this.configService.get<string>('SMTP_USER') || '';
    const smtpPassword = this.configService.get<string>('SMTP_PASSWORD') || '';

    if (isProduction) {
      if (!smtpHost || smtpHost === 'localhost') {
        throw new Error('SMTP_HOST must be set to a real mail server in production');
      }
      if (!smtpPort || smtpPort === 1025) {
        throw new Error('SMTP_PORT must be set to a valid port in production (not 1025)');
      }
    }

    const host = smtpHost || 'localhost';
    const port = smtpPort || 1025;
    const secure = isProduction; // TLS in production, plain in development (MailHog)

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: smtpUser && smtpPassword ? {
        user: smtpUser,
        pass: smtpPassword,
      } : undefined,
    });

    this.logger.log(`Email service configured: ${host}:${port} (secure=${secure})`);
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const from = this.configService.get<string>('SMTP_FROM') || 'noreply@welpco.com';
      
      const mailOptions = {
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${options.to}: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  async sendVerificationEmail(email: string, code: string): Promise<void> {
    const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:8080';
    const verificationUrl = `${baseUrl}/verification?email=${encodeURIComponent(email)}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h1 style="color: #333;">Verify Your Email Address</h1>
            <p>Thank you for signing up for Welpco! Please verify your email address using the code below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #fff; border: 2px solid #007bff; border-radius: 8px; padding: 20px; display: inline-block;">
                <div style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 8px;">${code}</div>
              </div>
            </div>
            <p style="text-align: center; margin-top: 20px;">
              <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Go to Verification Page</a>
            </p>
            <p style="margin-top: 30px; font-size: 12px; color: #666;">
              This verification code will expire in 24 hours. If you didn't create an account, please ignore this email.
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Verify Your Welpco Email Address',
      html,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:8080';
    const resetUrl = `${baseUrl}/forgot-password?token=${token}&email=${encodeURIComponent(email)}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h1 style="color: #333;">Reset Your Password</h1>
            <p>You requested to reset your password for your Welpco account. Click the button below to reset it:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
            <p style="margin-top: 30px; font-size: 12px; color: #666;">
              This password reset link will expire in 15 minutes. If you didn't request a password reset, please ignore this email.
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Reset Your Welpco Password',
      html,
    });
  }
}

