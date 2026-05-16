"use client";

import type { QueryClient } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { clearTokenCache } from "@/lib/api/get-token";
import { useAuthStore } from "@/stores/authStore";

/** React Query key for signup wizard state — cleared on logout. */
export const SIGNUP_STATE_QUERY_KEY = ["signup", "state"] as const;

let clientSigningOut = false;

/** True while performClientSignOut is in progress (prevents session sync from repopulating state). */
export function isClientSigningOut(): boolean {
  return clientSigningOut;
}

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
 * Full client logout: NextAuth signOut, then clear local caches, then hard-navigate.
 * Sign-out runs before React Query is cleared so dashboard teardown does not abort logout.
 */
export async function performClientSignOut(
  options: ClientSignOutOptions = {},
): Promise<void> {
  const { callbackUrl = "/", queryClient } = options;
  if (clientSigningOut) return;

  clientSigningOut = true;
  try {
    await signOut({ redirectTo: callbackUrl, redirect: false });
    clearClientAuthState(queryClient);
    window.location.assign(callbackUrl);
  } catch {
    clearClientAuthState(queryClient);
    window.location.assign(callbackUrl);
  }
}
