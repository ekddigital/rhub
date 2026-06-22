import { NextRequest, NextResponse } from "next/server";
import { isHotelCheckinAllowedRoute } from "@/lib/conf/conference-hotel-access";

/**
 * Proxy for route protection and auth redirects.
 *
 * Protected routes (require login):
 *   /tools/dbt/judge
 *   /tools/dbt/[slug] (for judge-specific actions)
 *
 * Auth routes:
 *   /login
 *   /register
 *   /forgot-password
 * NOTE: We intentionally do not redirect these routes at proxy level based on
 * cookie shape alone; login/register pages perform real session checks.
 */

// Routes that require authentication
const PROTECTED_PATTERNS = [
  /^\/tools\/dbt\/judge($|\/)/,
  /^\/dashboard($|\/)/,
  /^\/profile($|\/)/,
];

// Admin routes
const ADMIN_PATTERNS = [/^\/admin($|\/)/];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth token from cookies
  const token = request.cookies.get("auth_token")?.value;

  // Validate session using a lightweight cookie check.
  // Keep proxy execution fast and Edge-safe (no direct Prisma usage here).
  const isAuthenticated = !!token && token.length > 10;

  // Protect judge and user routes
  for (const pattern of PROTECTED_PATTERNS) {
    if (pattern.test(pathname)) {
      if (!isAuthenticated) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }
      break;
    }
  }

  // Protect admin routes (already has its own redirect but add proxy layer)
  for (const pattern of ADMIN_PATTERNS) {
    if (pattern.test(pathname)) {
      if (!isAuthenticated) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }
      break;
    }
  }

  // Hotel check-in staff: block conference routes outside the allowlist.
  if (pathname.startsWith("/tools/conf") && isAuthenticated) {
    if (!isHotelCheckinAllowedRoute(pathname)) {
      try {
        const accessUrl = new URL("/api/conf/default/access", request.url);
        const accessRes = await fetch(accessUrl, {
          headers: { cookie: request.headers.get("cookie") ?? "" },
          cache: "no-store",
        });

        if (accessRes.ok) {
          const payload = (await accessRes.json()) as {
            isHotelCheckinOnly?: boolean;
          };

          if (payload.isHotelCheckinOnly) {
            const redirectUrl = new URL("/tools/conf", request.url);
            redirectUrl.searchParams.set("forbidden", "1");
            return NextResponse.redirect(redirectUrl);
          }
        }
      } catch {
        // Fall through when access lookup fails.
      }
    }
  }

  // Set cache control headers for auth-sensitive pages
  const response = NextResponse.next();

  // Prevent caching of protected pages
  if (
    PROTECTED_PATTERNS.some((p) => p.test(pathname)) ||
    ADMIN_PATTERNS.some((p) => p.test(pathname))
  ) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate",
    );
    response.headers.set("Pragma", "no-cache");
  }

  // Add security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (images, etc.)
     * - api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf)).*)",
  ],
};
