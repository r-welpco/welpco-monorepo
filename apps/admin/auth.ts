import NextAuth, { type NextAuthResult } from "next-auth";
import { authConfig } from "@/lib/auth/config";
import { authProviders } from "@/lib/auth/providers";

const DEV_SECRET = "dev-admin-secret-DO-NOT-USE-IN-PRODUCTION";
const BUILD_PLACEHOLDER = "production-build-placeholder-min-32-chars-set-NEXTAUTH_SECRET";
const INSECURE_PLACEHOLDERS = new Set([
  BUILD_PLACEHOLDER,
  "change-me-in-production",
  DEV_SECRET,
]);

function resolveAuthSecret(): string {
  const secret =
    process.env.NEXTAUTH_SECRET?.trim() || process.env.AUTH_SECRET?.trim();
  if (secret && !INSECURE_PLACEHOLDERS.has(secret)) {
    return secret;
  }
  // Next.js loads auth at build time; runtime on Vercel still receives real env vars.
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return secret || BUILD_PLACEHOLDER;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXTAUTH_SECRET must be set to a secure random value in production (see apps/admin/.env.example).",
    );
  }
  return secret || DEV_SECRET;
}

const result: NextAuthResult = NextAuth({
  ...authConfig,
  providers: authProviders,
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  secret: resolveAuthSecret(),
});

export const auth: NextAuthResult["auth"] = result.auth;
export const signIn: NextAuthResult["signIn"] = result.signIn;
export const signOut: NextAuthResult["signOut"] = result.signOut;
export const handlers: NextAuthResult["handlers"] = result.handlers;
