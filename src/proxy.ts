import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/login";
  const isPublicAsset = req.nextUrl.pathname.startsWith("/_next");

  if (isPublicAsset) return NextResponse.next();

  const isApiRoute = req.nextUrl.pathname.startsWith("/api");

  if (!isLoggedIn && isApiRoute) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isLoggedIn && !isLoginPage) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
