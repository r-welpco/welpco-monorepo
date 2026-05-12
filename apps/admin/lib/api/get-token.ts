import type { Session } from "next-auth";

let lastTokenFetch: { token: string | null; timestamp: number; sessionId?: string } | null = null;
const TOKEN_CACHE_TTL = 30_000;

export function clearTokenCache(): void {
  lastTokenFetch = null;
}

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
      const now = Date.now();
      if (lastTokenFetch && now - lastTokenFetch.timestamp < TOKEN_CACHE_TTL) {
        return lastTokenFetch.token;
      }

      const { getSession } = await import("next-auth/react");
      const session = await getSession();
      const sessionId = session?.user?.id;
      if (shouldInvalidateCache(sessionId)) {
        lastTokenFetch = null;
      }

      const typedSession = session as Session | null;
      const token = typedSession?.accessToken || null;
      const currentSessionId = typedSession?.user?.id;
      lastTokenFetch = { token, timestamp: now, sessionId: currentSessionId };

      if (token) return token;

      await new Promise((r) => setTimeout(r, 100));
      const retrySession = await getSession();
      const retryTyped = retrySession as Session | null;
      const retryToken = retryTyped?.accessToken || null;
      lastTokenFetch = { token: retryToken, timestamp: Date.now(), sessionId: retryTyped?.user?.id };
      return retryToken;
    }

    const { auth } = await import("@/auth");
    const session = await auth();
    const typedSession = session as Session | null;
    return typedSession?.accessToken || null;
  } catch (error) {
    console.error("Error getting access token:", error instanceof Error ? error.message : "Unknown");
    return null;
  }
}
