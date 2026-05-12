import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailService } from '../user-management/email/email.service';
import { UserAccount } from '../user-management/entities/user-account.entity';
import { IEmailNotificationService } from './notification.service';

export type BookingEmailType =
  | 'booking_created'
  | 'booking_accepted'
  | 'booking_declined'
  | 'booking_cancelled'
  | 'booking_checked_in'
  | 'booking_completed'
  | 'booking_service_receipt';

export interface BookingEmailVariables {
  customerName?: string;
  welperName?: string;
  serviceName?: string;
  scheduledDate?: string;
  startTime?: string;
  endTime?: string;
  address?: string;
  totalPrice?: string;
  bookingUrl?: string;
  declineReason?: string;
  cancellationReason?: string;
}

const BASE_STYLES = 'font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;';
const BOX_STYLES = 'background-color: #f4f4f4; padding: 20px; border-radius: 5px;';
const BTN_STYLES = 'background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;';

@Injectable()
export class EmailNotificationService implements IEmailNotificationService {
  private readonly logger = new Logger(EmailNotificationService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    @InjectRepository(UserAccount)
    private readonly userRepo: Repository<UserAccount>,
  ) {}

  async sendNotificationEmail(userId: string, subject: string, html: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user?.email) {
      this.logger.warn(`No email found for user ${userId}, skipping notification email`);
      return;
    }
    await this.emailService.sendEmail({ to: user.email, subject, html });
  }

  /** Send booking email to a user by ID (resolves email from account). */
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
    await this.sendBookingEmail(type, user.email, variables);
  }

  async sendBookingEmail(
    type: BookingEmailType,
    recipientEmail: string,
    variables: BookingEmailVariables,
  ): Promise<void> {
    const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:8080';
    const bookingUrl = variables.bookingUrl || `${baseUrl}/dashboard/bookings`;
    const v = { ...variables, bookingUrl };

    let subject: string;
    let html: string;

    switch (type) {
      case 'booking_created':
        subject = 'New booking request – Welpco';
        html = this.bookingCreatedHtml(v);
        break;
      case 'booking_accepted':
        subject = 'Your booking was accepted – Welpco';
        html = this.bookingAcceptedHtml(v);
        break;
      case 'booking_declined':
        subject = 'Booking request declined – Welpco';
        html = this.bookingDeclinedHtml(v);
        break;
      case 'booking_cancelled':
        subject = 'Booking cancelled – Welpco';
        html = this.bookingCancelledHtml(v);
        break;
      case 'booking_checked_in':
        subject = 'Welper has checked in – Welpco';
        html = this.bookingCheckedInHtml(v);
        break;
      case 'booking_completed':
        subject = 'Service completed – Welpco';
        html = this.bookingCompletedHtml(v);
        break;
      case 'booking_service_receipt':
        subject = 'Service receipt & payment – Welpco';
        html = this.bookingServiceReceiptHtml(v);
        break;
      default:
        throw new Error(`Unknown booking email type: ${type}`);
    }

    await this.emailService.sendEmail({ to: recipientEmail, subject, html });
  }

  async sendWelcomeEmail(email: string, firstName?: string): Promise<void> {
    const name = firstName?.trim() || 'there';
    const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:8080';
    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Welcome to Welpco</title></head>
        <body style="${BASE_STYLES}">
          <div style="${BOX_STYLES}">
            <h1 style="color: #333;">Welcome to Welpco!</h1>
            <p>Hi ${this.escapeHtml(name)},</p>
            <p>Thanks for signing up. You're all set to find trusted help for your family or to offer your services as a welper.</p>
            <p style="margin-top: 24px;">
              <a href="${baseUrl}/dashboard" style="${BTN_STYLES}">Go to Dashboard</a>
            </p>
            <p style="margin-top: 30px; font-size: 12px; color: #666;">If you didn't create an account, please ignore this email.</p>
          </div>
        </body>
      </html>
    `;
    await this.emailService.sendEmail({
      to: email,
      subject: 'Welcome to Welpco',
      html,
    });
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private bookingCreatedHtml(v: BookingEmailVariables): string {
    const serviceName = this.escapeHtml(v.serviceName || 'Service');
    const customerName = this.escapeHtml(v.customerName || 'A customer');
    const date = this.escapeHtml(v.scheduledDate || '');
    const time = v.startTime && v.endTime ? `${v.startTime} – ${v.endTime}` : '';
    const address = this.escapeHtml(v.address || '');
    return `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>New booking request</title></head>
        <body style="${BASE_STYLES}">
          <div style="${BOX_STYLES}">
            <h1 style="color: #333;">New booking request</h1>
            <p>${customerName} has requested a booking for <strong>${serviceName}</strong>.</p>
            ${date ? `<p><strong>Date:</strong> ${date}${time ? `, ${time}` : ''}</p>` : ''}
            ${address ? `<p><strong>Address:</strong> ${address}</p>` : ''}
            <p style="margin-top: 20px;"><a href="${v.bookingUrl}" style="${BTN_STYLES}">View booking</a></p>
          </div>
        </body>
      </html>
    `;
  }

  private bookingAcceptedHtml(v: BookingEmailVariables): string {
    const welperName = this.escapeHtml(v.welperName || 'Your welper');
    const serviceName = this.escapeHtml(v.serviceName || 'your service');
    const date = this.escapeHtml(v.scheduledDate || '');
    const time = v.startTime && v.endTime ? `${v.startTime} – ${v.endTime}` : '';
    return `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Booking accepted</title></head>
        <body style="${BASE_STYLES}">
          <div style="${BOX_STYLES}">
            <h1 style="color: #333;">Your booking was accepted</h1>
            <p>${welperName} has accepted your request for <strong>${serviceName}</strong>.</p>
            ${date ? `<p><strong>When:</strong> ${date}${time ? `, ${time}` : ''}</p>` : ''}
            <p style="margin-top: 20px;"><a href="${v.bookingUrl}" style="${BTN_STYLES}">View booking</a></p>
          </div>
        </body>
      </html>
    `;
  }

  private bookingDeclinedHtml(v: BookingEmailVariables): string {
    const serviceName = this.escapeHtml(v.serviceName || 'your request');
    const reason = v.declineReason ? `<p><strong>Reason:</strong> ${this.escapeHtml(v.declineReason)}</p>` : '';
    return `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Booking declined</title></head>
        <body style="${BASE_STYLES}">
          <div style="${BOX_STYLES}">
            <h1 style="color: #333;">Booking request declined</h1>
            <p>Unfortunately your booking request for <strong>${serviceName}</strong> was declined.</p>
            ${reason}
            <p style="margin-top: 20px;"><a href="${v.bookingUrl}" style="${BTN_STYLES}">Find another welper</a></p>
          </div>
        </body>
      </html>
    `;
  }

  private bookingCancelledHtml(v: BookingEmailVariables): string {
    const serviceName = this.escapeHtml(v.serviceName || 'the booking');
    const reason = v.cancellationReason ? `<p><strong>Reason:</strong> ${this.escapeHtml(v.cancellationReason)}</p>` : '';
    return `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Booking cancelled</title></head>
        <body style="${BASE_STYLES}">
          <div style="${BOX_STYLES}">
            <h1 style="color: #333;">Booking cancelled</h1>
            <p>${serviceName} has been cancelled.</p>
            ${reason}
            <p style="margin-top: 20px;"><a href="${v.bookingUrl}" style="${BTN_STYLES}">View bookings</a></p>
          </div>
        </body>
      </html>
    `;
  }

  private bookingCheckedInHtml(v: BookingEmailVariables): string {
    const welperName = this.escapeHtml(v.welperName || 'Your welper');
    const serviceName = this.escapeHtml(v.serviceName || 'your service');
    return `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Welper checked in</title></head>
        <body style="${BASE_STYLES}">
          <div style="${BOX_STYLES}">
            <h1 style="color: #333;">Welper has checked in</h1>
            <p>${welperName} has checked in for <strong>${serviceName}</strong>.</p>
            <p style="margin-top: 20px;"><a href="${v.bookingUrl}" style="${BTN_STYLES}">View booking</a></p>
          </div>
        </body>
      </html>
    `;
  }

  private bookingCompletedHtml(v: BookingEmailVariables): string {
    const serviceName = this.escapeHtml(v.serviceName || 'your service');
    return `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Service completed</title></head>
        <body style="${BASE_STYLES}">
          <div style="${BOX_STYLES}">
            <h1 style="color: #333;">Service completed</h1>
            <p>Your booking for <strong>${serviceName}</strong> is complete. Thank you for using Welpco!</p>
            <p style="margin-top: 20px;"><a href="${v.bookingUrl}" style="${BTN_STYLES}">View booking</a></p>
          </div>
        </body>
      </html>
    `;
  }

  private bookingServiceReceiptHtml(v: BookingEmailVariables): string {
    const serviceName = this.escapeHtml(v.serviceName || 'your service');
    const amount = this.escapeHtml(v.totalPrice || '');
    return `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Service receipt</title></head>
        <body style="${BASE_STYLES}">
          <div style="${BOX_STYLES}">
            <h1 style="color: #333;">Service receipt</h1>
            <p>Your welper submitted a receipt for <strong>${serviceName}</strong>.</p>
            ${amount ? `<p><strong>Amount charged:</strong> $${amount} CAD</p>` : ''}
            <p>Open your booking to review details. If something looks wrong, you can start a dispute from the booking page.</p>
            <p style="margin-top: 20px;"><a href="${v.bookingUrl}" style="${BTN_STYLES}">View booking</a></p>
          </div>
        </body>
      </html>
    `;
  }
}
