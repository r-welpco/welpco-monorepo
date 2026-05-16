import { auth } from "@/auth";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getLocaleFromGeo, readGeoFromHeaders } from "@/i18n/geo";
import {
  hasFrenchPrefix,
  isMarketingRoute,
  stripLocale,
} from "@/i18n/marketing-routes";
import { routing } from "@/i18n/routing";
import { safeNextPath, withNext } from "@/lib/auth/safe-next";

const intlMiddleware = createIntlMiddleware(routing);

type AuthUser = {
  email?: string;
  emailVerified?: boolean;
  signupCompleted?: boolean;
  onboardingCompleted?: boolean;
};

function applyGeoRedirect(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (!isMarketingRoute(pathname) || hasFrenchPrefix(pathname)) {
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

  if (isMarketingRoute(pathname)) {
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
        new URL(withNext("/login", target), nextUrl),
      );
    }
    return intlResponse ?? NextResponse.next();
  }

  const signupCompleted = user?.signupCompleted === true;
  const emailVerified = user?.emailVerified === true;

  if (!signupCompleted) {
    if (isOnRegister) {
      return intlResponse ?? NextResponse.next();
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
