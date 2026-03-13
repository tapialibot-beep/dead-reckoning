import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "dr_access";
const ACCESS_PATH = "/access";
const API_ACCESS_PATH = "/api/access";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow the access page and its API route
  if (pathname === ACCESS_PATH || pathname.startsWith(API_ACCESS_PATH)) {
    return NextResponse.next();
  }

  // Check for valid access cookie
  const cookie = request.cookies.get(COOKIE_NAME);
  if (cookie?.value === "granted") {
    return NextResponse.next();
  }

  // No valid cookie — redirect to /access, preserving intended destination
  const url = request.nextUrl.clone();
  url.pathname = ACCESS_PATH;
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
