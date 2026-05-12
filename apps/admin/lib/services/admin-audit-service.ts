import { apiClient } from "@/lib/api/client";

export interface AdminAuditEntry {
  id: string;
  actorUserId: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AdminAuditListResponse {
  data: AdminAuditEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listAdminAuditLogs(params?: {
  page?: number;
  limit?: number;
}): Promise<AdminAuditListResponse> {
  return apiClient.get<AdminAuditListResponse>("/api/admin/audit-logs", {
    params: { page: params?.page, limit: params?.limit },
  });
}
