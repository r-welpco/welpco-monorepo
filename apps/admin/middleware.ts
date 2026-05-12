import { auth } from "@/auth";
import type { NextMiddleware } from "next/server";
import { NextResponse } from "next/server";

export default auth((req): NextResponse => {
  const path = req.nextUrl.pathname;
  const isAuthRoute = path.startsWith("/api/auth");
  const isLogin = path === "/login";
  const isStatic =
    path.startsWith("/_next") ||
    path === "/favicon.ico" ||
    /\.(ico|png|svg|webp|jpg|jpeg|gif)$/.test(path);

  if (isAuthRoute || isStatic) {
    return NextResponse.next();
  }

  const session = req.auth;

  if (!session?.user) {
    if (!isLogin) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  if (session.user.accountType?.toLowerCase() !== "admin") {
    return NextResponse.redirect(new URL("/login?error=Forbidden", req.url));
  }

  if (isLogin) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}) as unknown as NextMiddleware;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
