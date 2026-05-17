import "next-auth";
import "next-auth/jwt";
import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string;
    refreshToken?: string;
    user: {
      id: string;
      role: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      accountType?: string;
      status?: string;
      emailVerified?: boolean;
      onboardingCompleted?: boolean;
      /**
       * Day 15 — Phase 2 Dispatch A. Tracks whether the unified signup wizard
       * has been finished. Phase 3's `proxy.ts` middleware reads this to gate
       * dashboard access; Phase 1 BFF already maintains the column.
       */
      signupCompleted?: boolean;
      /** False after signup finish while launch access is gated. */
      platformAccessEnabled?: boolean;
    } & Omit<
      DefaultSession["user"],
      "emailVerified" | "email" | "name" | "image"
    >;
  }

  interface User extends Omit<DefaultUser, "emailVerified"> {
    role: string;
    accessToken?: string;
    refreshToken?: string;
    accountType?: string;
    status?: string;
    emailVerified?: boolean;
    onboardingCompleted?: boolean;
    /** See Session.user.signupCompleted. */
    signupCompleted?: boolean;
    platformAccessEnabled?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
    image?: string | null;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    accountType?: string;
    status?: string;
    emailVerified?: boolean;
    onboardingCompleted?: boolean;
    /** See Session.user.signupCompleted. */
    signupCompleted?: boolean;
    platformAccessEnabled?: boolean;
  }
}

