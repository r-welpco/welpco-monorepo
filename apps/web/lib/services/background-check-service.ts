import { apiClient } from "@/lib/api/client";

export interface BackgroundCheckPricing {
  listPriceCents: number;
  promoPriceCents: number;
  promoEnabled: boolean;
  chargePriceCents: number;
  currency: string;
}

export interface BackgroundCheckStatusResponse {
  required: boolean;
  pricing: BackgroundCheckPricing;
  paymentStatus: string | null;
  certnStatus: string | null;
  certnApplicantUrl: string | null;
  /** True when Certn invite succeeded but the applicant completes via email (no in-app URL). */
  certnInviteSentViaEmail?: boolean;
  certnInviteReady?: boolean;
  failureReason: string | null;
  backgroundCheckStatus: string;
  signupStepComplete: boolean;
}

export async function getBackgroundCheckPricing(): Promise<BackgroundCheckPricing> {
  return apiClient.get<BackgroundCheckPricing>(
    "/api/verification/background-check/pricing",
  );
}

export async function getBackgroundCheckStatus(): Promise<BackgroundCheckStatusResponse> {
  return apiClient.get<BackgroundCheckStatusResponse>(
    "/api/verification/background-check/status",
  );
}

export async function createBackgroundCheckCheckoutSession(
  locale: "en" | "fr" = "en",
): Promise<{
  url: string;
  sessionId: string;
}> {
  return apiClient.post<{ url: string; sessionId: string }>(
    "/api/verification/background-check/checkout-session",
    { locale },
  );
}

export async function confirmBackgroundCheckReturn(
  sessionId: string,
): Promise<BackgroundCheckStatusResponse> {
  return apiClient.post<BackgroundCheckStatusResponse>(
    "/api/verification/background-check/confirm-return",
    { sessionId },
  );
}

export async function retryBackgroundCheckCertnInvite(): Promise<BackgroundCheckStatusResponse> {
  return apiClient.post<BackgroundCheckStatusResponse>(
    "/api/verification/background-check/retry-invite",
  );
}

export async function resendBackgroundCheckInviteEmail(): Promise<BackgroundCheckStatusResponse> {
  return apiClient.post<BackgroundCheckStatusResponse>(
    "/api/verification/background-check/resend-invite-email",
  );
}
