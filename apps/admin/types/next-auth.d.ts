import "next-auth";
import "next-auth/jwt";
import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string;
    user: {
      id: string;
      role: string;
      email: string;
      name?: string | null;
      image?: string | null;
      accountType?: string;
      status?: string;
      emailVerified?: boolean;
      onboardingCompleted?: boolean;
    } & Omit<DefaultSession["user"], "emailVerified" | "id" | "name" | "image">;
  }

  interface User extends Omit<DefaultUser, "emailVerified"> {
    role: string;
    accessToken?: string;
    refreshToken?: string;
    accountType?: string;
    status?: string;
    emailVerified?: boolean;
    onboardingCompleted?: boolean;
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
  }
}
