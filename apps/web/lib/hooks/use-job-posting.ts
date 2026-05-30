import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  applyToJob,
  browseJobPostings,
  cancelJobPosting,
  createJobPosting,
  getBookingHandoff,
  getJobApplications,
  getJobPosting,
  getMyJobApplications,
  getMyJobPostings,
  withdrawJobApplication,
  type CreateJobApplicationParams,
  type CreateJobPostingParams,
} from "@/lib/services/job-posting.service";

function useIsAuthenticated(): boolean {
  const { status } = useSession();
  return status === "authenticated";
}

export function useMyJobPostings(
  params?: { page?: number; limit?: number },
  options?: { enabled?: boolean },
) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["jobs", "mine", params],
    queryFn: () => getMyJobPostings(params),
    enabled: isAuthenticated && options?.enabled !== false,
    staleTime: 30_000,
  });
}

export function useBrowseJobPostings(
  params?: {
    categoryId?: string;
    subcategoryId?: string;
    eligibleOnly?: boolean;
    page?: number;
    limit?: number;
  },
  options?: { enabled?: boolean },
) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["jobs", "browse", params],
    queryFn: () => browseJobPostings(params),
    enabled: isAuthenticated && options?.enabled !== false,
    staleTime: 30_000,
  });
}

export function useJobPosting(jobId: string | undefined) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["jobs", jobId],
    queryFn: () => getJobPosting(jobId!),
    enabled: !!jobId && isAuthenticated,
    staleTime: 15_000,
  });
}

export function useJobApplications(jobId: string | undefined, enabled = true) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["jobs", jobId, "applications"],
    queryFn: () => getJobApplications(jobId!),
    enabled: !!jobId && isAuthenticated && enabled,
    staleTime: 15_000,
  });
}

export function useBookingHandoff(jobId: string | undefined, applicationId: string | undefined) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["jobs", jobId, "handoff", applicationId],
    queryFn: () => getBookingHandoff(jobId!, applicationId!),
    enabled: !!jobId && !!applicationId && isAuthenticated,
    staleTime: 0,
  });
}

export function useMyJobApplications(params?: { page?: number; limit?: number }) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["jobs", "applications", "mine", params],
    queryFn: () => getMyJobApplications(params),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useCreateJobPosting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: CreateJobPostingParams) => createJobPosting(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useApplyToJob(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: CreateJobApplicationParams) => applyToJob(jobId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useWithdrawJobApplication(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: string) => withdrawJobApplication(jobId, applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useCancelJobPosting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => cancelJobPosting(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}
