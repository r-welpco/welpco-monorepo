import { apiClient } from "@/lib/api/client";

export interface SupportTicketItem {
  id: string;
  userId: string;
  subject: string;
  category: string;
  description?: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  assignedToUserId?: string | null;
  internalNote?: string | null;
}

export interface SupportTicketsListResponse {
  data: SupportTicketItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type SupportTicketAdminStatus = "open" | "in_progress" | "resolved" | "closed";
export type SupportTicketAdminPriority = "low" | "medium" | "high";

export interface PatchSupportTicketParams {
  status?: SupportTicketAdminStatus;
  priority?: SupportTicketAdminPriority;
  /** Set to null to unassign */
  assignedToUserId?: string | null;
  internalNote?: string | null;
}

export async function listAdminSupportTickets(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<SupportTicketsListResponse> {
  return apiClient.get<SupportTicketsListResponse>("/api/admin/support-tickets", {
    params: {
      page: params?.page,
      limit: params?.limit,
      status: params?.status?.trim() || undefined,
    },
  });
}

export async function getAdminSupportTicket(id: string): Promise<SupportTicketItem> {
  return apiClient.get<SupportTicketItem>(`/api/admin/support-tickets/${encodeURIComponent(id)}`);
}

export async function patchAdminSupportTicket(
  id: string,
  body: PatchSupportTicketParams
): Promise<SupportTicketItem> {
  return apiClient.patch<SupportTicketItem>(`/api/admin/support-tickets/${encodeURIComponent(id)}`, body);
}
