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
  sub?: string;
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

/**
 * Sync NextAuth JWT role from the BFF access token (DB-backed accountType).
 * Dual-role accounts: a Welper acting in customer mode (`token.roleMode`)
 * gets `role = "customer"` so every session consumer — server guards,
 * useSession, the auth store — reflects the acting role. Downgrade-only:
 * roleMode is ignored (and cleared) for non-Welper accounts.
 */
function applyRoleFromAccessToken(
  token: JWT,
  accessToken: string | undefined,
): void {
  const accountType = decodeAccessTokenPayload(accessToken)?.accountType;
  if (!accountType || typeof accountType !== "string") return;
  const normalized = accountType.toLowerCase();
  if (normalized !== "welper" && token.roleMode) {
    delete token.roleMode;
  }
  token.role =
    normalized === "welper"
      ? token.roleMode === "customer"
        ? "customer"
        : "welper"
      : "customer";
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

type SignupSessionState = {
  emailVerified?: boolean;
  signupCompleted?: boolean;
};

async function validatedSignupSessionState(
  accessToken: string,
  expectedUserId: string,
): Promise<SignupSessionState | null> {
  const payload = decodeAccessTokenPayload(accessToken);
  if (payload?.sub !== expectedUserId) {
    return null;
  }
  try {
    const response = await fetch(
      `${authRefreshApiOrigin()}/api/auth/signup/state`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      },
    );
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as SignupSessionState;
  } catch {
    return null;
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
    async jwt({ token, user, trigger, session }) {
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
      
      // Dual-role accounts: mode switch via update({ roleMode }). "customer"
      // enters customer mode (honored for Welper accounts only — enforced in
      // applyRoleFromAccessToken below); null or "welper" exits it. Pure
      // session mutation — no BFF token reissue involved.
      if (trigger === "update" && token) {
        const modeUpdate = session as { roleMode?: unknown } | null;
        if (modeUpdate && "roleMode" in modeUpdate) {
          if (modeUpdate.roleMode === "customer") {
            token.roleMode = "customer";
          } else {
            delete token.roleMode;
          }
        }
      }

      // Handle session update trigger (from update() call)
      if (trigger === "update" && token) {
        const sessionData = session as {
          accessToken?: string;
          refreshToken?: string;
          user?: typeof session.user;
        } | null;
        const candidateAccessToken =
          typeof sessionData?.accessToken === "string"
            ? sessionData.accessToken
            : typeof token.accessToken === "string"
              ? token.accessToken
              : undefined;
        const expectedUserId = (token.id ?? token.sub) as string | undefined;
        if (candidateAccessToken && expectedUserId) {
          const signupState = await validatedSignupSessionState(
            candidateAccessToken,
            expectedUserId,
          );
          if (signupState) {
            token.accessToken = candidateAccessToken;
            applyRoleFromAccessToken(token, candidateAccessToken);
            token.accessTokenExpires =
              decodeAccessTokenExpMs(candidateAccessToken) ??
              Date.now() + 15 * 60 * 1000;
            if (typeof sessionData?.refreshToken === "string") {
              token.refreshToken = sessionData.refreshToken;
            }
            token.emailVerified = Boolean(signupState.emailVerified);
            token.signupCompleted = Boolean(signupState.signupCompleted);
            token.onboardingCompleted = Boolean(signupState.signupCompleted);
          }
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

      applyRoleFromAccessToken(token, token.accessToken as string | undefined);

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
        token.roleMode = undefined;
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
        // Access tokens are needed by the browser API client. Refresh tokens
        // remain only in the encrypted HttpOnly NextAuth JWT cookie.
        session.accessToken = token.accessToken as string;
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
        }
      }

      return session;
    },
  },
};
