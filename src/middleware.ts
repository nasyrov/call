import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const authRoutes = [
  "/login",
  "/register",
  "/password/forgot",
  "/password/reset",
];

export function middleware(request: NextRequest) {
  const session = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect authenticated users away from auth pages
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect unauthenticated users from protected routes
  if (!session && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
