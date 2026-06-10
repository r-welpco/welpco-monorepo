import { apiClient } from "@/lib/api/client";

export interface WelpersPerSubcategoryRow {
  subcategoryId: string;
  subcategoryName: string;
  welperCount: number;
  displayOrder: number;
}

export interface WelpersPerCategoryRow {
  categoryId: string;
  categoryName: string;
  welperCount: number;
  displayOrder: number;
  subcategories: WelpersPerSubcategoryRow[];
}

export interface AdminDashboardSnapshot {
  generatedAt: string;
  users: {
    totalUsers: number;
    activeUsers: number;
    pendingUsers: number;
    suspendedUsers: number;
    deactivatedUsers: number;
    customers: number;
    welpers: number;
    welpersPending: number;
    welpersSignupIncomplete: number;
    welpersDiscoverable: number;
    welpersBgInProgress: number;
    welpersBgFailed: number;
  };
  welpersPerCategory: WelpersPerCategoryRow[];
  disputes: {
    open: number;
    inReview: number;
    escalated: number;
    resolved: number;
  };
  supportTickets: {
    open: number;
    inProgress: number;
    closed: number;
  };
  bookings: {
    createdLast24h: number;
    currentlyDisputed: number;
  };
  payments: {
    capturedCentsLast7d: number;
    currency: string;
  };
}

export async function getAdminDashboardSnapshot(): Promise<AdminDashboardSnapshot> {
  return apiClient.get<AdminDashboardSnapshot>("/api/admin/dashboard");
}
