import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  getBookingEmailHtml,
  getBookingEmailSubject,
  getDisputeEmailHtml,
  getDisputeEmailSubject,
  getPaymentEmailHtml,
  getPaymentEmailSubject,
  getWelcomeEmailHtml,
  getWelcomeEmailSubject,
  getNotificationEmailHtml,
  getNotificationEmailSubject,
  type BookingEmailType,
  type BookingEmailVariables,
  type DisputeEmailType,
  type DisputeEmailVariables,
  type EmailLocale,
  type PaymentEmailType,
  type PaymentEmailVariables,
} from '@welpco/email';
import { EmailService } from '../user-management/email/email.service';
import { emailLocaleForUser } from '../user-management/auth/user-locale.helper';
import {
  AccountType,
  UserAccount,
} from '../user-management/entities/user-account.entity';
import {
  GuardianConsentStatus,
  MinorGuardianConsent,
} from '../safety-verification/entities/minor-guardian-consent.entity';
import { localePathPrefix } from '../../common/preferred-locale';
import { IEmailNotificationService } from './notification.service';
import { resolveUserLocale } from './notification-locale.helper';
import { NotificationCategory } from './entities';

export type { BookingEmailType, BookingEmailVariables, DisputeEmailType, DisputeEmailVariables, PaymentEmailType, PaymentEmailVariables };

@Injectable()
export class EmailNotificationService implements IEmailNotificationService {
  private readonly logger = new Logger(EmailNotificationService.name);
  private readonly publicAppUrl: string;
  private readonly frontendUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    @InjectRepository(UserAccount)
    private readonly userRepo: Repository<UserAccount>,
    @InjectRepository(MinorGuardianConsent)
    private readonly guardianConsentRepo: Repository<MinorGuardianConsent>,
  ) {
    this.publicAppUrl =
      this.configService.get<string>('PUBLIC_APP_URL') ||
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:8081';
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:8080';
  }

  async resolveLocaleForUser(userId: string): Promise<EmailLocale> {
    return (await resolveUserLocale(this.userRepo, userId)) as EmailLocale;
  }

  async sendNotificationEmail(userId: string, subject: string, html: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user?.email) {
      this.logger.warn(`No email found for user ${userId}, skipping notification email`);
      return;
    }
    await this.emailService.sendEmail({ to: user.email, subject, html });
  }

  async sendGenericNotificationEmail(
    userId: string,
    params: {
      title: string;
      body: string;
      actionUrl?: string;
      locale?: EmailLocale;
      category?: NotificationCategory;
    },
  ): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user?.email) {
      this.logger.warn(`No email found for user ${userId}, skipping notification email`);
      return;
    }
    const locale = (params.locale ?? emailLocaleForUser(user)) as EmailLocale;
    const subject = getNotificationEmailSubject(params.title);
    const html = getNotificationEmailHtml({
      title: params.title,
      body: params.body,
      actionUrl: params.actionUrl,
      locale,
      publicAppUrl: this.publicAppUrl,
    });
    await this.emailService.sendEmail({ to: user.email, subject, html });

    if (
      params.category === NotificationCategory.MESSAGE ||
      params.category === NotificationCategory.REVIEW
    ) {
      const guardianTitle =
        params.category === NotificationCategory.MESSAGE
          ? locale === 'fr'
            ? 'Nouveau message'
            : 'New message'
          : params.title;
      const guardianBody =
        params.category === NotificationCategory.MESSAGE
          ? locale === 'fr'
            ? 'Le compte Welpco du mineur a reçu un nouveau message.'
            : "The minor's Welpco account received a new message."
          : params.body;
      await this.sendGuardianCopy(
        user,
        getNotificationEmailSubject(guardianTitle),
        getNotificationEmailHtml({
          title: guardianTitle,
          body: guardianBody,
          locale,
          publicAppUrl: this.publicAppUrl,
        }),
        locale,
      );
    }
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
    const locale = emailLocaleForUser(user) as EmailLocale;
    const { subject, html } = this.renderBookingEmail(type, variables, locale);
    await this.emailService.sendEmail({ to: user.email, subject, html });
    await this.sendGuardianCopy(user, subject, html, locale);
  }

  async sendPaymentEmailForUser(
    userId: string,
    type: PaymentEmailType,
    variables: PaymentEmailVariables,
  ): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user?.email) {
      this.logger.warn(`No email found for user ${userId}, skipping payment email`);
      return;
    }
    const locale = emailLocaleForUser(user) as EmailLocale;
    const subject = getPaymentEmailSubject(type, locale);
    const html = getPaymentEmailHtml({
      type,
      variables,
      locale,
      publicAppUrl: this.publicAppUrl,
    });
    await this.emailService.sendEmail({ to: user.email, subject, html });
    await this.sendGuardianCopy(user, subject, html, locale);
  }

  async sendDisputeEmailForUser(
    userId: string,
    type: DisputeEmailType,
    variables: DisputeEmailVariables,
  ): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user?.email) {
      this.logger.warn(`No email found for user ${userId}, skipping dispute email`);
      return;
    }
    const locale = emailLocaleForUser(user) as EmailLocale;
    const subject = getDisputeEmailSubject(type, locale);
    const html = getDisputeEmailHtml({
      type,
      variables,
      locale,
      publicAppUrl: this.publicAppUrl,
    });
    await this.emailService.sendEmail({ to: user.email, subject, html });
    await this.sendGuardianCopy(user, subject, html, locale);
  }

  async sendBookingEmail(
    type: BookingEmailType,
    recipientEmail: string,
    variables: BookingEmailVariables,
    locale: EmailLocale = 'en',
  ): Promise<void> {
    const { subject, html } = this.renderBookingEmail(
      type,
      variables,
      locale,
    );
    await this.emailService.sendEmail({ to: recipientEmail, subject, html });
  }

  private renderBookingEmail(
    type: BookingEmailType,
    variables: BookingEmailVariables,
    locale: EmailLocale,
  ): { subject: string; html: string } {
    const prefix = localePathPrefix(locale);
    const bookingUrl =
      variables.bookingUrl || `${this.frontendUrl}${prefix}/dashboard/bookings`;
    const v = { ...variables, bookingUrl };

    const subject = getBookingEmailSubject(type, locale);
    const html = getBookingEmailHtml({
      type,
      variables: v,
      locale,
      publicAppUrl: this.publicAppUrl,
    });

    return { subject, html };
  }

  async sendWelcomeEmail(
    email: string,
    firstName?: string,
    localeInput?: EmailLocale,
  ): Promise<void> {
    const locale = localeInput ?? 'en';
    const prefix = localePathPrefix(locale);
    const dashboardUrl = `${this.frontendUrl}${prefix}/dashboard`;
    const html = getWelcomeEmailHtml(firstName, dashboardUrl, locale, this.publicAppUrl);

    await this.emailService.sendEmail({
      to: email,
      subject: getWelcomeEmailSubject(locale),
      html,
    });
  }

  private async sendGuardianCopy(
    minor: UserAccount,
    subject: string,
    html: string,
    locale: EmailLocale,
  ): Promise<void> {
    if (minor.accountType !== AccountType.WELPER) {
      return;
    }

    try {
      const consent = await this.guardianConsentRepo.findOne({
        where: {
          minorUserId: minor.id,
          status: GuardianConsentStatus.APPROVED,
        },
      });
      if (
        !consent?.guardianEmail ||
        consent.guardianEmail.toLowerCase() === minor.email.toLowerCase()
      ) {
        return;
      }

      const copySubject =
        locale === 'fr'
          ? `[Copie tuteur] ${subject}`
          : `[Guardian copy] ${subject}`;
      await this.emailService.sendEmail({
        to: consent.guardianEmail,
        subject: copySubject,
        html,
      });
    } catch (err) {
      this.logger.warn(
        `Guardian email copy failed for minor ${minor.id}: ${(err as Error).message}`,
      );
    }
  }
}
