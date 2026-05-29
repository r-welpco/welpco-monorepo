import { apiClient } from "@/lib/api/client";
import type { ServiceCategory, Question, StaticContent } from "@/types";
import type { ServiceQuestion } from "./booking-service";

// Categories
export async function getCategories(includeInactive = false): Promise<ServiceCategory[]> {
  const response = await apiClient.get<ServiceCategory[]>("/api/content/categories", {
    params: { includeInactive },
  });
  return response;
}

export async function getCategory(id: string): Promise<ServiceCategory> {
  const response = await apiClient.get<ServiceCategory>(`/api/content/categories/${id}`);
  return response;
}

export async function getCategoriesByParent(parentId: string | null): Promise<ServiceCategory[]> {
  const parentParam = parentId === null ? 'null' : parentId;
  const response = await apiClient.get<ServiceCategory[]>(
    `/api/content/categories/parent/${parentParam}`
  );
  return response;
}

// Questions
export async function getQuestions(): Promise<Question[]> {
  const response = await apiClient.get<Question[]>("/api/content/questions");
  return response;
}

export async function getQuestion(id: string): Promise<Question> {
  const response = await apiClient.get<Question>(`/api/content/questions/${id}`);
  return response;
}

// Service Questions (canonical BFF route — same as booking flow)
export async function getServiceQuestions(
  serviceCategoryId: string,
): Promise<ServiceQuestion[]> {
  const { getServiceQuestions: fetchServiceQuestions } = await import(
    "./booking-service"
  );
  return fetchServiceQuestions(serviceCategoryId);
}

// Static Content
export async function getStaticContent(includeUnpublished = false): Promise<StaticContent[]> {
  const response = await apiClient.get<StaticContent[]>("/api/content/static-content", {
    params: { includeUnpublished },
  });
  return response;
}

export async function getStaticContentByType(
  contentType: string,
  includeUnpublished = false
): Promise<StaticContent | null> {
  const response = await apiClient.get<StaticContent | null>(
    `/api/content/static-content/type/${contentType}`,
    {
      params: { includeUnpublished },
    }
  );
  return response;
}
