import { apiClient } from "@/lib/api/client";

export interface AdminReferral {
  id: string;
  referrerUserId: string;
  refereeUserId: string;
  referralCodeId: string;
  status: string;
  referralDate: string;
  completionDate: string | null;
  rewardStatus: string;
  rewardAmount: number | null;
  rewardDate: string | null;
  createdAt: string;
}

export interface AdminReferralsResponse {
  items: AdminReferral[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminReferralStats {
  total: number;
  completed: number;
  rewarded: number;
  totalRewardAmount: number;
}

export async function listAdminReferrals(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<AdminReferralsResponse> {
  return apiClient.get<AdminReferralsResponse>("/api/admin/referrals", { params: { ...params } });
}

export async function getAdminReferralStats(): Promise<AdminReferralStats> {
  return apiClient.get<AdminReferralStats>("/api/admin/referrals/stats");
}
