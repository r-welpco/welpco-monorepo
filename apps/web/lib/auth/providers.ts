import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { SignupStateDto } from "@welpco/types";
import { loginSchema } from "@/lib/validations/auth";
import { apiClient } from "@/lib/api/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const authProviders: NextAuthConfig["providers"] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      preferredLocale: { label: "Locale", type: "text" },
      /** Set after POST /auth/signup/begin — avoids a redundant POST /auth/login. */
      signupBootstrap: { label: "Signup bootstrap", type: "text" },
      accessToken: { label: "Access token", type: "text" },
      refreshToken: { label: "Refresh token", type: "text" },
    },
    async authorize(credentials) {
      const bootstrapAccessToken = credentials?.accessToken;
      const bootstrapRefreshToken = credentials?.refreshToken;
      if (
        credentials?.signupBootstrap === "true" &&
        typeof bootstrapAccessToken === "string" &&
        typeof bootstrapRefreshToken === "string"
      ) {
        try {
          const stateRes = await fetch(`${API_URL}/api/auth/signup/state`, {
            headers: {
              Authorization: `Bearer ${bootstrapAccessToken}`,
              "Content-Type": "application/json",
            },
          });
          if (!stateRes.ok) {
            return null;
          }
          const state = (await stateRes.json()) as SignupStateDto;
          const role = state.selectedRole === "welper" ? "welper" : "customer";
          return {
            id: state.userId,
            email: state.email,
            name: state.email.split("@")[0],
            role,
            image: null,
            accessToken: bootstrapAccessToken,
            refreshToken: bootstrapRefreshToken,
            accountType: role === "welper" ? "Welper" : "Customer",
            status: "PENDING",
            emailVerified: state.emailVerified,
            onboardingCompleted: false,
            signupCompleted: state.signupCompleted,
            platformAccessEnabled: state.platformAccessEnabled,
          };
        } catch {
          return null;
        }
      }

      const validatedFields = loginSchema.safeParse(credentials);
      if (!validatedFields.success) {
        return null;
      }

      const { email, password } = validatedFields.data;
      const preferredLocale =
        credentials?.preferredLocale === "fr" || credentials?.preferredLocale === "en"
          ? credentials.preferredLocale
          : undefined;

      try {
        const response = await apiClient.post<{
          accessToken: string;
          refreshToken: string;
          user: {
            id: string;
            email: string;
            accountType: string;
            status: string;
            emailVerified: boolean;
            signupCompleted?: boolean;
            onboardingCompleted?: boolean;
            platformAccessEnabled?: boolean;
          };
          profile?: { onboardingCompleted: boolean };
        }>(
          "/api/auth/login",
          { email, password, ...(preferredLocale ? { preferredLocale } : {}) },
          { skipAuth: true },
        );

        if (!response?.accessToken || !response.user) {
          return null;
        }

        if (response.user.accountType?.toLowerCase() === "admin") {
          return null;
        }

        const role =
          response.user.accountType.toLowerCase() === "welper"
            ? "welper"
            : "customer";
        const onboardingCompleted =
          response.profile?.onboardingCompleted ??
          response.user.onboardingCompleted ??
          false;
        // Day 15 — Phase 2 Dispatch A. The BFF login response will include
        // `signupCompleted` once Phase 3 lands. Until then we accept the
        // optional field so the JWT carries it through if/when present, and
        // fall back to the legacy `onboardingCompleted` so existing accounts
        // are treated as signup-complete (no regression for current users).
        const signupCompleted =
          response.user.signupCompleted ?? onboardingCompleted;
        const platformAccessEnabled = response.user.platformAccessEnabled;

        return {
          id: response.user.id,
          email: response.user.email,
          name: response.user.email.split("@")[0],
          role,
          image: null,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          accountType: response.user.accountType,
          status: response.user.status,
          emailVerified: response.user.emailVerified,
          onboardingCompleted,
          signupCompleted,
          platformAccessEnabled,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        const isNetworkError =
          errorMessage.includes("fetch") || errorMessage.includes("network");

        if (isNetworkError) {
          console.error(
            "Backend authentication error: Network error — backend may be unavailable",
          );
        } else if (process.env.NODE_ENV === "development") {
          console.error("Backend authentication error:", error);
        } else {
          console.error("Backend authentication error: Authentication failed");
        }

        return null;
      }
    },
  }),
];
