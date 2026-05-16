"use client";

import type { QueryClient } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { clearTokenCache } from "@/lib/api/get-token";
import { useAuthStore } from "@/stores/authStore";

/** React Query key for signup wizard state — cleared on logout. */
export const SIGNUP_STATE_QUERY_KEY = ["signup", "state"] as const;

export type ClientSignOutOptions = {
  callbackUrl?: string;
  queryClient?: QueryClient;
};

/**
 * Clears client-side auth caches before NextAuth removes the session cookie.
 */
export function clearClientAuthState(queryClient?: QueryClient): void {
  clearTokenCache();
  useAuthStore.getState().logout();
  queryClient?.removeQueries({ queryKey: SIGNUP_STATE_QUERY_KEY });
  queryClient?.clear();
}

/**
 * Full client logout: Zustand, token cache, React Query, then NextAuth signOut.
 */
export async function performClientSignOut(
  options: ClientSignOutOptions = {},
): Promise<void> {
  const { callbackUrl = "/", queryClient } = options;
  clearClientAuthState(queryClient);
  await signOut({ callbackUrl, redirect: true });
}
