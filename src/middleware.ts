/**
 * VIRGIL — Edge middleware.
 *
 * Runs before every request. Three jobs:
 *   1. Honeypot trap — common scanner paths are 404'd and recorded.
 *   2. Security headers — strict CSP, HSTS, no framing.
 *   3. API origin check — POST to /api/* must come from this origin.
 *
 * NOTE: middleware runs on the Edge runtime. We do NOT touch Prisma here.
 * Honeypot hits are surfaced via response header so a server-side route
 * can persist them when Rosser is logged in.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const HONEYPOT_PATHS = [
  "/admin",
  "/wp-admin",
  "/wp-login.php",
  "/.env",
  "/.env.local",
  "/.git",
  "/.git/config",
  "/phpmyadmin",
  "/server-status",
  "/.aws/credentials",
  "/config.json",
  "/backup.sql",
];

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-DNS-Prefetch-Control": "off",
};

const CSP =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline'; " +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: blob:; " +
  "font-src 'self' data:; " +
  "connect-src 'self'; " +
  "frame-ancestors 'none'; " +
  "base-uri 'self'; " +
  "form-action 'self'";

export function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

  // 1. Honeypot.
  if (HONEYPOT_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    const res = new NextResponse("Not found", { status: 404 });
    res.headers.set("x-virgil-honeypot", pathname);
    return res;
  }

  // 2. API origin guard (mutating verbs only).
  if (pathname.startsWith("/api/")) {
    const method = req.method.toUpperCase();
    if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
      const reqOrigin = req.headers.get("origin");
      if (reqOrigin && reqOrigin !== origin) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }
  }

  // 3. Security headers on every response.
  const res = NextResponse.next();
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
  res.headers.set("Content-Security-Policy", CSP);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
