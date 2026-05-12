import { apiClient } from "@/lib/api/client";

// --- Static Content ---

export interface AdminStaticContent {
  id: string;
  contentType: string;
  title: string;
  body: string;
  version: number;
  isPublished: boolean;
  publishedDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function listStaticContent(): Promise<AdminStaticContent[]> {
  return apiClient.get<AdminStaticContent[]>("/api/static-content");
}

export async function getStaticContent(id: string): Promise<AdminStaticContent> {
  return apiClient.get<AdminStaticContent>(`/api/static-content/${encodeURIComponent(id)}`);
}

export async function createStaticContent(body: {
  contentType: string; title: string; body: string; isPublished?: boolean;
}): Promise<AdminStaticContent> {
  return apiClient.post<AdminStaticContent>("/api/static-content", body);
}

export async function updateStaticContent(id: string, body: Partial<{
  title: string; body: string; isPublished: boolean;
}>): Promise<AdminStaticContent> {
  return apiClient.put<AdminStaticContent>(`/api/static-content/${encodeURIComponent(id)}`, body);
}

export async function deleteStaticContent(id: string): Promise<void> {
  await apiClient.delete(`/api/static-content/${encodeURIComponent(id)}`);
}

// --- FAQ Items ---

export interface AdminFAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function listFAQItems(category?: string): Promise<AdminFAQItem[]> {
  return apiClient.get<AdminFAQItem[]>("/api/faq-items", { params: category ? { category } : {} });
}

export async function getFAQItem(id: string): Promise<AdminFAQItem> {
  return apiClient.get<AdminFAQItem>(`/api/faq-items/${encodeURIComponent(id)}`);
}

export async function createFAQItem(body: {
  category: string; question: string; answer: string; displayOrder?: number; isActive?: boolean;
}): Promise<AdminFAQItem> {
  return apiClient.post<AdminFAQItem>("/api/faq-items", body);
}

export async function updateFAQItem(id: string, body: Partial<{
  category: string; question: string; answer: string; displayOrder: number; isActive: boolean;
}>): Promise<AdminFAQItem> {
  return apiClient.put<AdminFAQItem>(`/api/faq-items/${encodeURIComponent(id)}`, body);
}

export async function deleteFAQItem(id: string): Promise<void> {
  await apiClient.delete(`/api/faq-items/${encodeURIComponent(id)}`);
}

// --- Marketing Phrases ---

export interface AdminMarketingPhrase {
  id: string;
  phraseText: string;
  phraseType: string;
  usageContext: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function listMarketingPhrases(phraseType?: string): Promise<AdminMarketingPhrase[]> {
  return apiClient.get<AdminMarketingPhrase[]>("/api/marketing-phrases", { params: phraseType ? { phraseType } : {} });
}

export async function getMarketingPhrase(id: string): Promise<AdminMarketingPhrase> {
  return apiClient.get<AdminMarketingPhrase>(`/api/marketing-phrases/${encodeURIComponent(id)}`);
}

export async function createMarketingPhrase(body: {
  phraseText: string; phraseType: string; usageContext?: string; isActive?: boolean;
}): Promise<AdminMarketingPhrase> {
  return apiClient.post<AdminMarketingPhrase>("/api/marketing-phrases", body);
}

export async function updateMarketingPhrase(id: string, body: Partial<{
  phraseText: string; phraseType: string; usageContext: string; isActive: boolean;
}>): Promise<AdminMarketingPhrase> {
  return apiClient.put<AdminMarketingPhrase>(`/api/marketing-phrases/${encodeURIComponent(id)}`, body);
}

export async function deleteMarketingPhrase(id: string): Promise<void> {
  await apiClient.delete(`/api/marketing-phrases/${encodeURIComponent(id)}`);
}
