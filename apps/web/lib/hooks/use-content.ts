import { useQuery } from "@tanstack/react-query";
import {
  getCategories,
  getCategory,
  getCategoriesByParent,
  getQuestions,
  getQuestion,
  getServiceQuestions,
  getStaticContent,
  getStaticContentByType,
} from "@/lib/services/content-service";

// Categories
export function useContentCategories(includeInactive = false) {
  return useQuery({
    queryKey: ["categories", includeInactive],
    queryFn: () => getCategories(includeInactive),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCategory(id: string, enabled = true) {
  return useQuery({
    queryKey: ["category", id],
    queryFn: () => getCategory(id),
    enabled: !!id && enabled,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCategoriesByParent(parentId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["categories", "parent", parentId],
    queryFn: () => getCategoriesByParent(parentId),
    enabled: enabled,
    staleTime: 10 * 60 * 1000,
  });
}

// Questions
export function useQuestions() {
  return useQuery({
    queryKey: ["questions"],
    queryFn: () => getQuestions(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useQuestion(id: string, enabled = true) {
  return useQuery({
    queryKey: ["question", id],
    queryFn: () => getQuestion(id),
    enabled: !!id && enabled,
    staleTime: 10 * 60 * 1000,
  });
}

// Service Questions
export function useServiceQuestions(serviceCategoryId: string, enabled = true) {
  return useQuery({
    queryKey: ["serviceQuestions", serviceCategoryId],
    queryFn: () => getServiceQuestions(serviceCategoryId),
    enabled: !!serviceCategoryId && enabled,
    staleTime: 10 * 60 * 1000,
  });
}

// Static Content
export function useStaticContent(includeUnpublished = false) {
  return useQuery({
    queryKey: ["staticContent", includeUnpublished],
    queryFn: () => getStaticContent(includeUnpublished),
    staleTime: 10 * 60 * 1000,
  });
}

export function useStaticContentByType(
  contentType: string,
  includeUnpublished = false,
  enabled = true
) {
  return useQuery({
    queryKey: ["staticContent", "type", contentType, includeUnpublished],
    queryFn: () => getStaticContentByType(contentType, includeUnpublished),
    enabled: !!contentType && enabled,
    staleTime: 10 * 60 * 1000,
  });
}
