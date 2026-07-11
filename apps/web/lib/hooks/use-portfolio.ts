import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  deletePortfolioPhoto,
  listMyPortfolio,
  reorderPortfolio,
  updatePortfolioPhoto,
  uploadPortfolioPhoto,
  type PortfolioPhoto,
  type PortfolioUploadStage,
} from "@/lib/services/portfolio-service";

/**
 * SHARE-001 (web half): React Query wiring for the welper portfolio manager.
 * Follows the `use-profile.ts` pattern — session-gated query, mutations
 * invalidate the single `["myPortfolio"]` key.
 */

const MY_PORTFOLIO_KEY = ["myPortfolio"] as const;

function useIsAuthenticated(): boolean {
  const { status } = useSession();
  return status === "authenticated";
}

export function useMyPortfolio(enabled = true) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: MY_PORTFOLIO_KEY,
    queryFn: listMyPortfolio,
    enabled: enabled && isAuthenticated,
    staleTime: 60 * 1000,
  });
}

export function useUploadPortfolioPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      file: File;
      caption?: string;
      offeringId?: string;
      onStage?: (stage: PortfolioUploadStage) => void;
    }) => uploadPortfolioPhoto(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MY_PORTFOLIO_KEY });
    },
  });
}

export function useUpdatePortfolioPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      photoId,
      data,
    }: {
      photoId: string;
      data: { caption?: string; sortOrder?: number };
    }) => updatePortfolioPhoto(photoId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MY_PORTFOLIO_KEY });
    },
  });
}

export function useDeletePortfolioPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) => deletePortfolioPhoto(photoId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MY_PORTFOLIO_KEY });
    },
  });
}

export function useReorderPortfolio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photoIds: string[]) => reorderPortfolio(photoIds),
    onSuccess: (photos: PortfolioPhoto[]) => {
      // The reorder response IS the fresh ordered list — write it through.
      queryClient.setQueryData(MY_PORTFOLIO_KEY, photos);
    },
  });
}
