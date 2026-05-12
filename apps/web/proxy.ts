import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { safeNextPath, withNext } from "@/lib/auth/safe-next";

/**
 * Day 15 — Phase 3 of the signup ↔ onboarding merge.
 *
 * Four-state machine driven by the JWT-included `signupCompleted` +
 * `emailVerified` flags Dispatch A added.
 *
 *   A. signed-out + /dashboard/*               → /login?next=<path>
 *   B. signed-in  + signupCompleted: false     → /register
 *      (the wizard reads server state and routes to the right step)
 *   C. signed-in  + signupCompleted: true
 *               + emailVerified: false
 *               + /dashboard/*                 → ALLOWED (banner + bookable
 *                                                action gating)
 *   D. signed-in  + both true + /login|/register → /dashboard or ?next=
 *
 * `/onboarding-welcome` (legacy interstitial) was deleted in Dispatch C; the
 * path-prefix check below is retained as a defensive redirect so any stale
 * bookmarks land on the wizard.
 */

type AuthUser = {
  email?: string;
  emailVerified?: boolean;
  signupCompleted?: boolean;
  /** Legacy alias retained for in-flight sessions until the JWT rolls over. */
  onboardingCompleted?: boolean;
};

export default auth((req) => {
  const { nextUrl } = req;
  const user = req.auth?.user as AuthUser | undefined;
  const isLoggedIn = !!user;

  const path = nextUrl.pathname;
  const isOnDashboard = path.startsWith("/dashboard");
  const isOnLogin = path.startsWith("/login");
  const isOnRegister = path.startsWith("/register");
  const isOnOnboarding = path.startsWith("/onboarding-welcome");
  const isPublicRoute =
    path === "/" ||
    path.startsWith("/api/auth") ||
    path.startsWith("/_next") ||
    path.startsWith("/favicon.ico");

  const incomingNext = safeNextPath(nextUrl.searchParams.get("next"), "");

  if (process.env.NODE_ENV === "development" && process.env.PROXY_DEBUG === "1") {
    console.log("[Proxy] Request", {
      path,
      search: nextUrl.search,
      isLoggedIn,
      flags: user
        ? {
            email: user.email,
            emailVerified: user.emailVerified,
            signupCompleted: user.signupCompleted,
          }
        : null,
    });
  }

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // ─── State A: signed-out hitting a guarded route ──────────────────────
  if (!isLoggedIn) {
    if (isOnDashboard) {
      const target = path + nextUrl.search;
      return NextResponse.redirect(
        new URL(withNext("/login", target), nextUrl),
      );
    }
    // Login / register / onboarding pages are reachable while signed-out.
    return NextResponse.next();
  }

  // From here on the user is signed-in.
  const signupCompleted = user?.signupCompleted === true;
  const emailVerified = user?.emailVerified === true;

  // ─── State B: signed-in but signup not finished ───────────────────────
  if (!signupCompleted) {
    if (isOnRegister) {
      // The wizard is allowed to render its own routes — don't loop-redirect.
      return NextResponse.next();
    }
    if (isOnLogin || isOnOnboarding) {
      return NextResponse.redirect(
        new URL(withNext("/register", incomingNext || null), nextUrl),
      );
    }
    if (isOnDashboard) {
      const target = path + nextUrl.search;
      return NextResponse.redirect(
        new URL(withNext("/register", target), nextUrl),
      );
    }
    // Other public paths (marketing, etc.) reachable.
    return NextResponse.next();
  }

  // ─── State D: signed-in + signup done, on auth pages ──────────────────
  if (isOnLogin || isOnRegister || isOnOnboarding) {
    return NextResponse.redirect(
      new URL(incomingNext || "/dashboard", nextUrl),
    );
  }

  // ─── State C: signed-in + signup done + on /dashboard/* ───────────────
  // Email-verified or not, the dashboard renders. The verification banner
  // surfaces the unverified state; the BFF's `EmailVerifiedGuard` blocks
  // bookable actions and the web layer translates the 403 into a focused
  // dialog.
  void emailVerified; // explicit no-op — kept for future state-D branches
  return NextResponse.next();
}) as (req: NextRequest) =>
  | ReturnType<typeof NextResponse.next>
  | Promise<ReturnType<typeof NextResponse.redirect>>;

export const config = {
  // Exclude legacy PWA paths (browser may still request these after Serwist was removed)
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|serwist).*)"],
};
