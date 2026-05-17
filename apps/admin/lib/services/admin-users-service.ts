import { apiClient } from "@/lib/api/client";

export interface AdminUserRow {
  id: string;
  email: string;
  accountType: string;
  status: string;
  emailVerified: boolean;
  createdAt?: string;
  lastLoginAt?: string | null;
  /** Welper only: fee paid for background check. null for non-welpers. */
  backgroundCheckPaid?: boolean | null;
  backgroundCheckStatus?: string | null;
}

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
  verificationStatus?: AdminUserVerification | null;
  statusChangedAt?: string | null;
  statusChangedByAdminId?: string | null;
  statusChangeReasonCode?: string | null;
  statusChangeReasonDetail?: string | null;
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
  search?: string;
}): Promise<AdminUsersListResponse> {
  return apiClient.get<AdminUsersListResponse>("/api/admin/users", {
    params: {
      limit: params?.limit,
      offset: params?.offset,
      accountType: params?.accountType,
      status: params?.status,
      emailVerified: params?.emailVerified,
      search: params?.search?.trim() || undefined,
    },
  });
}

export async function getAdminUser(id: string): Promise<AdminUserDetail> {
  return apiClient.get<AdminUserDetail>(`/api/admin/users/${encodeURIComponent(id)}`);
}

export async function updateAdminUserStatus(
  id: string,
  body: UpdateAdminUserStatusBody
): Promise<AdminUserDetail> {
  return apiClient.put<AdminUserDetail>(
    `/api/admin/users/${encodeURIComponent(id)}/status`,
    body
  );
}

export async function setAdminUserBackgroundCheck(
  id: string,
  status: string
): Promise<{ backgroundCheckStatus?: string }> {
  return apiClient.put<{ backgroundCheckStatus?: string }>(
    `/api/admin/users/${encodeURIComponent(id)}/background-check`,
    { status }
  );
}

export async function unlockAdminUser(id: string): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>(
    `/api/admin/users/${encodeURIComponent(id)}/unlock`,
    {}
  );
}

// --- Profile ---

export interface AdminUserProfile {
  type: "customer" | "welper" | null;
  firstName?: string;
  lastName?: string;
  profileCompletionStatus?: string;
  onboardingCompleted?: boolean;
  phoneNumber?: unknown;
  address?: unknown;
  bio?: string | null;
}

export async function getAdminUserProfile(id: string): Promise<AdminUserProfile> {
  return apiClient.get<AdminUserProfile>(
    `/api/admin/users/${encodeURIComponent(id)}/profile`
  );
}

export async function createAdminUser(
  email: string,
  password: string
): Promise<AdminUserDetail> {
  return apiClient.post<AdminUserDetail>("/api/admin/users", { email, password });
}

export async function getAdminUserOfferings(id: string): Promise<unknown[]> {
  return apiClient.get<unknown[]>(`/api/admin/users/${encodeURIComponent(id)}/offerings`);
}

export async function setAdminUserProfileFlags(
  id: string,
  flags: { profileComplete?: boolean; onboardingCompleted?: boolean }
): Promise<{ profileCompletionStatus: string; onboardingCompleted: boolean }> {
  return apiClient.put<{ profileCompletionStatus: string; onboardingCompleted: boolean }>(
    `/api/admin/users/${encodeURIComponent(id)}/profile-flags`,
    flags
  );
}
