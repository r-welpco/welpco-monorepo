import { apiClient } from "@/lib/api/client";

export const WELPER_DISTRIBUTION_SCOPES = [
  "discoverable",
  "active",
  "all",
] as const;

export type WelperDistributionScope = (typeof WELPER_DISTRIBUTION_SCOPES)[number];

export const WELPER_DISTRIBUTION_MAP_STYLES = [
  "light",
  "standard",
  "grayscale",
  "minimal",
] as const;

export type WelperDistributionMapStyle =
  (typeof WELPER_DISTRIBUTION_MAP_STYLES)[number];

export interface WelperDistributionQuery {
  scope?: WelperDistributionScope;
  status?: string;
  signupCompleted?: boolean;
  emailVerified?: boolean;
  backgroundCheckStatus?: string;
  serviceCategoryId?: string;
  serviceSubcategoryId?: string;
  provinceCode?: string;
  city?: string;
}

export interface WelperDistributionSummary {
  total: number;
  active: number;
  discoverable: number;
  signupIncomplete: number;
  pendingBackgroundCheck: number;
  missingCoordinates: number;
}

export interface WelperDistributionBucket {
  city: string;
  provinceCode: string;
  countryCode: string;
  welperCount: number;
  activeCount: number;
  discoverableCount: number;
  signupIncompleteCount: number;
  pendingBackgroundCheckCount: number;
  missingCoordinateCount: number;
  latitude: number | null;
  longitude: number | null;
  statusBreakdown: Record<string, number>;
}

export interface WelperDistributionReport {
  scope: WelperDistributionScope;
  filters: WelperDistributionQuery;
  summary: WelperDistributionSummary;
  buckets: WelperDistributionBucket[];
  generatedAt: string;
}

export async function getWelperDistributionReport(
  params?: WelperDistributionQuery,
): Promise<WelperDistributionReport> {
  return apiClient.get<WelperDistributionReport>(
    "/api/admin/reports/welper-distribution",
    {
      params: {
        scope: params?.scope,
        status: params?.status,
        signupCompleted: params?.signupCompleted,
        emailVerified: params?.emailVerified,
        backgroundCheckStatus: params?.backgroundCheckStatus,
        serviceCategoryId: params?.serviceCategoryId,
        serviceSubcategoryId: params?.serviceSubcategoryId,
        provinceCode: params?.provinceCode?.trim() || undefined,
        city: params?.city?.trim() || undefined,
      },
    },
  );
}

export const WEB_ANALYTICS_ENVIRONMENTS = [
  "production",
  "preview",
  "development",
  "all",
] as const;

export type WebAnalyticsEnvironment =
  (typeof WEB_ANALYTICS_ENVIRONMENTS)[number];

export interface WebAnalyticsQuery {
  since?: string;
  until?: string;
  environment?: WebAnalyticsEnvironment;
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
  environment: WebAnalyticsEnvironment;
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

export async function getWebAnalyticsReport(
  params?: WebAnalyticsQuery,
): Promise<WebAnalyticsReport> {
  return apiClient.get<WebAnalyticsReport>(
    "/api/admin/reports/web-analytics",
    {
      params: {
        since: params?.since?.trim() || undefined,
        until: params?.until?.trim() || undefined,
        environment: params?.environment,
      },
    },
  );
}

export const RESEND_EMAIL_LAST_EVENTS = [
  "bounced",
  "canceled",
  "clicked",
  "complained",
  "delivered",
  "delivery_delayed",
  "failed",
  "opened",
  "queued",
  "scheduled",
  "sent",
  "suppressed",
] as const;

export type ResendEmailLastEvent = (typeof RESEND_EMAIL_LAST_EVENTS)[number];

export interface ResendEmailsQuery {
  limit?: number;
  after?: string;
  before?: string;
  to?: string;
  lastEvent?: ResendEmailLastEvent;
}

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

export async function getResendEmailsReport(
  params?: ResendEmailsQuery,
): Promise<ResendEmailsReport> {
  return apiClient.get<ResendEmailsReport>("/api/admin/reports/emails", {
    params: {
      limit: params?.limit,
      after: params?.after?.trim() || undefined,
      before: params?.before?.trim() || undefined,
      to: params?.to?.trim() || undefined,
      lastEvent: params?.lastEvent,
    },
  });
}

export async function getResendEmailDetail(
  id: string,
): Promise<ResendEmailDetail> {
  return apiClient.get<ResendEmailDetail>(
    `/api/admin/reports/emails/${encodeURIComponent(id)}`,
  );
}
