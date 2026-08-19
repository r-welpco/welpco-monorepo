/**
 * Get JWT access token (and acting role) from NextAuth session
 * Works in both client and server contexts
 * Uses proper TypeScript types from next-auth module augmentation
 */

import type { Session } from "next-auth";

/**
 * Dual-role accounts: the session role the API client should claim via the
 * X-Welpco-Role request header. Mirrors `session.user.role` (which already
 * reflects customer mode for Welper accounts). The BFF only honors the
 * welper→customer downgrade, so sending it on every request is safe.
 */
export type ActingRole = "customer" | "welper" | null;

interface AuthContext {
  token: string | null;
  actingRole: ActingRole;
}

// Cache to prevent excessive session calls
// Using module-level cache with TTL for better performance
let lastTokenFetch: {
  token: string | null;
  actingRole: ActingRole;
  timestamp: number;
  sessionId?: string;
} | null = null;
// Cache token for 30 seconds. The previous 5-second TTL caused excessive
// getSession() calls and created windows where a soon-to-expire token was
// returned from cache, then expired before the actual API call completed.
// 30 seconds is still well under the 5-minute refresh window.
const TOKEN_CACHE_TTL = 30_000; // 30 seconds

/**
 * Clear the token cache (useful for testing or forced refresh)
 * This should be called when authentication state changes (login/logout,
 * role-mode switch) so the next request re-reads the session.
 * Following Vercel best practices: cache-storage pattern
 */
export function clearTokenCache(): void {
  lastTokenFetch = null;
}

/**
 * Invalidate cache if session changed (different user logged in)
 * This prevents serving stale tokens from previous sessions
 */
function shouldInvalidateCache(currentSessionId?: string): boolean {
  if (!lastTokenFetch) return false;
  if (lastTokenFetch.sessionId && currentSessionId && lastTokenFetch.sessionId !== currentSessionId) {
    return true;
  }
  return false;
}

function actingRoleFromSession(session: Session | null): ActingRole {
  const role = session?.user?.role;
  return role === "customer" || role === "welper" ? role : null;
}

export async function getAuthContext(): Promise<AuthContext> {
  try {
    if (typeof window !== "undefined") {
      // Check cache first to prevent excessive session calls
      // Following Vercel best practices: js-cache-storage pattern
      const now = Date.now();

      // Invalidate cache if expired
      if (lastTokenFetch && (now - lastTokenFetch.timestamp) < TOKEN_CACHE_TTL) {
        return { token: lastTokenFetch.token, actingRole: lastTokenFetch.actingRole };
      }

      // Client-side: use getSession from next-auth/react
      // Don't force refetch unless necessary to prevent infinite loops
      const { getSession } = await import("next-auth/react");
      const session = await getSession();

      // Check if session changed (different user)
      const sessionId = session?.user?.id;
      if (shouldInvalidateCache(sessionId)) {
        lastTokenFetch = null; // Clear cache if session changed
      }

      // Use proper type instead of 'any'
      const typedSession = session as Session | null;
      const token = typedSession?.accessToken || null;
      const actingRole = actingRoleFromSession(typedSession);
      const currentSessionId = typedSession?.user?.id;

      // Update cache with session ID for invalidation tracking
      lastTokenFetch = { token, actingRole, timestamp: now, sessionId: currentSessionId };

      if (token) {
        return { token, actingRole };
      }

      // If no token, try one more time after a short delay
      await new Promise(resolve => setTimeout(resolve, 100));
      const retrySession = await getSession();
      const retryTypedSession = retrySession as Session | null;
      const retryToken = retryTypedSession?.accessToken || null;
      const retryActingRole = actingRoleFromSession(retryTypedSession);
      const retrySessionId = retryTypedSession?.user?.id;

      // Update cache with session ID
      lastTokenFetch = {
        token: retryToken,
        actingRole: retryActingRole,
        timestamp: Date.now(),
        sessionId: retrySessionId,
      };

      return { token: retryToken, actingRole: retryActingRole };
    } else {
      // Server-side: use auth() from @/auth
      const { auth } = await import("@/auth");
      const session = await auth();
      // Use proper type instead of 'any'
      const typedSession = session as Session | null;
      return {
        token: typedSession?.accessToken || null,
        actingRole: actingRoleFromSession(typedSession),
      };
    }
  } catch (error) {
    console.error("Error getting access token:", error instanceof Error ? error.message : "Unknown error");
    return { token: null, actingRole: null };
  }
}

export async function getAccessToken(): Promise<string | null> {
  return (await getAuthContext()).token;
}
