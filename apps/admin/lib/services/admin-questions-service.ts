import { apiClient } from "@/lib/api/client";

// --- Types ---

export type QuestionType = "text" | "number" | "date" | "time" | "choice" | "boolean" | "entity_reference";
export type EntityType = "child" | "person" | "pet";

export interface AdminQuestion {
  id: string;
  type: QuestionType;
  label: string;
  placeholder: string | null;
  helpText: string | null;
  validationRules: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  } | null;
  options: Array<{ value: string; label: string }> | null;
  entityType: EntityType | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminServiceQuestion {
  id: string;
  serviceCategoryId: string;
  questionId: string;
  displayOrder: number;
  isRequired: boolean;
  conditionalLogic: {
    showIf?: { questionId: string; value: string | number | boolean };
  } | null;
  question: AdminQuestion;
  serviceCategory?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface AdminCategory {
  id: string;
  name: string;
  parentId: string | null;
  level: number;
  displayOrder: number;
  isActive: boolean;
  children?: AdminCategory[];
}

export interface CreateQuestionBody {
  type: QuestionType;
  label: string;
  placeholder?: string | null;
  helpText?: string | null;
  validationRules?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  } | null;
  options?: Array<{ value: string; label: string }> | null;
  entityType?: EntityType | null;
  displayOrder?: number;
}

export interface AssignQuestionBody {
  serviceCategoryId: string;
  questionId: string;
  displayOrder?: number;
  isRequired?: boolean;
  conditionalLogic?: {
    showIf?: { questionId: string; value: string | number | boolean };
  } | null;
}

// --- Questions CRUD ---

export async function listQuestions(): Promise<AdminQuestion[]> {
  return apiClient.get<AdminQuestion[]>("/api/questions");
}

export async function getQuestion(id: string): Promise<AdminQuestion> {
  return apiClient.get<AdminQuestion>(`/api/questions/${encodeURIComponent(id)}`);
}

export async function createQuestion(body: CreateQuestionBody): Promise<AdminQuestion> {
  return apiClient.post<AdminQuestion>("/api/questions", body);
}

export async function updateQuestion(id: string, body: Partial<CreateQuestionBody>): Promise<AdminQuestion> {
  return apiClient.put<AdminQuestion>(`/api/questions/${encodeURIComponent(id)}`, body);
}

export async function deleteQuestion(id: string): Promise<void> {
  await apiClient.delete(`/api/questions/${encodeURIComponent(id)}`);
}

// --- Service Question Assignments ---

export async function getServiceQuestions(categoryId: string): Promise<AdminServiceQuestion[]> {
  return apiClient.get<AdminServiceQuestion[]>(
    `/api/service-questions/service/${encodeURIComponent(categoryId)}`
  );
}

export async function assignQuestion(body: AssignQuestionBody): Promise<AdminServiceQuestion> {
  return apiClient.post<AdminServiceQuestion>("/api/service-questions", body);
}

export async function updateServiceQuestion(
  id: string,
  body: Partial<AssignQuestionBody>
): Promise<AdminServiceQuestion> {
  return apiClient.put<AdminServiceQuestion>(`/api/service-questions/${encodeURIComponent(id)}`, body);
}

export async function removeServiceQuestion(id: string): Promise<void> {
  await apiClient.delete(`/api/service-questions/${encodeURIComponent(id)}`);
}

// --- Categories ---

export async function listCategories(): Promise<AdminCategory[]> {
  return apiClient.get<AdminCategory[]>("/api/content/categories");
}
