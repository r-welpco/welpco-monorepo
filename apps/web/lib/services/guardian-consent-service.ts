import { apiClient } from "@/lib/api/client";

export type GuardianConsentStatusValue =
  | "pending"
  | "approved"
  | "declined"
  | "expired"
  | null;

export interface GuardianConsentStatusResponse {
  required: boolean;
  status: GuardianConsentStatusValue;
  guardianFullName: string | null;
  guardianEmail: string | null;
  guardianPhone: string | null;
  relationshipType: string | null;
  consentedAt: string | null;
  tokenExpiresAt: string | null;
  signupStepComplete: boolean;
}

export interface SubmitGuardianRequestPayload {
  guardianFullName: string;
  guardianEmail: string;
  guardianPhone: string;
  relationshipType: "Parent" | "Legal Guardian";
}

export interface GuardianReviewPreviewResponse {
  minorFirstName: string;
  minorLastName: string;
  guardianFullName: string;
  relationshipType: string;
  status: GuardianConsentStatusValue;
  alreadyApproved: boolean;
  expired: boolean;
}

export async function getGuardianConsentStatus(): Promise<GuardianConsentStatusResponse> {
  return apiClient.get<GuardianConsentStatusResponse>("/api/verification/guardian/status");
}

export async function submitGuardianRequest(
  payload: SubmitGuardianRequestPayload,
): Promise<GuardianConsentStatusResponse> {
  return apiClient.post<GuardianConsentStatusResponse>(
    "/api/verification/guardian/request",
    payload,
  );
}

export async function resendGuardianReviewEmail(): Promise<GuardianConsentStatusResponse> {
  return apiClient.post<GuardianConsentStatusResponse>("/api/verification/guardian/resend");
}

export async function getGuardianReviewPreview(
  token: string,
): Promise<GuardianReviewPreviewResponse> {
  return apiClient.get<GuardianReviewPreviewResponse>(
    `/api/verification/guardian/review?token=${encodeURIComponent(token)}`,
    { skipAuth: true },
  );
}

export async function approveGuardianConsent(token: string): Promise<{ approved: boolean }> {
  return apiClient.post<{ approved: boolean }>(
    "/api/verification/guardian/approve",
    { token },
    { skipAuth: true },
  );
}

export async function declineGuardianConsent(token: string): Promise<{ declined: boolean }> {
  return apiClient.post<{ declined: boolean }>(
    "/api/verification/guardian/decline",
    { token },
    { skipAuth: true },
  );
}

export async function revokeGuardianConsent(token: string): Promise<{ revoked: boolean }> {
  return apiClient.post<{ revoked: boolean }>(
    "/api/verification/guardian/revoke",
    { token },
    { skipAuth: true },
  );
}
