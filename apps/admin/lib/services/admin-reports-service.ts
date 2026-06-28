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
