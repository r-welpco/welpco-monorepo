import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@/lib/validations/auth";
import { apiClient } from "@/lib/api/client";

export const authProviders: NextAuthConfig["providers"] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const validatedFields = loginSchema.safeParse(credentials);
      if (!validatedFields.success) {
        return null;
      }

      const { email, password } = validatedFields.data;

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
          };
          profile?: { onboardingCompleted: boolean };
        }>(
          "/api/auth/login",
          { email, password },
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
