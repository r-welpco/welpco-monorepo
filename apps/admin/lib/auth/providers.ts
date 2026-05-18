import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const authProviders: NextAuthConfig["providers"] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = credentials?.email as string | undefined;
      const password = credentials?.password as string | undefined;
      if (!email?.trim() || !password) {
        return null;
      }

      try {
        const response = await fetch(`${NEXT_PUBLIC_API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        });

        if (!response.ok) {
          return null;
        }

        const data = (await response.json()) as {
          accessToken: string;
          refreshToken: string;
          user: {
            id: string;
            email: string;
            accountType: string;
            status: string;
            emailVerified: boolean;
            onboardingCompleted?: boolean;
          };
        };

        if (!data?.accessToken || !data?.user) {
          return null;
        }

        if (data.user.accountType?.toLowerCase() !== "admin") {
          return null;
        }

        if (data.user.status !== "Active") {
          return null;
        }

        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.email.split("@")[0],
          role: "admin",
          image: null,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          accountType: data.user.accountType,
          status: data.user.status,
          emailVerified: data.user.emailVerified,
          onboardingCompleted: data.user.onboardingCompleted ?? false,
        };
      } catch {
        return null;
      }
    },
  }),
];
