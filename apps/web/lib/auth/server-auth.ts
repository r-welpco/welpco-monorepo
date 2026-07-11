/**
 * Server-side authentication utilities
 * Use these in Server Components to check authentication status
 */

import { cache } from "react";
import { cookies, headers } from "next/headers";
import { auth } from "@/auth";
import { readGeoFromHeaders } from "@/i18n/geo";
import { localizedPath } from "@/i18n/locale-routes";
import type { Locale } from "@/i18n/routing";
import { resolveRequestLocale } from "@/i18n/resolve-locale";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

const LOCALE_COOKIE = "NEXT_LOCALE";

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

async function resolveRedirectLocale(): Promise<Locale> {
  try {
    return (await getLocale()) as Locale;
  } catch {
    const cookieStore = await cookies();
    const { country, region } = readGeoFromHeaders(await headers());
    return resolveRequestLocale({
      cookieValue: cookieStore.get(LOCALE_COOKIE)?.value,
      country,
      region,
    });
  }
}

async function localizedRedirect(path: string): Promise<never> {
  const locale = await resolveRedirectLocale();
  redirect(localizedPath(path, locale));
}

/**
 * Require authentication - redirects to login if not authenticated
 * Use this in Server Components that require authentication
 */
export async function requireAuth(): Promise<NonNullable<AuthCheckResult["user"]>> {
  const session = await getServerSession();

  if (!session.isAuthenticated || !session.user) {
    await localizedRedirect("/login");
  }

  return session.user!;
}

/**
 * Require email verification - redirects to verification page if not verified
 * Use this after requireAuth() to ensure email is verified
 */
export async function requireEmailVerification(): Promise<NonNullable<AuthCheckResult["user"]>> {
  const user = await requireAuth();

  if (!user.emailVerified) {
    const locale = await resolveRedirectLocale();
    redirect(
      `${localizedPath("/verification", locale)}?email=${encodeURIComponent(user.email)}`,
    );
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
export async function requireOnboardingComplete(): Promise<NonNullable<AuthCheckResult["user"]>> {
  const user = await requireAuth();

  if (user.signupCompleted === false) {
    await localizedRedirect("/register");
  }

  return user;
}

/** Preferred name for the same gate. */
export const requireSignupComplete = requireOnboardingComplete;

/**
 * Require signup completion and a specific dashboard role.
 */
export async function requireRole(
  role: "customer" | "welper",
): Promise<NonNullable<AuthCheckResult["user"]>> {
  const user = await requireOnboardingComplete();
  if (user.role !== role) {
    await localizedRedirect("/dashboard");
  }
  return user;
}
