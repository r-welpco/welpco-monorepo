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
type AccessTokenPayload = {
  exp?: number;
  accountType?: string;
};

function decodeAccessTokenPayload(
  accessToken: string | undefined,
): AccessTokenPayload | undefined {
  if (!accessToken || typeof accessToken !== "string") return undefined;
  const parts = accessToken.split(".");
  if (parts.length < 2) return undefined;
  try {
    const segment = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = segment.length % 4;
    const padded = segment + (pad ? "=".repeat(4 - pad) : "");
    if (typeof atob !== "function") return undefined;
    const json = atob(padded);
    return JSON.parse(json) as AccessTokenPayload;
  } catch {
    return undefined;
  }
}

function decodeAccessTokenExpMs(accessToken: string | undefined): number | undefined {
  const exp = decodeAccessTokenPayload(accessToken)?.exp;
  return typeof exp === "number" ? exp * 1000 : undefined;
}

/** Sync NextAuth JWT role from the BFF access token (DB-backed accountType). */
function applyRoleFromAccessToken(
  token: JWT,
  accessToken: string | undefined,
): void {
  const accountType = decodeAccessTokenPayload(accessToken)?.accountType;
  if (!accountType || typeof accountType !== "string") return;
  const normalized = accountType.toLowerCase();
  token.role = normalized === "welper" ? "welper" : "customer";
  token.accountType = accountType;
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
        if ("platformAccessEnabled" in user) {
          token.platformAccessEnabled = user.platformAccessEnabled as boolean;
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
        const sessionData = session as {
          accessToken?: string;
          refreshToken?: string;
          user?: typeof session.user;
        } | null;
        if (typeof sessionData?.accessToken === "string") {
          token.accessToken = sessionData.accessToken;
          applyRoleFromAccessToken(token, sessionData.accessToken);
          token.accessTokenExpires =
            decodeAccessTokenExpMs(sessionData.accessToken) ??
            Date.now() + 15 * 60 * 1000;
        }
        if (typeof sessionData?.refreshToken === "string") {
          token.refreshToken = sessionData.refreshToken;
        }
        // Persist updated session fields into the JWT token
        if (session?.user) {
          if (typeof session.user.role === "string") {
            token.role = session.user.role;
            token.accountType =
              session.user.role === "welper" ? "Welper" : "Customer";
          }
          if (typeof session.user.emailVerified !== "undefined") {
            token.emailVerified = session.user.emailVerified as boolean;
          }
          if (typeof session.user.onboardingCompleted !== "undefined") {
            token.onboardingCompleted = session.user.onboardingCompleted as boolean;
          }
          if (typeof session.user.signupCompleted !== "undefined") {
            token.signupCompleted = session.user.signupCompleted as boolean;
          }
          if (typeof session.user.platformAccessEnabled !== "undefined") {
            token.platformAccessEnabled =
              session.user.platformAccessEnabled as boolean;
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
      if (!token.accessToken && !token.refreshToken) {
        return token;
      }

      const mustRefreshMissingAccess =
        !token.accessToken && Boolean(token.refreshToken);

      // Keep NextAuth's expiry in sync with the real access JWT (BFF may use a non-default TTL).
      if (token.accessToken) {
        const jwtExpMs = decodeAccessTokenExpMs(token.accessToken as string | undefined);
        if (jwtExpMs) {
          token.accessTokenExpires = jwtExpMs;
        }
      }

      const accessTokenExpires = token.accessTokenExpires as number | undefined;
      const now = Date.now();
      // Refresh when within 5 minutes of access expiry, or when access was cleared but refresh remains.
      const isExpiringSoon =
        mustRefreshMissingAccess ||
        (accessTokenExpires
          ? now >= accessTokenExpires - 5 * 60 * 1000
          : false);

      // Do not clobber role/signup fields set via `updateSession` on the same request.
      if (trigger !== "update") {
        applyRoleFromAccessToken(token, token.accessToken as string | undefined);
      }

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
        token.platformAccessEnabled = undefined;
      } else if (result?.accessToken) {
        token.accessToken = result.accessToken;
        token.accessTokenExpires =
          decodeAccessTokenExpMs(result.accessToken) ?? Date.now() + 15 * 60 * 1000;
        applyRoleFromAccessToken(token, result.accessToken);
        // Store rotated refresh token (the backend now returns a new one on each refresh)
        if (result.refreshToken) {
          token.refreshToken = result.refreshToken;
        }
      }

      return token;
    },
    session({ session, token, trigger }) {
      const userId = (token?.id ?? token?.sub) as string | undefined;
      // No valid token or user identity → unauthenticated (e.g. after refresh failed).
      // Returning a truthy session without accessToken left useSession() as "authenticated".
      if (!token?.accessToken || !userId) {
        return null as unknown as typeof session;
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
        session.user.platformAccessEnabled = token.platformAccessEnabled as
          | boolean
          | undefined;
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
          if (typeof token.role === "string") {
            session.user.role = token.role;
          }
          if (typeof token.accountType === "string") {
            session.user.accountType = token.accountType;
          }
          if (typeof token.emailVerified !== "undefined") {
            session.user.emailVerified = Boolean(token.emailVerified) as unknown as typeof session.user.emailVerified;
          }
          if (typeof token.onboardingCompleted !== "undefined") {
            session.user.onboardingCompleted = token.onboardingCompleted as boolean;
          }
          if (typeof token.signupCompleted !== "undefined") {
            session.user.signupCompleted = token.signupCompleted as boolean;
          }
          if (typeof token.platformAccessEnabled !== "undefined") {
            session.user.platformAccessEnabled = token.platformAccessEnabled as boolean;
          }
        }
      }

      return session;
    },
  },
};

