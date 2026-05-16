import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createSmtpTransport,
  getPasswordResetEmailHtml,
  getPasswordResetEmailSubject,
  getVerificationEmailHtml,
  getVerificationEmailSubject,
  type EmailLocale,
  type SmtpConfig,
} from '@welpco/email';
import type { Transporter } from 'nodemailer';
import {
  localePathPrefix,
  resolvePreferredLocale,
  type UserPreferredLocale,
} from '../../../common/preferred-locale';

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
  private readonly smtpConfig: SmtpConfig;
  private readonly publicAppUrl: string;

  constructor(private configService: ConfigService) {
    const isProduction = process.env.NODE_ENV === 'production';
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT');
    const smtpUser = this.configService.get<string>('SMTP_USER') || '';
    const smtpPass =
      this.configService.get<string>('SMTP_PASS') ||
      this.configService.get<string>('SMTP_PASSWORD') ||
      '';

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

    this.smtpConfig = {
      host,
      port,
      from: this.configService.get<string>('SMTP_FROM') || 'noreply@welpco.com',
      user: smtpUser || undefined,
      pass: smtpPass || undefined,
    };

    this.transporter = createSmtpTransport(this.smtpConfig);
    this.publicAppUrl =
      this.configService.get<string>('PUBLIC_APP_URL') ||
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:8081';

    this.logger.log(`Email service configured: ${host}:${port} (secure=${port === 465})`);
  }

  private localizedAuthUrl(path: string, locale: UserPreferredLocale): string {
    const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:8081';
    return `${baseUrl}${localePathPrefix(locale)}${path}`;
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const from = this.smtpConfig.from ?? 'noreply@welpco.com';

      const info = await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
      });

      this.logger.log(`Email sent successfully to ${options.to}: ${info.messageId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  async sendVerificationEmail(
    email: string,
    code: string,
    localeInput?: UserPreferredLocale,
  ): Promise<void> {
    const locale = resolvePreferredLocale(localeInput) as EmailLocale;
    const verificationUrl = `${this.localizedAuthUrl('/verification', locale)}?email=${encodeURIComponent(email)}`;

    const html = getVerificationEmailHtml({
      code,
      verificationUrl,
      locale,
      publicAppUrl: this.publicAppUrl,
    });

    await this.sendEmail({
      to: email,
      subject: getVerificationEmailSubject(locale),
      html,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
    localeInput?: UserPreferredLocale,
  ): Promise<void> {
    const locale = resolvePreferredLocale(localeInput) as EmailLocale;
    const resetUrl = `${this.localizedAuthUrl('/reset-password', locale)}?token=${token}&email=${encodeURIComponent(email)}`;

    const html = getPasswordResetEmailHtml({
      resetUrl,
      locale,
      publicAppUrl: this.publicAppUrl,
    });

    await this.sendEmail({
      to: email,
      subject: getPasswordResetEmailSubject(locale),
      html,
    });
  }
}
