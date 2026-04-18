import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Executive role: read-only, block data entry
    if (token?.role === "EXECUTIVE") {
      const blocked = ["/generation", "/maintenance", "/import"];
      if (blocked.some((b) => path.startsWith(b))) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login|register|$).*)",
  ],
};
