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
import { routing } from "@/i18n/routing";
import { hasPlatformAccess } from "@/lib/auth/platform-access";
import { safeNextPath, withNext } from "@/lib/auth/safe-next";

const intlMiddleware = createIntlMiddleware(routing);

type AuthUser = {
  email?: string;
  emailVerified?: boolean;
  signupCompleted?: boolean;
  onboardingCompleted?: boolean;
  platformAccessEnabled?: boolean;
};

/** Unprefixed legal URLs when NEXT_LOCALE is French → `/fr/legal/...`. */
function applyFrenchLegalRedirect(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (hasFrenchPrefix(pathname)) return null;
  if (!pathname.startsWith("/legal")) return null;
  if (request.cookies.get("NEXT_LOCALE")?.value !== "fr") return null;

  const url = request.nextUrl.clone();
  url.pathname = `/fr${pathname}`;
  return NextResponse.redirect(url);
}

/** NextAuth `pages.signIn` is `/login` (default locale). Honor NEXT_LOCALE for French users. */
function applyFrenchLoginRedirect(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (pathname !== "/login") return null;
  if (hasFrenchPrefix(pathname)) return null;
  if (request.cookies.get("NEXT_LOCALE")?.value !== "fr") return null;

  const url = request.nextUrl.clone();
  url.pathname = "/fr/login";
  return NextResponse.redirect(url);
}

function applyGeoRedirect(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (!isMarketingRoute(pathname) || hasFrenchPrefix(pathname)) {
    return null;
  }

  // Honor explicit choice from the language switcher (NEXT_LOCALE cookie).
  if (request.cookies.get("NEXT_LOCALE")?.value) {
    return null;
  }

  const { country, region } = readGeoFromHeaders(request.headers);
  const locale = getLocaleFromGeo(country, region);
  if (locale !== "fr") return null;

  const url = request.nextUrl.clone();
  url.pathname = `/fr${pathname === "/" ? "" : pathname}`;
  const response = NextResponse.redirect(url);
  response.cookies.set("NEXT_LOCALE", locale);
  return response;
}

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  let intlResponse: NextResponse | null = null;

  if (isLocaleAwareRoute(pathname)) {
    const frenchLegal = applyFrenchLegalRedirect(req);
    if (frenchLegal) return frenchLegal;

    const frenchLogin = applyFrenchLoginRedirect(req);
    if (frenchLogin) return frenchLogin;

    if (isMarketingRoute(pathname)) {
      const geo = applyGeoRedirect(req);
      if (geo) return geo;
    }
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

  if (!platformAccess) {
    const completePath = localizedPathFromRequest("/register/complete", pathname);

    if (isOnDashboard) {
      return NextResponse.redirect(new URL(completePath, nextUrl));
    }
    if (isOnRegister && !isOnRegisterComplete) {
      return NextResponse.redirect(new URL(completePath, nextUrl));
    }
    if (isOnLogin || isOnOnboarding) {
      return NextResponse.redirect(new URL(completePath, nextUrl));
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
