import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";

// Environment variables with defaults for development
// These defaults match what's used in auth.ts and api/client.ts
const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

/** BFF origin for JWT refresh (server / Edge). Prefer a URL reachable from the Next runtime. */
function authRefreshApiOrigin(): string {
  const raw =
    process.env.AUTH_INTERNAL_API_URL ||
    process.env.INTERNAL_API_URL ||
    NEXT_PUBLIC_API_URL;
  return raw.replace(/\/$/, "");
}

/**
 * Read access-token expiry from the JWT payload (no verification — timing hint only).
 * Keeps refresh aligned with BFF JWT_EXPIRES_IN even if it differs from the 15m default.
 */
function decodeAccessTokenExpMs(accessToken: string | undefined): number | undefined {
  if (!accessToken || typeof accessToken !== "string") return undefined;
  const parts = accessToken.split(".");
  if (parts.length < 2) return undefined;
  try {
    const segment = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = segment.length % 4;
    const padded = segment + (pad ? "=".repeat(4 - pad) : "");
    if (typeof atob !== "function") return undefined;
    const json = atob(padded);
    const payload = JSON.parse(json) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp * 1000 : undefined;
  } catch {
    return undefined;
  }
}

function refreshDedupeKey(token: JWT): string {
  const id = token.id;
  if (id !== undefined && id !== null && String(id).length > 0) {
    return String(id);
  }
  const rt = token.refreshToken;
  if (typeof rt === "string" && rt.length > 0) {
    return `rt:${rt.slice(0, 48)}`;
  }
  return "unknown";
}

type WelpcoRefreshPayload = { accessToken?: string; refreshToken?: string } | null | undefined;

function getRefreshPromiseMap(): Map<string, Promise<WelpcoRefreshPayload>> {
  if (!globalThis.__welpcoRefreshByUserKey) {
    globalThis.__welpcoRefreshByUserKey = new Map();
  }
  return globalThis.__welpcoRefreshByUserKey;
}

// In production, these must be explicitly set
if (process.env.NODE_ENV === "production") {
  const missingInProduction: string[] = [];
  if (!process.env.NEXTAUTH_SECRET) {
    missingInProduction.push("NEXTAUTH_SECRET");
  }
  if (!process.env.NEXT_PUBLIC_API_URL) {
    missingInProduction.push("NEXT_PUBLIC_API_URL");
  }
  
  if (missingInProduction.length > 0) {
    throw new Error(
      `Missing required environment variables in production: ${missingInProduction.join(", ")}`
    );
  }
}

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  trustHost: true,
  providers: [],
  callbacks: {
    async jwt({ token, user, account: _account, trigger, session }) {
      // Safety check: if token is null/undefined, return empty token
      if (!token) {
        return {} as JWT;
      }
      
      // During initialization (no user, no access token), return early
      // This prevents refresh attempts when there's no session
      if (!user && !token.accessToken && !token.refreshToken) {
        return token;
      }
      
      // Initial sign in - store user data and tokens
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email ?? undefined;
        token.name = user.name ?? undefined;
        token.image = user.image;
        
        // Store additional user fields from backend
        if ("accountType" in user) {
          token.accountType = user.accountType as string;
        }
        if ("status" in user) {
          token.status = user.status as string;
        }
        if ("emailVerified" in user) {
          token.emailVerified = user.emailVerified as boolean;
        }
        if ("onboardingCompleted" in user) {
          token.onboardingCompleted = user.onboardingCompleted as boolean;
        }
        if ("signupCompleted" in user) {
          token.signupCompleted = user.signupCompleted as boolean;
        }

        // Store JWT tokens from backend (NestJS Passport)
        // These are the actual JWT tokens from the backend
        if ("accessToken" in user) {
          token.accessToken = user.accessToken as string;
        }
        if ("refreshToken" in user) {
          token.refreshToken = user.refreshToken as string;
        }
        const signInExp = decodeAccessTokenExpMs(token.accessToken as string | undefined);
        token.accessTokenExpires = signInExp ?? Date.now() + 15 * 60 * 1000;
      }
      
      // Handle session update trigger (from update() call)
      if (trigger === "update" && token) {
        // Persist updated session fields into the JWT token
        if (session?.user) {
          if (typeof session.user.emailVerified !== "undefined") {
            token.emailVerified = session.user.emailVerified as boolean;
          }
          if (typeof session.user.onboardingCompleted !== "undefined") {
            token.onboardingCompleted = session.user.onboardingCompleted as boolean;
          }
          if (typeof session.user.signupCompleted !== "undefined") {
            token.signupCompleted = session.user.signupCompleted as boolean;
          }
        }
        // Access token was updated via update() call
        // The new token should already be in the token object
        if (token.accessToken) {
          const updateExp = decodeAccessTokenExpMs(token.accessToken as string);
          token.accessTokenExpires = updateExp ?? Date.now() + 15 * 60 * 1000;
        }
      }

      // Token refresh logic (keep it simple and delegated to NestJS)
      if (!token.accessToken) {
        return token;
      }

      // Keep NextAuth's expiry in sync with the real access JWT (BFF may use a non-default TTL).
      const jwtExpMs = decodeAccessTokenExpMs(token.accessToken as string | undefined);
      if (jwtExpMs) {
        token.accessTokenExpires = jwtExpMs;
      }

      const accessTokenExpires = token.accessTokenExpires as number | undefined;
      const now = Date.now();
      // Refresh when within 5 minutes of access expiry.
      const isExpiringSoon = accessTokenExpires
        ? now >= accessTokenExpires - 5 * 60 * 1000
        : false;

      if (!isExpiringSoon) {
        return token;
      }

      if (!token.refreshToken) {
        return token;
      }

      // Deduplicate concurrent refresh per user (or refresh string). A single global promise
      // incorrectly shared refresh results across different sessions.
      const dedupeKey = refreshDedupeKey(token);
      const refreshMap = getRefreshPromiseMap();
      const refreshTokenForRequest = token.refreshToken as string;

      let refreshPromise = refreshMap.get(dedupeKey);
      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            const response = await fetch(`${authRefreshApiOrigin()}/api/auth/refresh`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken: refreshTokenForRequest }),
            });

            if (response.ok) {
              return await response.json();
            }
            if (response.status === 401 || response.status === 403) {
              return null; // Signal session invalidation
            }
            return undefined; // Network/server error — keep existing token
          } catch {
            return undefined;
          } finally {
            refreshMap.delete(dedupeKey);
          }
        })();
        refreshMap.set(dedupeKey, refreshPromise);
      }

      const result = await refreshPromise;
      if (result === null) {
        // Invalidate entire session so user is treated as signed out
        token.accessToken = undefined;
        token.refreshToken = undefined;
        token.accessTokenExpires = undefined;
        token.id = undefined;
        token.role = undefined;
        token.email = undefined;
        token.name = undefined;
        token.image = undefined;
        token.accountType = undefined;
        token.status = undefined;
        token.emailVerified = undefined;
        token.onboardingCompleted = undefined;
        token.signupCompleted = undefined;
      } else if (result?.accessToken) {
        token.accessToken = result.accessToken;
        token.accessTokenExpires =
          decodeAccessTokenExpMs(result.accessToken) ?? Date.now() + 15 * 60 * 1000;
        // Store rotated refresh token (the backend now returns a new one on each refresh)
        if (result.refreshToken) {
          token.refreshToken = result.refreshToken;
        }
      }

      return token;
    },
    session({ session, token, trigger }) {
      const userId = (token?.id ?? token?.sub) as string | undefined;
      // No valid token or user identity → treat as unauthenticated (e.g. after refresh failed)
      if (!token?.accessToken || !userId) {
        return {
          ...session,
          user: undefined,
          accessToken: undefined,
          refreshToken: undefined,
        } as unknown as typeof session;
      }
      if (session.user && token) {
        session.user.id = userId;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string | null;
        session.user.accountType = token.accountType as string;
        session.user.status = token.status as string;
        session.user.emailVerified = Boolean(token.emailVerified) as unknown as typeof session.user.emailVerified;
        session.user.onboardingCompleted = token.onboardingCompleted as boolean;
        session.user.signupCompleted = token.signupCompleted as boolean | undefined;
        // Store access token and refresh token in session for API client
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
      }
      
      // Handle session update trigger (from update() call)
      if (trigger === "update" && token) {
        // Token was updated via update() call, ensure it's reflected in session
        if (token.accessToken) {
          session.accessToken = token.accessToken as string;
        }
        // Also update user fields if they were updated in token
        if (session.user) {
          if (typeof token.emailVerified !== "undefined") {
            session.user.emailVerified = Boolean(token.emailVerified) as unknown as typeof session.user.emailVerified;
          }
          if (typeof token.onboardingCompleted !== "undefined") {
            session.user.onboardingCompleted = token.onboardingCompleted as boolean;
          }
          if (typeof token.signupCompleted !== "undefined") {
            session.user.signupCompleted = token.signupCompleted as boolean;
          }
        }
      }

      return session;
    },
  },
};

