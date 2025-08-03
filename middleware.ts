import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /protected)
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath = path === "/login" || path === "/setup";

  // Get the token from the cookie
  const token = request.cookies.get("jellyfin-auth")?.value || "";

  // Check if user is authenticated
  let isAuthenticated = false;
  if (token) {
    try {
      const authData = JSON.parse(token);
      isAuthenticated = !!(authData.user && authData.serverUrl);
    } catch {
      // Invalid token format
      isAuthenticated = false;
    }
  }

  // Redirect logic
  if (isPublicPath && isAuthenticated && path === "/login") {
    // If user is authenticated and trying to access login, redirect to main page
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  if (!isPublicPath && !isAuthenticated) {
    // If user is not authenticated and trying to access protected route, redirect to login
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
