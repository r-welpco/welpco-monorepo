import { auth } from "@/auth";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getLocaleFromGeo, readGeoFromHeaders } from "@/i18n/geo";
import {
  hasFrenchPrefix,
  isLocaleAwareRoute,
  isMarketingRoute,
  localizedPathFromRequest,
  stripLocale,
} from "@/i18n/locale-routes";
import { resolveRequestLocale } from "@/i18n/resolve-locale";
import { routing } from "@/i18n/routing";
import { hasPlatformAccess } from "@/lib/auth/platform-access";
import { safeNextPath, withNext } from "@/lib/auth/safe-next";

const intlMiddleware = createIntlMiddleware(routing);

function localeFromRequest(request: NextRequest) {
  const { country, region } = readGeoFromHeaders(request.headers);
  return resolveRequestLocale({
    cookieValue: request.cookies.get("NEXT_LOCALE")?.value,
    country,
    region,
  });
}

/** Unprefixed legal URLs when locale resolves to French → `/fr/legal/...`. */
function applyFrenchLegalRedirect(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (hasFrenchPrefix(pathname)) return null;
  if (!pathname.startsWith("/legal")) return null;
  if (localeFromRequest(request) !== "fr") return null;

  const url = request.nextUrl.clone();
  url.pathname = `/fr${pathname}`;
  return NextResponse.redirect(url);
}

/** NextAuth `pages.signIn` is `/login` (default locale). Honor French locale for Quebec / cookie. */
function applyFrenchLoginRedirect(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (pathname !== "/login") return null;
  if (hasFrenchPrefix(pathname)) return null;
  if (localeFromRequest(request) !== "fr") return null;

  const url = request.nextUrl.clone();
  url.pathname = "/fr/login";
  return NextResponse.redirect(url);
}

/** Geo default: redirect unprefixed marketing/auth routes to `/fr/...` when locale resolves to French. */
function applyGeoRedirect(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (!isLocaleAwareRoute(pathname) || hasFrenchPrefix(pathname)) {
    return null;
  }

  // Cookie is set only when the user explicitly switches language — not on geo default.
  if (request.cookies.get("NEXT_LOCALE")?.value) {
    return null;
  }

  const { country, region } = readGeoFromHeaders(request.headers);
  const locale = getLocaleFromGeo(country, region);
  if (locale !== "fr") return null;

  const url = request.nextUrl.clone();
  url.pathname = `/fr${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

type AuthUser = {
  email?: string;
  emailVerified?: boolean;
  signupCompleted?: boolean;
  onboardingCompleted?: boolean;
  platformAccessEnabled?: boolean;
};

/** Legacy next-intl links used `/fr/dashboard/*`; redirect to unprefixed app shell. */
function redirectPrefixedDashboard(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (pathname === "/fr/dashboard" || pathname.startsWith("/fr/dashboard/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3);
    return NextResponse.redirect(url);
  }
  return null;
}

export default auth((req) => {
  const prefixedDashboard = redirectPrefixedDashboard(req);
  if (prefixedDashboard) return prefixedDashboard;

  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  let intlResponse: NextResponse | null = null;

    if (isLocaleAwareRoute(pathname)) {
      const frenchLegal = applyFrenchLegalRedirect(req);
      if (frenchLegal) return frenchLegal;

      const frenchLogin = applyFrenchLoginRedirect(req);
      if (frenchLogin) return frenchLogin;

      const geo = applyGeoRedirect(req);
      if (geo) return geo;

      intlResponse = intlMiddleware(req);
    if (intlResponse.status >= 300 && intlResponse.status < 400) {
      return intlResponse;
    }
  }

  const user = req.auth?.user as AuthUser | undefined;
  const isLoggedIn = !!user;
  const path = stripLocale(pathname);

  const isOnDashboard = path.startsWith("/dashboard");
  const isOnLogin = path.startsWith("/login");
  const isOnRegister = path.startsWith("/register");
  const isOnRegisterComplete = path === "/register/complete";
  const isOnOnboarding = path.startsWith("/onboarding-welcome");
  const isPublicRoute =
    isMarketingRoute(pathname) ||
    path.startsWith("/api/auth") ||
    path.startsWith("/_next") ||
    path.startsWith("/favicon.ico");

  const incomingNext = safeNextPath(nextUrl.searchParams.get("next"), "");

  if (process.env.NODE_ENV === "development" && process.env.PROXY_DEBUG === "1") {
    console.log("[Proxy] Request", {
      path,
      pathname,
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
    return intlResponse ?? NextResponse.next();
  }

  if (!isLoggedIn) {
    if (isOnDashboard) {
      const target = path + nextUrl.search;
      return NextResponse.redirect(
        new URL(
          withNext(localizedPathFromRequest("/login", pathname), target),
          nextUrl,
        ),
      );
    }
    return intlResponse ?? NextResponse.next();
  }

  const signupCompleted = user?.signupCompleted === true;
  const emailVerified = user?.emailVerified === true;
  const platformAccess = hasPlatformAccess({ signupCompleted });

  if (!signupCompleted) {
    if (isOnRegister || isOnLogin) {
      return intlResponse ?? NextResponse.next();
    }
    if (isOnOnboarding) {
      return NextResponse.redirect(
        new URL(
          withNext(
            localizedPathFromRequest("/register", pathname),
            incomingNext || null,
          ),
          nextUrl,
        ),
      );
    }
    if (isOnDashboard) {
      const target = path + nextUrl.search;
      return NextResponse.redirect(
        new URL(
          withNext(localizedPathFromRequest("/register", pathname), target),
          nextUrl,
        ),
      );
    }
    return intlResponse ?? NextResponse.next();
  }

  if (isOnRegisterComplete) {
    return NextResponse.redirect(
      new URL(localizedPathFromRequest("/dashboard", pathname), nextUrl),
    );
  }

  if (!platformAccess) {
    if (isOnLogin || isOnOnboarding) {
      return NextResponse.redirect(
        new URL(localizedPathFromRequest("/dashboard", pathname), nextUrl),
      );
    }
    return intlResponse ?? NextResponse.next();
  }

  if (isOnLogin || isOnRegister || isOnOnboarding) {
    return NextResponse.redirect(
      new URL(incomingNext || "/dashboard", nextUrl),
    );
  }

  void emailVerified;
  return intlResponse ?? NextResponse.next();
}) as (req: NextRequest) =>
  | ReturnType<typeof NextResponse.next>
  | Promise<ReturnType<typeof NextResponse.redirect>>;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|serwist).*)"],
};
