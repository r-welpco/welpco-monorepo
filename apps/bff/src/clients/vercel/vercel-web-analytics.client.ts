import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const VERCEL_API_BASE = 'https://api.vercel.com/v1/query/web-analytics';

export type VercelVisitEnvironment =
  | 'production'
  | 'preview'
  | 'development';

export interface VercelVisitsCountData {
  pageviews: number;
  visitors: number;
}

export interface VercelVisitsCountResponse {
  version: number;
  query: {
    since?: string;
    until?: string;
    filter?: string;
  };
  data: VercelVisitsCountData;
}

export interface VercelVisitsAggregateRow {
  pageviews: number;
  visitors: number;
  timestamp?: string;
  requestPath?: string;
  referrerHostname?: string;
  country?: string;
  deviceType?: string;
  route?: string;
  browserName?: string;
  osName?: string;
  [key: string]: string | number | undefined;
}

export interface VercelVisitsAggregateResponse {
  version: number;
  query: {
    since?: string;
    until?: string;
    groupBy?: string[];
    filter?: string;
    limit?: number;
  };
  data: VercelVisitsAggregateRow[];
}

export interface VercelVisitsQueryParams {
  since?: string;
  until?: string;
  filter?: string;
  by?: string | string[];
  limit?: number;
}

/**
 * Thin HTTP client for Vercel's public Web Analytics API.
 *
 * Docs: https://vercel.com/docs/analytics/web-analytics-api
 *
 * Env:
 *   - VERCEL_TOKEN — access token with read access to the web project
 *   - VERCEL_WEB_PROJECT_ID — project id (or name) for apps/web
 *   - VERCEL_TEAM_ID — team id (preferred) OR VERCEL_TEAM_SLUG
 */
@Injectable()
export class VercelWebAnalyticsClient implements OnModuleInit {
  private readonly logger = new Logger(VercelWebAnalyticsClient.name);
  private token: string | null = null;
  private projectId: string | null = null;
  private teamId: string | null = null;
  private teamSlug: string | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.token = this.trimOrNull(this.configService.get<string>('VERCEL_TOKEN'));
    this.projectId = this.trimOrNull(
      this.configService.get<string>('VERCEL_WEB_PROJECT_ID'),
    );
    this.teamId = this.trimOrNull(
      this.configService.get<string>('VERCEL_TEAM_ID'),
    );
    this.teamSlug = this.trimOrNull(
      this.configService.get<string>('VERCEL_TEAM_SLUG'),
    );

    if (!this.isConfigured()) {
      this.logger.warn(
        'Vercel Web Analytics not configured (need VERCEL_TOKEN + VERCEL_WEB_PROJECT_ID + VERCEL_TEAM_ID or VERCEL_TEAM_SLUG). Admin web-analytics report will return 503 until configured.',
      );
    }
  }

  isConfigured(): boolean {
    return Boolean(
      this.token && this.projectId && (this.teamId || this.teamSlug),
    );
  }

  assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Web Analytics is not configured. Set VERCEL_TOKEN, VERCEL_WEB_PROJECT_ID, and VERCEL_TEAM_ID (or VERCEL_TEAM_SLUG) on the BFF.',
      );
    }
  }

  async countVisits(
    params: VercelVisitsQueryParams = {},
  ): Promise<VercelVisitsCountResponse> {
    return this.getJson<VercelVisitsCountResponse>('visits/count', params);
  }

  async aggregateVisits(
    params: VercelVisitsQueryParams,
  ): Promise<VercelVisitsAggregateResponse> {
    if (!params.by) {
      throw new Error('aggregateVisits requires a `by` grouping dimension');
    }
    return this.getJson<VercelVisitsAggregateResponse>(
      'visits/aggregate',
      params,
    );
  }

  private async getJson<T>(
    path: string,
    params: VercelVisitsQueryParams,
  ): Promise<T> {
    this.assertConfigured();

    const url = new URL(`${VERCEL_API_BASE}/${path}`);
    url.searchParams.set('projectId', this.projectId!);
    if (this.teamId) {
      url.searchParams.set('teamId', this.teamId);
    } else if (this.teamSlug) {
      url.searchParams.set('slug', this.teamSlug);
    }
    if (params.since) url.searchParams.set('since', params.since);
    if (params.until) url.searchParams.set('until', params.until);
    if (params.filter) url.searchParams.set('filter', params.filter);
    if (params.limit != null) {
      url.searchParams.set('limit', String(params.limit));
    }
    if (params.by) {
      const groups = Array.isArray(params.by) ? params.by : [params.by];
      for (const group of groups) {
        url.searchParams.append('by', group);
      }
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/json',
        },
      });
    } catch (error) {
      this.logger.error(
        `Vercel Web Analytics request failed: ${path}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new ServiceUnavailableException(
        'Unable to reach Vercel Web Analytics. Try again later.',
      );
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      this.logger.warn(
        `Vercel Web Analytics ${path} returned ${response.status}: ${body.slice(0, 500)}`,
      );
      if (response.status === 401 || response.status === 403) {
        throw new ServiceUnavailableException(
          'Vercel rejected the Web Analytics credentials. Check VERCEL_TOKEN permissions.',
        );
      }
      if (response.status === 404) {
        throw new ServiceUnavailableException(
          'Vercel Web Analytics project not found. Check VERCEL_WEB_PROJECT_ID and team scope.',
        );
      }
      throw new ServiceUnavailableException(
        `Vercel Web Analytics request failed (${response.status}).`,
      );
    }

    return (await response.json()) as T;
  }

  private trimOrNull(value?: string | null): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }
}
