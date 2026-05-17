"use client";

import type { QueryClient } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { clearClientAuthState } from "@/lib/auth/client-sign-out";

/**
 * Clears the current NextAuth session before a new credentials sign-in so tokens
 * and user identity do not collide (fixes "session not ready" / wrong account).
 */
export async function clearSessionForSignIn(
  queryClient?: QueryClient,
): Promise<void> {
  try {
    await signOut({ redirect: false });
  } catch {
    // continue — local caches must still clear
  }
  clearClientAuthState(queryClient);
}
