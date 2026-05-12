import { apiClient } from "@/lib/api/client";

export interface AdminCategory {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  level: number;
  displayOrder: number;
  icon: string | null;
  isActive: boolean;
  children?: AdminCategory[];
  createdAt: string;
  updatedAt: string;
}

export async function listCategories(includeInactive = true): Promise<AdminCategory[]> {
  return apiClient.get<AdminCategory[]>("/api/categories", {
    params: { includeInactive },
  });
}

export async function getCategory(id: string): Promise<AdminCategory> {
  return apiClient.get<AdminCategory>(`/api/categories/${encodeURIComponent(id)}`);
}

export async function getCategoriesByParent(parentId: string | null): Promise<AdminCategory[]> {
  return apiClient.get<AdminCategory[]>(`/api/categories/parent/${parentId ?? "null"}`);
}

export async function createCategory(body: {
  name: string;
  description?: string;
  parentId?: string | null;
  level?: number;
  displayOrder?: number;
  icon?: string;
  isActive?: boolean;
}): Promise<AdminCategory> {
  return apiClient.post<AdminCategory>("/api/categories", body);
}

export async function updateCategory(
  id: string,
  body: Partial<{ name: string; description: string; displayOrder: number; icon: string; isActive: boolean }>
): Promise<AdminCategory> {
  return apiClient.put<AdminCategory>(`/api/categories/${encodeURIComponent(id)}`, body);
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/api/categories/${encodeURIComponent(id)}`);
}
