"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  claimHandle,
  getProfileViewStats,
  getShareProfileInfo,
} from "@/lib/services/share-service";

/** SHARE-004 — Share hub queries/mutations (welper-only endpoints). */

function useIsAuthenticated(): boolean {
  const { status } = useSession();
  return status === "authenticated";
}

export function useShareProfileInfo(enabled: boolean = true) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["shareProfileInfo"],
    queryFn: getShareProfileInfo,
    enabled: enabled && isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProfileViewStats(enabled: boolean = true) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["profileViewStats"],
    queryFn: getProfileViewStats,
    enabled: enabled && isAuthenticated,
    staleTime: 60 * 1000,
  });
}

export function useClaimHandle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (handle: string) => claimHandle(handle),
    onSuccess: () => {
      // The handle rides on both the share info and the /me-backed profile cache.
      void queryClient.invalidateQueries({ queryKey: ["shareProfileInfo"] });
      void queryClient.invalidateQueries({ queryKey: ["welperProfile"] });
    },
  });
}
