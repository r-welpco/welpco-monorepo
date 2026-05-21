"use client";

import type { Session } from "next-auth";
import { getSession } from "next-auth/react";
import { clearTokenCache } from "@/lib/api/get-token";

const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

type RefreshResponse = {
  accessToken?: string;
  refreshToken?: string;
};

/**
 * After signup role changes on the BFF, rotate tokens so the access JWT
 * carries the updated `accountType` (refresh loads the user from DB).
 */
export async function refreshBffTokensInSession(
  updateSession: (data?: unknown) => Promise<Session | null>,
): Promise<void> {
  const session = (await getSession()) as Session | null;
  const refreshToken = session?.refreshToken;
  if (!refreshToken) return;

  try {
    const response = await fetch(`${API_ORIGIN}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) return;

    const data = (await response.json()) as RefreshResponse;
    if (!data.accessToken) return;

    await updateSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
    clearTokenCache();
  } catch {
    // Non-fatal — session role is still patched via updateSession user fields.
  }
}
