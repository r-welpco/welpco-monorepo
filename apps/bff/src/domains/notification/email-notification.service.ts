import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  getBookingEmailHtml,
  getBookingEmailSubject,
  getWelcomeEmailHtml,
  getWelcomeEmailSubject,
  type BookingEmailType,
  type BookingEmailVariables,
  type EmailLocale,
} from '@welpco/email';
import { EmailService } from '../user-management/email/email.service';
import { emailLocaleForUser } from '../user-management/auth/user-locale.helper';
import { UserAccount } from '../user-management/entities/user-account.entity';
import { IEmailNotificationService } from './notification.service';

export type { BookingEmailType, BookingEmailVariables };

@Injectable()
export class EmailNotificationService implements IEmailNotificationService {
  private readonly logger = new Logger(EmailNotificationService.name);
  private readonly publicAppUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    @InjectRepository(UserAccount)
    private readonly userRepo: Repository<UserAccount>,
  ) {
    this.publicAppUrl =
      this.configService.get<string>('PUBLIC_APP_URL') ||
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:8081';
  }

  async sendNotificationEmail(userId: string, subject: string, html: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user?.email) {
      this.logger.warn(`No email found for user ${userId}, skipping notification email`);
      return;
    }
    await this.emailService.sendEmail({ to: user.email, subject, html });
  }

  async sendBookingEmailForUser(
    userId: string,
    type: BookingEmailType,
    variables: BookingEmailVariables,
  ): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user?.email) {
      this.logger.warn(`No email found for user ${userId}, skipping booking email`);
      return;
    }
    await this.sendBookingEmail(
      type,
      user.email,
      variables,
      emailLocaleForUser(user) as EmailLocale,
    );
  }

  async sendBookingEmail(
    type: BookingEmailType,
    recipientEmail: string,
    variables: BookingEmailVariables,
    locale: EmailLocale = 'en',
  ): Promise<void> {
    const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:8080';
    const bookingUrl = variables.bookingUrl || `${baseUrl}/dashboard/bookings`;
    const v = { ...variables, bookingUrl };

    const subject = getBookingEmailSubject(type);
    const html = getBookingEmailHtml({
      type,
      variables: v,
      locale,
      publicAppUrl: this.publicAppUrl,
    });

    await this.emailService.sendEmail({ to: recipientEmail, subject, html });
  }

  async sendWelcomeEmail(
    email: string,
    firstName?: string,
    localeInput?: EmailLocale,
  ): Promise<void> {
    const locale = localeInput ?? 'en';
    const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:8080';
    const prefix = locale === 'fr' ? '/fr' : '';
    const dashboardUrl = `${baseUrl}${prefix}/dashboard`;
    const html = getWelcomeEmailHtml(firstName, dashboardUrl, locale, this.publicAppUrl);

    await this.emailService.sendEmail({
      to: email,
      subject: getWelcomeEmailSubject(locale),
      html,
    });
  }
}
