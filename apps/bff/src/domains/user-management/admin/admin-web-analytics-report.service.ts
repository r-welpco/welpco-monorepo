import { BadRequestException, Injectable } from '@nestjs/common';
import {
  VercelWebAnalyticsClient,
  type VercelVisitsAggregateRow,
} from '../../../clients/vercel';

const MAX_RANGE_DAYS = 90;
const DEFAULT_RANGE_DAYS = 7;

export const WEB_ANALYTICS_ENVIRONMENTS = [
  'production',
  'preview',
  'development',
  'all',
] as const;

export type WebAnalyticsEnvironmentFilter =
  (typeof WEB_ANALYTICS_ENVIRONMENTS)[number];

export interface WebAnalyticsReportQuery {
  since?: string;
  until?: string;
  environment?: WebAnalyticsEnvironmentFilter;
}

export interface WebAnalyticsMetricRow {
  label: string;
  pageviews: number;
  visitors: number;
}

export interface WebAnalyticsDailyRow {
  date: string;
  pageviews: number;
  visitors: number;
}

export interface WebAnalyticsReport {
  since: string;
  until: string;
  environment: WebAnalyticsEnvironmentFilter;
  summary: {
    pageviews: number;
    visitors: number;
  };
  daily: WebAnalyticsDailyRow[];
  topPages: WebAnalyticsMetricRow[];
  topReferrers: WebAnalyticsMetricRow[];
  countries: WebAnalyticsMetricRow[];
  devices: WebAnalyticsMetricRow[];
  generatedAt: string;
}

@Injectable()
export class AdminWebAnalyticsReportService {
  constructor(
    private readonly vercelWebAnalytics: VercelWebAnalyticsClient,
  ) {}

  async getWebAnalyticsReport(
    query: WebAnalyticsReportQuery = {},
  ): Promise<WebAnalyticsReport> {
    const { since, until } = this.resolveDateRange(query.since, query.until);
    const environment = this.resolveEnvironment(query.environment);
    const filter = this.buildEnvironmentFilter(environment);

    const [summaryRes, dailyRes, pagesRes, referrersRes, countriesRes, devicesRes] =
      await Promise.all([
        this.vercelWebAnalytics.countVisits({ since, until, filter }),
        this.vercelWebAnalytics.aggregateVisits({
          since,
          until,
          filter,
          by: 'day',
        }),
        this.vercelWebAnalytics.aggregateVisits({
          since,
          until,
          filter,
          by: 'requestPath',
          limit: 20,
        }),
        this.vercelWebAnalytics.aggregateVisits({
          since,
          until,
          filter,
          by: 'referrerHostname',
          limit: 15,
        }),
        this.vercelWebAnalytics.aggregateVisits({
          since,
          until,
          filter,
          by: 'country',
          limit: 15,
        }),
        this.vercelWebAnalytics.aggregateVisits({
          since,
          until,
          filter,
          by: 'deviceType',
          limit: 10,
        }),
      ]);

    return {
      since,
      until,
      environment,
      summary: {
        pageviews: summaryRes.data?.pageviews ?? 0,
        visitors: summaryRes.data?.visitors ?? 0,
      },
      daily: this.mapDailyRows(dailyRes.data ?? []),
      topPages: this.mapDimensionRows(pagesRes.data ?? [], 'requestPath'),
      topReferrers: this.mapDimensionRows(
        referrersRes.data ?? [],
        'referrerHostname',
      ),
      countries: this.mapDimensionRows(countriesRes.data ?? [], 'country'),
      devices: this.mapDimensionRows(devicesRes.data ?? [], 'deviceType'),
      generatedAt: new Date().toISOString(),
    };
  }

  resolveDateRange(
    sinceRaw?: string,
    untilRaw?: string,
  ): { since: string; until: string } {
    const untilDate = untilRaw
      ? this.parseDateOnly(untilRaw, 'until')
      : this.startOfUtcDay(new Date());
    const sinceDate = sinceRaw
      ? this.parseDateOnly(sinceRaw, 'since')
      : this.addUtcDays(untilDate, -(DEFAULT_RANGE_DAYS - 1));

    if (sinceDate.getTime() > untilDate.getTime()) {
      throw new BadRequestException('`since` must be on or before `until`.');
    }

    const rangeDays =
      Math.floor(
        (untilDate.getTime() - sinceDate.getTime()) / (24 * 60 * 60 * 1000),
      ) + 1;
    if (rangeDays > MAX_RANGE_DAYS) {
      throw new BadRequestException(
        `Date range cannot exceed ${MAX_RANGE_DAYS} days.`,
      );
    }

    return {
      since: this.formatDateOnly(sinceDate),
      until: this.formatDateOnly(untilDate),
    };
  }

  private resolveEnvironment(
    value?: string,
  ): WebAnalyticsEnvironmentFilter {
    if (
      value &&
      WEB_ANALYTICS_ENVIRONMENTS.includes(
        value as WebAnalyticsEnvironmentFilter,
      )
    ) {
      return value as WebAnalyticsEnvironmentFilter;
    }
    return 'production';
  }

  private buildEnvironmentFilter(
    environment: WebAnalyticsEnvironmentFilter,
  ): string | undefined {
    if (environment === 'all') return undefined;
    return `environment eq '${environment}'`;
  }

  private mapDailyRows(rows: VercelVisitsAggregateRow[]): WebAnalyticsDailyRow[] {
    return rows
      .map((row) => ({
        date: row.timestamp
          ? this.formatDateOnly(new Date(row.timestamp))
          : '',
        pageviews: Number(row.pageviews) || 0,
        visitors: Number(row.visitors) || 0,
      }))
      .filter((row) => row.date)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private mapDimensionRows(
    rows: VercelVisitsAggregateRow[],
    key: keyof VercelVisitsAggregateRow,
  ): WebAnalyticsMetricRow[] {
    return rows
      .map((row) => {
        const raw = row[key];
        const label =
          typeof raw === 'string' && raw.trim()
            ? raw.trim()
            : raw == null || raw === ''
              ? '(none)'
              : String(raw);
        return {
          label,
          pageviews: Number(row.pageviews) || 0,
          visitors: Number(row.visitors) || 0,
        };
      })
      .sort((a, b) => b.visitors - a.visitors || b.pageviews - a.pageviews);
  }

  private parseDateOnly(value: string, field: 'since' | 'until'): Date {
    const trimmed = value.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      throw new BadRequestException(
        `\`${field}\` must be a date in YYYY-MM-DD format.`,
      );
    }
    const date = new Date(`${trimmed}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid \`${field}\` date.`);
    }
    return date;
  }

  private startOfUtcDay(date: Date): Date {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private addUtcDays(date: Date, days: number): Date {
    const next = new Date(date.getTime());
    next.setUTCDate(next.getUTCDate() + days);
    return next;
  }

  private formatDateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
