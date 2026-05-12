/**
 * Server-side authentication utilities
 * Use these in Server Components to check authentication status
 */

import { cache } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export interface AuthCheckResult {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    role: string;
    emailVerified: boolean;
    /** Day 15 — post signup-merge source of truth. */
    signupCompleted: boolean;
    /** Retained for legacy reads; mirrors `signupCompleted` until the BFF column drops. */
    onboardingCompleted: boolean;
    name?: string | null;
    image?: string | null;
  } | null;
}

/**
 * Cached session getter: deduplicates auth() within a single request
 * so layout + page both calling requireOnboardingComplete() only call auth() once.
 */
const getServerSessionCached = cache(async (): Promise<AuthCheckResult> => {
  const session = await auth();

  if (!session?.user) {
    return {
      isAuthenticated: false,
      user: null,
    };
  }

  const u = session.user as {
    id?: string;
    email?: string;
    role?: string;
    emailVerified?: boolean;
    signupCompleted?: boolean;
    onboardingCompleted?: boolean;
    name?: string | null;
    image?: string | null;
  };
  // Defensive: prefer `signupCompleted` (post-merge source of truth);
  // fall back to the legacy `onboardingCompleted` for sessions issued
  // before Phase 1 BFF rolled.
  const signupCompleted = u.signupCompleted ?? u.onboardingCompleted ?? false;
  return {
    isAuthenticated: true,
    user: {
      id: u.id ?? "",
      email: u.email ?? "",
      role: u.role ?? "",
      emailVerified: u.emailVerified ?? false,
      signupCompleted,
      onboardingCompleted: signupCompleted,
      name: u.name ?? null,
      image: u.image ?? null,
    },
  };
});

/**
 * Get the current session on the server
 * Returns null if not authenticated
 */
export async function getServerSession(): Promise<AuthCheckResult> {
  return getServerSessionCached();
}

/**
 * Require authentication - redirects to login if not authenticated
 * Use this in Server Components that require authentication
 */
export async function requireAuth(): Promise<AuthCheckResult["user"]> {
  const session = await getServerSession();

  if (!session.isAuthenticated || !session.user) {
    redirect("/login");
  }

  return session.user;
}

/**
 * Require email verification - redirects to verification page if not verified
 * Use this after requireAuth() to ensure email is verified
 */
export async function requireEmailVerification(): Promise<AuthCheckResult["user"]> {
  const user = await requireAuth();
  if (!user) redirect("/login");

  if (!user.emailVerified) {
    redirect(`/verification?email=${encodeURIComponent(user.email)}`);
  }

  return user;
}

/**
 * Require signup completion — redirects to the wizard at /register if not done.
 * Use this after requireAuth() (verification timing is decoupled post-merge,
 * so do NOT chain through `requireEmailVerification` for this gate).
 *
 * Day 15 Dispatch C: kept the historic export name (`requireOnboardingComplete`)
 * for back-compat with callers that already imported it. The redirect target
 * moved from `/onboarding-welcome` to the wizard at `/register`.
 */
export async function requireOnboardingComplete(): Promise<AuthCheckResult["user"]> {
  const user = await requireAuth();
  if (!user) redirect("/login");

  if (user.signupCompleted === false) {
    redirect("/register");
  }

  return user;
}

/** Preferred name for the same gate. */
export const requireSignupComplete = requireOnboardingComplete;
