import { apiClient } from "@/lib/api/client";

export interface StripeConnectStatusDto {
  hasAccount: boolean;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}

export async function getStripeConnectStatus(): Promise<StripeConnectStatusDto> {
  return apiClient.get<StripeConnectStatusDto>("/api/payment/connect/status");
}

export async function syncStripeConnectAccount(): Promise<StripeConnectStatusDto> {
  return apiClient.post<StripeConnectStatusDto>("/api/payment/connect/sync");
}

export async function createStripeConnectAccountLink(
  locale: "en" | "fr",
): Promise<{ url: string }> {
  return apiClient.post<{ url: string }>("/api/payment/connect/account-link", {
    locale,
  });
}
