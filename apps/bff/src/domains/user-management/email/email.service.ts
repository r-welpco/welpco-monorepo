import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  getPasswordResetEmailHtml,
  getPasswordResetEmailSubject,
  getVerificationEmailHtml,
  getVerificationEmailSubject,
  hasResendApiKey,
  sendMail,
  type EmailLocale,
  type SmtpConfig,
} from '@welpco/email';
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
  private readonly mailConfig: SmtpConfig;
  private readonly publicAppUrl: string;
  private readonly deliveryMode: 'resend' | 'smtp';

  constructor(private configService: ConfigService) {
    const isProduction = process.env.NODE_ENV === 'production';
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT');
    const smtpUser = this.configService.get<string>('SMTP_USER') || '';
    const smtpPass =
      this.configService.get<string>('SMTP_PASS') ||
      this.configService.get<string>('SMTP_PASSWORD') ||
      '';

    this.mailConfig = {
      host: smtpHost || 'localhost',
      port: smtpPort || 1025,
      from: this.configService.get<string>('SMTP_FROM') || 'noreply@welpco.com',
      user: smtpUser || undefined,
      pass: smtpPass || undefined,
      resendApiKey: resendApiKey || undefined,
    };

    this.deliveryMode = hasResendApiKey(this.mailConfig) ? 'resend' : 'smtp';

    if (isProduction && this.deliveryMode === 'smtp') {
      if (!smtpHost || smtpHost === 'localhost') {
        throw new Error(
          'Set RESEND_API_KEY (recommended on Vercel) or SMTP_HOST to a real mail server in production',
        );
      }
      if (!smtpPort || smtpPort === 1025) {
        throw new Error('SMTP_PORT must be set to a valid port in production (not 1025)');
      }
    }

    if (isProduction && this.deliveryMode === 'resend' && !this.mailConfig.from) {
      throw new Error('SMTP_FROM must be set when using Resend in production');
    }

    this.publicAppUrl =
      this.configService.get<string>('PUBLIC_APP_URL') ||
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:8081';

    if (this.deliveryMode === 'resend') {
      this.logger.log('Email service configured: Resend HTTP API');
    } else {
      const { host, port } = this.mailConfig;
      this.logger.log(
        `Email service configured: SMTP ${host}:${port} (secure=${port === 465})`,
      );
    }
  }

  private localizedAuthUrl(path: string, locale: UserPreferredLocale): string {
    const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:8081';
    return `${baseUrl}${localePathPrefix(locale)}${path}`;
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await sendMail(
        {
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
          from: this.mailConfig.from,
        },
        undefined,
        this.mailConfig,
      );

      this.logger.log(`Email sent successfully to ${options.to}`);
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
