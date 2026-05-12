import NextAuth, { type NextAuthResult } from "next-auth";
import { authConfig } from "@/lib/auth/config";
import { authProviders } from "@/lib/auth/providers";

const result: NextAuthResult = NextAuth({
  ...authConfig,
  providers: authProviders,
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  secret:
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV === "development"
      ? "dev-admin-secret-DO-NOT-USE-IN-PRODUCTION"
      : "production-build-placeholder-min-32-chars-set-NEXTAUTH_SECRET"),
});

export const auth: NextAuthResult["auth"] = result.auth;
export const signIn: NextAuthResult["signIn"] = result.signIn;
export const signOut: NextAuthResult["signOut"] = result.signOut;
export const handlers: NextAuthResult["handlers"] = result.handlers;
