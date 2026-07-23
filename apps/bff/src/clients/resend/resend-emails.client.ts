import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export type ResendEmailLastEvent =
  | 'bounced'
  | 'canceled'
  | 'clicked'
  | 'complained'
  | 'delivered'
  | 'delivery_delayed'
  | 'failed'
  | 'opened'
  | 'queued'
  | 'scheduled'
  | 'sent'
  | 'suppressed';

export interface ResendEmailListItem {
  id: string;
  from: string;
  to: string[];
  subject: string;
  createdAt: string;
  lastEvent: ResendEmailLastEvent;
  scheduledAt: string | null;
  cc: string[] | null;
  bcc: string[] | null;
  replyTo: string[] | null;
}

export interface ResendEmailDetail extends ResendEmailListItem {
  html: string | null;
  text: string | null;
  tags: Array<{ name: string; value: string }>;
}

export interface ResendEmailListResult {
  emails: ResendEmailListItem[];
  hasMore: boolean;
}

/**
 * Thin wrapper around the Resend SDK for admin sent-email reporting.
 *
 * Uses existing `RESEND_API_KEY` (same key used for transactional sends).
 * Docs: https://resend.com/docs/api-reference/emails/list-emails
 */
@Injectable()
export class ResendEmailsClient implements OnModuleInit {
  private readonly logger = new Logger(ResendEmailsClient.name);
  private apiKey: string | null = null;
  private client: Resend | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const raw = this.configService.get<string>('RESEND_API_KEY')?.trim();
    this.apiKey = raw || null;
    if (!this.apiKey) {
      this.logger.warn(
        'RESEND_API_KEY not set. Admin Resend email report will return 503 until configured.',
      );
      return;
    }
    this.client = new Resend(this.apiKey);
  }

  isConfigured(): boolean {
    return Boolean(this.client && this.apiKey);
  }

  assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Resend is not configured. Set RESEND_API_KEY on the BFF to view sent emails.',
      );
    }
  }

  async listEmails(options?: {
    limit?: number;
    after?: string;
    before?: string;
  }): Promise<ResendEmailListResult> {
    this.assertConfigured();
    const limit = Math.min(Math.max(options?.limit ?? 20, 1), 100);

    const { data, error } = await this.client!.emails.list({
      limit,
      ...(options?.after
        ? { after: options.after }
        : options?.before
          ? { before: options.before }
          : {}),
    });

    if (error) {
      this.mapAndThrow(error, 'list');
    }

    return {
      emails: (data?.data ?? []).map((email) => this.mapListItem(email)),
      hasMore: Boolean(data?.has_more),
    };
  }

  async getEmail(id: string): Promise<ResendEmailDetail> {
    this.assertConfigured();
    const trimmed = id.trim();
    if (!trimmed) {
      throw new NotFoundException('Email id is required');
    }

    const { data, error } = await this.client!.emails.get(trimmed);

    if (error) {
      const statusCode =
        typeof error === 'object' &&
        error !== null &&
        'statusCode' in error &&
        typeof (error as { statusCode?: unknown }).statusCode === 'number'
          ? (error as { statusCode: number }).statusCode
          : undefined;
      if (statusCode === 404) {
        throw new NotFoundException(`Email ${trimmed} was not found in Resend`);
      }
      this.mapAndThrow(error, 'get');
    }

    if (!data) {
      throw new NotFoundException(`Email ${trimmed} was not found in Resend`);
    }

    return {
      ...this.mapListItem(data),
      html: data.html ?? null,
      text: data.text ?? null,
      tags: (data.tags ?? []).map((tag) => ({
        name: tag.name,
        value: tag.value,
      })),
    };
  }

  private mapListItem(email: {
    id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    last_event: ResendEmailLastEvent;
    scheduled_at: string | null;
    cc: string[] | null;
    bcc: string[] | null;
    reply_to: string[] | null;
  }): ResendEmailListItem {
    return {
      id: email.id,
      from: email.from,
      to: email.to ?? [],
      subject: email.subject,
      createdAt: email.created_at,
      lastEvent: email.last_event,
      scheduledAt: email.scheduled_at,
      cc: email.cc,
      bcc: email.bcc,
      replyTo: email.reply_to,
    };
  }

  private mapAndThrow(error: unknown, operation: 'list' | 'get'): never {
    const message =
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
        ? (error as { message: string }).message
        : `Resend ${operation} failed`;

    this.logger.warn(`Resend emails.${operation} failed: ${message}`);

    const statusCode =
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof (error as { statusCode?: unknown }).statusCode === 'number'
        ? (error as { statusCode: number }).statusCode
        : undefined;

    if (statusCode === 401 || statusCode === 403) {
      throw new ServiceUnavailableException(
        'Resend rejected the API key. Check RESEND_API_KEY permissions.',
      );
    }

    throw new ServiceUnavailableException(
      `Unable to load emails from Resend (${message}).`,
    );
  }
}
