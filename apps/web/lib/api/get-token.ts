/**
 * Get JWT access token from NextAuth session
 * Works in both client and server contexts
 * Uses proper TypeScript types from next-auth module augmentation
 */

import type { Session } from "next-auth";

// Cache to prevent excessive session calls
// Using module-level cache with TTL for better performance
let lastTokenFetch: { token: string | null; timestamp: number; sessionId?: string } | null = null;
// Cache token for 30 seconds. The previous 5-second TTL caused excessive
// getSession() calls and created windows where a soon-to-expire token was
// returned from cache, then expired before the actual API call completed.
// 30 seconds is still well under the 5-minute refresh window.
const TOKEN_CACHE_TTL = 30_000; // 30 seconds

/**
 * Clear the token cache (useful for testing or forced refresh)
 * This should be called when authentication state changes (login/logout)
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

export async function getAccessToken(): Promise<string | null> {
  try {
    if (typeof window !== "undefined") {
      // Check cache first to prevent excessive session calls
      // Following Vercel best practices: js-cache-storage pattern
      const now = Date.now();
      
      // Invalidate cache if expired
      if (lastTokenFetch && (now - lastTokenFetch.timestamp) < TOKEN_CACHE_TTL) {
        return lastTokenFetch.token;
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
      const currentSessionId = typedSession?.user?.id;
      
      // Update cache with session ID for invalidation tracking
      lastTokenFetch = { token, timestamp: now, sessionId: currentSessionId };
      
      if (token) {
        return token;
      }
      
      // If no token, try one more time after a short delay
      await new Promise(resolve => setTimeout(resolve, 100));
      const retrySession = await getSession();
      const retryTypedSession = retrySession as Session | null;
      const retryToken = retryTypedSession?.accessToken || null;
      const retrySessionId = retryTypedSession?.user?.id;
      
      // Update cache with session ID
      lastTokenFetch = { token: retryToken, timestamp: Date.now(), sessionId: retrySessionId };
      
      return retryToken;
    } else {
      // Server-side: use auth() from @/auth
      const { auth } = await import("@/auth");
      const session = await auth();
      // Use proper type instead of 'any'
      const typedSession = session as Session | null;
      return typedSession?.accessToken || null;
    }
  } catch (error) {
    console.error("Error getting access token:", error instanceof Error ? error.message : "Unknown error");
    return null;
  }
}

