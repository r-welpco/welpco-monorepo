import { apiClient } from "@/lib/api/client";

export type JobPostingStatus =
  | "published"
  | "applications_open"
  | "converted_to_booking"
  | "completed"
  | "expired"
  | "cancelled";

export type JobApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export type JobApplyBlockReason =
  | "NOT_DISCOVERABLE"
  | "NO_MATCHING_OFFERING"
  | "JOB_CLOSED"
  | "JOB_EXPIRED"
  | "APPLICATION_CAP_REACHED"
  | "ALREADY_APPLIED";

export interface JobPostingListItem {
  id: string;
  title: string;
  categoryId: string;
  subcategoryId: string;
  categoryLabel?: string | null;
  subcategoryLabel?: string | null;
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  durationMinutes: number;
  locationCity?: string | null;
  locationRegion?: string | null;
  status: JobPostingStatus;
  applicationCount: number;
  publishedAt: string | null;
  createdAt: string;
  canApply?: boolean;
  applyBlockReason?: JobApplyBlockReason | null;
  myApplicationId?: string | null;
  customerId?: string;
  bookingId?: string | null;
  customerDisplayName?: string | null;
  customerPhotoUrl?: string | null;
}

export interface JobPostingDetail extends JobPostingListItem {
  customerId: string;
  description: string;
  locationAddress?: string | null;
  answers: Record<string, string | number | boolean>;
  serviceQuestionCategoryId: string;
  bookingId?: string | null;
  expiresAt: string;
  matchingOfferings?: Array<{
    id: string;
    hourlyRate: number;
    serviceDescription: string;
  }>;
  myApplication?: JobApplication | null;
}

export interface JobApplication {
  id: string;
  jobPostingId: string;
  welperId: string;
  offeringId: string;
  proposalMessage: string;
  status: JobApplicationStatus;
  hourlyRateSnapshot?: number | null;
  createdAt: string;
  welperDisplayName?: string | null;
  welperRating?: number | null;
  welperVerified?: boolean;
}

export interface BookingHandoffContext {
  jobPostingId: string;
  jobApplicationId: string;
  jobTitle: string;
  welperId: string;
  offeringId: string;
  serviceQuestionCategoryId: string;
  answers: Record<string, string | number | boolean>;
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  durationMinutes: number;
  locationAddress?: string | null;
  locationCity?: string | null;
  locationRegion?: string | null;
  hourlyRate?: number | null;
  notes?: string | null;
}

export interface PaginatedJobPostings {
  data: JobPostingListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateJobPostingParams {
  categoryId: string;
  subcategoryId: string;
  answers: Record<string, string | number | boolean>;
  title: string;
  description: string;
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  durationMinutes: number;
  locationAddress: string;
}

export interface CreateJobApplicationParams {
  offeringId: string;
  proposalMessage: string;
}

export async function createJobPosting(params: CreateJobPostingParams): Promise<JobPostingDetail> {
  return apiClient.post<JobPostingDetail>("/api/jobs", params);
}

export async function getMyJobPostings(params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedJobPostings> {
  return apiClient.get<PaginatedJobPostings>("/api/jobs/mine", { params });
}

export async function browseJobPostings(params?: {
  categoryId?: string;
  subcategoryId?: string;
  eligibleOnly?: boolean;
  page?: number;
  limit?: number;
}): Promise<PaginatedJobPostings> {
  return apiClient.get<PaginatedJobPostings>("/api/jobs", { params });
}

export async function getJobPosting(id: string): Promise<JobPostingDetail> {
  return apiClient.get<JobPostingDetail>(`/api/jobs/${encodeURIComponent(id)}`);
}

export async function getJobApplications(jobId: string): Promise<JobApplication[]> {
  return apiClient.get<JobApplication[]>(`/api/jobs/${encodeURIComponent(jobId)}/applications`);
}

export async function getBookingHandoff(
  jobId: string,
  applicationId: string,
): Promise<BookingHandoffContext> {
  return apiClient.get<BookingHandoffContext>(
    `/api/jobs/${encodeURIComponent(jobId)}/applications/${encodeURIComponent(applicationId)}/booking-handoff`,
  );
}

export async function applyToJob(
  jobId: string,
  params: CreateJobApplicationParams,
): Promise<JobApplication> {
  return apiClient.post<JobApplication>(`/api/jobs/${encodeURIComponent(jobId)}/applications`, params);
}

export async function withdrawJobApplication(
  jobId: string,
  applicationId: string,
): Promise<JobApplication> {
  return apiClient.post<JobApplication>(
    `/api/jobs/${encodeURIComponent(jobId)}/applications/${encodeURIComponent(applicationId)}/withdraw`,
  );
}

export async function cancelJobPosting(jobId: string): Promise<JobPostingDetail> {
  return apiClient.post<JobPostingDetail>(`/api/jobs/${encodeURIComponent(jobId)}/cancel`);
}

export async function getMyJobApplications(params?: {
  page?: number;
  limit?: number;
}): Promise<{ data: JobApplication[]; total: number; page: number; limit: number; totalPages: number }> {
  return apiClient.get("/api/jobs/applications/mine", { params });
}
