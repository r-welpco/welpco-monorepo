import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ResendEmailsClient,
  type ResendEmailDetail,
  type ResendEmailLastEvent,
  type ResendEmailListItem,
} from '../../../clients/resend';

export type { ResendEmailLastEvent };

const DEFAULT_LIST_LIMIT = 25;
const MAX_LIST_LIMIT = 100;
const STATS_SAMPLE_LIMIT = 100;

export const RESEND_EMAIL_LAST_EVENTS = [
  'bounced',
  'canceled',
  'clicked',
  'complained',
  'delivered',
  'delivery_delayed',
  'failed',
  'opened',
  'queued',
  'scheduled',
  'sent',
  'suppressed',
] as const satisfies readonly ResendEmailLastEvent[];

export interface ResendEmailsReportQuery {
  limit?: number;
  after?: string;
  before?: string;
  to?: string;
  lastEvent?: ResendEmailLastEvent;
}

export interface ResendEmailsReportStats {
  sampleSize: number;
  byLastEvent: Record<string, number>;
  deliveredOrOpened: number;
  bouncedOrFailed: number;
  opened: number;
  clicked: number;
}

export interface ResendEmailsReport {
  emails: ResendEmailListItem[];
  hasMore: boolean;
  nextCursor: string | null;
  prevCursor: string | null;
  filters: {
    to?: string;
    lastEvent?: ResendEmailLastEvent;
    limit: number;
  };
  stats: ResendEmailsReportStats;
  generatedAt: string;
}

@Injectable()
export class AdminResendEmailsReportService {
  constructor(private readonly resendEmails: ResendEmailsClient) {}

  async getEmailsReport(
    query: ResendEmailsReportQuery = {},
  ): Promise<ResendEmailsReport> {
    const limit = this.resolveLimit(query.limit);
    const toFilter = query.to?.trim().toLowerCase() || undefined;
    const lastEvent = this.resolveLastEvent(query.lastEvent);

    const [list, statsSample] = await Promise.all([
      this.resendEmails.listEmails({
        limit,
        after: query.after?.trim() || undefined,
        before: query.before?.trim() || undefined,
      }),
      // Fresh sample for summary cards (independent of list page cursor).
      this.resendEmails.listEmails({ limit: STATS_SAMPLE_LIMIT }),
    ]);

    let emails = list.emails;
    if (toFilter) {
      emails = emails.filter((email) =>
        email.to.some((recipient) =>
          recipient.toLowerCase().includes(toFilter),
        ),
      );
    }
    if (lastEvent) {
      emails = emails.filter((email) => email.lastEvent === lastEvent);
    }

    const nextCursor =
      list.hasMore && list.emails.length > 0
        ? list.emails[list.emails.length - 1]!.id
        : null;
    const prevCursor = list.emails.length > 0 ? list.emails[0]!.id : null;

    return {
      emails,
      hasMore: list.hasMore,
      nextCursor,
      prevCursor,
      filters: {
        to: toFilter,
        lastEvent,
        limit,
      },
      stats: this.buildStats(statsSample.emails),
      generatedAt: new Date().toISOString(),
    };
  }

  async getEmailDetail(id: string): Promise<ResendEmailDetail> {
    return this.resendEmails.getEmail(id);
  }

  private buildStats(emails: ResendEmailListItem[]): ResendEmailsReportStats {
    const byLastEvent: Record<string, number> = {};
    for (const event of RESEND_EMAIL_LAST_EVENTS) {
      byLastEvent[event] = 0;
    }
    for (const email of emails) {
      byLastEvent[email.lastEvent] = (byLastEvent[email.lastEvent] ?? 0) + 1;
    }

    const count = (...events: ResendEmailLastEvent[]) =>
      events.reduce((sum, event) => sum + (byLastEvent[event] ?? 0), 0);

    return {
      sampleSize: emails.length,
      byLastEvent,
      deliveredOrOpened: count('delivered', 'opened', 'clicked'),
      bouncedOrFailed: count('bounced', 'failed', 'suppressed'),
      opened: count('opened', 'clicked'),
      clicked: count('clicked'),
    };
  }

  private resolveLimit(limit?: number): number {
    if (limit == null || Number.isNaN(limit)) return DEFAULT_LIST_LIMIT;
    if (!Number.isInteger(limit) || limit < 1) {
      throw new BadRequestException('`limit` must be a positive integer.');
    }
    return Math.min(limit, MAX_LIST_LIMIT);
  }

  private resolveLastEvent(
    value?: string,
  ): ResendEmailLastEvent | undefined {
    if (!value) return undefined;
    if (
      !RESEND_EMAIL_LAST_EVENTS.includes(value as ResendEmailLastEvent)
    ) {
      throw new BadRequestException(`Unknown lastEvent filter: ${value}`);
    }
    return value as ResendEmailLastEvent;
  }
}
