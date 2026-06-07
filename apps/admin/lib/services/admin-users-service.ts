import { apiClient } from "@/lib/api/client";

export const BACKGROUND_CHECK_STATUSES = [
  "Not Required",
  "Pending",
  "In Progress",
  "Passed",
  "Failed",
  "Expired",
] as const;

export type BackgroundCheckStatusFilter = (typeof BACKGROUND_CHECK_STATUSES)[number];

export interface AdminUserRow {
  id: string;
  email: string;
  accountType: string;
  status: string;
  emailVerified: boolean;
  signupCompleted?: boolean;
  platformAccessEnabled?: boolean;
  preferredLocale?: string | null;
  selectedRole?: string | null;
  createdAt?: string;
  lastLoginAt?: string | null;
  /** Welper only: fee paid for background check. null for non-welpers. */
  backgroundCheckPaid?: boolean | null;
  backgroundCheckStatus?: string | null;
  /** Customer/Welper signup wizard progress; null for Admin. */
  signupStepsCompleted?: number | null;
  signupStepsRequired?: number | null;
  profilePhotoUrl?: string | null;
}

export type AdminUsersSortBy = "createdAt" | "email" | "status" | "lastLoginAt" | "signupSteps";
export type AdminUsersSortDir = "asc" | "desc";

export interface AdminUserVerification {
  id?: string;
  userId?: string;
  backgroundCheckStatus?: string;
  emailVerified?: boolean;
  identityVerified?: boolean;
}

export interface AdminUserDetail extends AdminUserRow {
  updatedAt?: string;
  backgroundCheckPaidAt?: string | null;
  backgroundCheckCertnStatus?: string | null;
  backgroundCheckCertnApplicantUrl?: string | null;
  backgroundCheckFailureReason?: string | null;
  verificationStatus?: AdminUserVerification | null;
  statusChangedAt?: string | null;
  statusChangedByAdminId?: string | null;
  statusChangeReasonCode?: string | null;
  statusChangeReasonDetail?: string | null;
}

export interface AdminSignupStateReadout {
  signupCompleted: boolean;
  selectedRole: string | null;
  completedSteps: string[];
  nextStep: string | null;
  requiredSteps: string[];
  stepSummaries: {
    welperBackgroundCheck?: {
      paid: boolean;
      certnStatus: string;
      skipped?: boolean;
    };
    welperPayout?: {
      stripeOnboardingCompleted?: boolean;
    };
  };
}

export type StatusChangeReasonCode =
  | "tos_violation"
  | "fraud"
  | "payment_abuse"
  | "impersonation"
  | "user_requested"
  | "other";

export interface UpdateAdminUserStatusBody {
  status: string;
  reasonCode?: StatusChangeReasonCode;
  reasonDetail?: string;
}

export interface AdminUsersListResponse {
  users: AdminUserRow[];
  total: number;
}

export async function listAdminUsers(params?: {
  limit?: number;
  offset?: number;
  accountType?: string;
  status?: string;
  emailVerified?: boolean;
  signupCompleted?: boolean;
  backgroundCheckStatus?: string;
  search?: string;
  sortBy?: AdminUsersSortBy;
  sortDir?: AdminUsersSortDir;
}): Promise<AdminUsersListResponse> {
  return apiClient.get<AdminUsersListResponse>("/api/admin/users", {
    params: {
      limit: params?.limit,
      offset: params?.offset,
      accountType: params?.accountType,
      status: params?.status,
      emailVerified: params?.emailVerified,
      signupCompleted: params?.signupCompleted,
      backgroundCheckStatus: params?.backgroundCheckStatus,
      search: params?.search?.trim() || undefined,
      sortBy: params?.sortBy,
      sortDir: params?.sortDir,
    },
  });
}

export function formatSignupStepsProgress(user: AdminUserRow): string {
  if (
    user.signupStepsCompleted == null ||
    user.signupStepsRequired == null
  ) {
    return "—";
  }
  if (user.signupCompleted) {
    return "Done";
  }
  return `${user.signupStepsCompleted}/${user.signupStepsRequired}`;
}

export async function getAdminUser(id: string): Promise<AdminUserDetail> {
  return apiClient.get<AdminUserDetail>(`/api/admin/users/${encodeURIComponent(id)}`);
}

export async function getAdminUserSignupState(id: string): Promise<AdminSignupStateReadout> {
  return apiClient.get<AdminSignupStateReadout>(
    `/api/admin/users/${encodeURIComponent(id)}/signup-state`,
  );
}

export async function updateAdminUserStatus(
  id: string,
  body: UpdateAdminUserStatusBody,
): Promise<AdminUserDetail> {
  return apiClient.put<AdminUserDetail>(
    `/api/admin/users/${encodeURIComponent(id)}/status`,
    body,
  );
}

export async function setAdminUserBackgroundCheck(
  id: string,
  status: string,
): Promise<{ backgroundCheckStatus?: string }> {
  return apiClient.put<{ backgroundCheckStatus?: string }>(
    `/api/admin/users/${encodeURIComponent(id)}/background-check`,
    { status },
  );
}

export async function unlockAdminUser(id: string): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>(
    `/api/admin/users/${encodeURIComponent(id)}/unlock`,
    {},
  );
}

export interface AdminUserProfile {
  type: "customer" | "welper" | null;
  firstName?: string;
  lastName?: string;
  profilePhotoUrl?: string | null;
  profileCompletionStatus?: string;
  onboardingCompleted?: boolean;
  phoneNumber?: unknown;
  address?: unknown;
  bio?: string | null;
  payoutMethodChoice?: string | null;
  stripeConnectConnected?: boolean;
  stripeConnectAccountLast4?: string | null;
}

export async function getAdminUserProfile(id: string): Promise<AdminUserProfile> {
  return apiClient.get<AdminUserProfile>(
    `/api/admin/users/${encodeURIComponent(id)}/profile`,
  );
}

export async function createAdminUser(
  email: string,
  password: string,
): Promise<AdminUserDetail> {
  return apiClient.post<AdminUserDetail>("/api/admin/users", { email, password });
}

export interface AdminServiceOffering {
  id?: string;
  serviceDescription?: string;
  hourlyRate?: number | string;
  experienceYears?: number | string;
  active?: boolean;
}

/** Splits stored offering text (`title\\n\\ndescription`) for admin display. */
export function parseOfferingDescription(desc: string | undefined): {
  title: string | null;
  body: string;
} {
  const raw = desc?.trim();
  if (!raw) return { title: null, body: "—" };
  const splitAt = raw.indexOf("\n\n");
  if (splitAt > 0 && splitAt <= 120) {
    const title = raw.slice(0, splitAt).trim();
    const body = raw.slice(splitAt + 2).trim();
    return {
      title: title || null,
      body: body || "—",
    };
  }
  return { title: null, body: raw };
}

export async function getAdminUserOfferings(id: string): Promise<AdminServiceOffering[]> {
  return apiClient.get<AdminServiceOffering[]>(
    `/api/admin/users/${encodeURIComponent(id)}/offerings`,
  );
}

export async function setAdminUserProfileFlags(
  id: string,
  flags: { profileComplete?: boolean; onboardingCompleted?: boolean },
): Promise<{ profileCompletionStatus: string; onboardingCompleted: boolean }> {
  return apiClient.put<{ profileCompletionStatus: string; onboardingCompleted: boolean }>(
    `/api/admin/users/${encodeURIComponent(id)}/profile-flags`,
    flags,
  );
}
