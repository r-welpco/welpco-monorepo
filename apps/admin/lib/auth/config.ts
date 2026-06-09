import type { NextAuthConfig } from "next-auth";

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type AdminRefreshResult =
  | { accessToken?: string; refreshToken?: string }
  | null
  | undefined;

function adminRefreshMap(): Map<string, Promise<AdminRefreshResult>> {
  const globals = globalThis as typeof globalThis & {
    __adminRefreshByUser?: Map<string, Promise<AdminRefreshResult>>;
  };
  if (!globals.__adminRefreshByUser) {
    globals.__adminRefreshByUser = new Map();
  }
  return globals.__adminRefreshByUser;
}

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  trustHost: true,
  providers: [],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (!token) {
        return {} as import("next-auth/jwt").JWT;
      }

      if (!user && !token.accessToken && !token.refreshToken) {
        return token;
      }

      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email ?? undefined;
        token.name = user.name ?? undefined;
        token.image = user.image;
        if ("accountType" in user) token.accountType = user.accountType as string;
        if ("status" in user) token.status = user.status as string;
        if ("emailVerified" in user) token.emailVerified = user.emailVerified as boolean;
        if ("onboardingCompleted" in user) {
          token.onboardingCompleted = user.onboardingCompleted as boolean;
        }
        if ("accessToken" in user) token.accessToken = user.accessToken as string;
        if ("refreshToken" in user) token.refreshToken = user.refreshToken as string;
        token.accessTokenExpires = Date.now() + 15 * 60 * 1000;
      }

      if (trigger === "update" && token && session?.user) {
        if (typeof session.user.emailVerified !== "undefined") {
          token.emailVerified = session.user.emailVerified as boolean;
        }
        if (token.accessToken) {
          token.accessTokenExpires = Date.now() + 15 * 60 * 1000;
        }
      }

      if (!token.accessToken) {
        return token;
      }

      const accessTokenExpires = token.accessTokenExpires as number | undefined;
      const now = Date.now();
      const isExpiringSoon = accessTokenExpires
        ? now >= accessTokenExpires - 5 * 60 * 1000
        : false;

      if (!isExpiringSoon) {
        return token;
      }

      if (!token.refreshToken) {
        return token;
      }

      const refreshTokenForRequest = token.refreshToken as string;
      const refreshKey =
        typeof token.id === "string" && token.id.length > 0
          ? token.id
          : `rt:${refreshTokenForRequest.slice(0, 48)}`;
      const refreshes = adminRefreshMap();
      let refreshPromise = refreshes.get(refreshKey);
      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            const response = await fetch(`${NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken: refreshTokenForRequest }),
            });
            if (response.ok) {
              return await response.json();
            }
            if (response.status === 401 || response.status === 403) {
              return null;
            }
            return undefined;
          } catch {
            return undefined;
          } finally {
            refreshes.delete(refreshKey);
          }
        })();
        refreshes.set(refreshKey, refreshPromise);
      }

      const result = await refreshPromise;
      if (result === null) {
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
      } else if (result?.accessToken) {
        token.accessToken = result.accessToken;
        token.accessTokenExpires = Date.now() + 15 * 60 * 1000;
        // Keep the newest refresh token in the encrypted NextAuth JWT.
        if (result.refreshToken) {
          token.refreshToken = result.refreshToken;
        }
      }

      return token;
    },
    session({ session, token, trigger }) {
      if (!token?.accessToken || !token?.id) {
        return {
          ...session,
          user: undefined,
          accessToken: undefined,
        } as unknown as typeof session;
      }
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string | null;
        session.user.accountType = token.accountType as string;
        session.user.status = token.status as string;
        session.user.emailVerified = Boolean(token.emailVerified) as unknown as typeof session.user.emailVerified;
        session.user.onboardingCompleted = token.onboardingCompleted as boolean;
        session.accessToken = token.accessToken as string;
      }
      if (trigger === "update" && token && session.user && token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
};
