import NextAuth, { type NextAuthResult } from "next-auth";
import { authConfig } from "@/lib/auth/config";
import { authProviders } from "@/lib/auth/providers";

if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET must be set in production");
}

const result: NextAuthResult = NextAuth({
  ...authConfig,
  providers: authProviders,
  session: {
    strategy: "jwt",
    // Match the backend refresh token lifetime (7 days).
    // This keeps the NextAuth session cookie alive as long as refresh tokens
    // are valid, preventing premature cookie expiry that logs users out.
    maxAge: 7 * 24 * 60 * 60, // 7 days (seconds)
  },
  // Default allows CI / local builds without a .env; set NEXTAUTH_SECRET in real deployments.
  secret:
    process.env.NEXTAUTH_SECRET ||
    "dev-secret-DO-NOT-USE-IN-PRODUCTION",
});

export const auth: NextAuthResult["auth"] = result.auth;
export const signIn: NextAuthResult["signIn"] = result.signIn;
export const signOut: NextAuthResult["signOut"] = result.signOut;
export const handlers: NextAuthResult["handlers"] = result.handlers;
