/**
 * Proxy (в Next.js 16 «middleware» переименован в «proxy»).
 *
 * Делает две вещи:
 *  1. Ставит security-заголовки на все ответы (CSP, nosniff, referrer-policy…).
 *  2. Оптимистично защищает /admin (роли MODERATOR/ADMIN) и /settings
 *     (любая авторизация): без сессии — редирект на /signin.
 *
 * Полная проверка прав всё равно выполняется в каждом server action / route handler.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { auth } from "@/auth";

const isDev = process.env.NODE_ENV === "development";

// CSP без nonce: сайт использует и статический рендеринг, поэтому inline-скрипты
// Next.js должны быть разрешены. Ужесточение до nonce требует всех динамических страниц — см. README.
const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://challenges.cloudflare.com",
  "media-src 'self'",
  "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://discord.com https://discordapp.com https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
];

const securityHeaders: Record<string, string> = {
  "Content-Security-Policy": cspDirectives.join("; "),
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "X-DNS-Prefetch-Control": "on",
};

export default auth(function proxy(request: NextRequest & { auth: unknown }) {
  const { pathname } = request.nextUrl;

  // Оптимистичная защита: /admin — роль MODERATOR/ADMIN; /settings — любой авторизованный
  const protectedPath = pathname.startsWith("/admin")
    ? ("staff" as const)
    : pathname.startsWith("/settings")
      ? ("private" as const)
      : null;

  if (protectedPath) {
    const session = (request as { auth: { user?: { role?: string } } | null }).auth;
    if (!session) {
      const url = new URL("/signin", request.nextUrl);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (protectedPath === "staff") {
      const role = session.user?.role;
      if (role !== "ADMIN" && role !== "MODERATOR") {
        return NextResponse.redirect(new URL("/", request.nextUrl));
      }
    }
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }
  return response;
});

export const config = {
  matcher: [
    /*
     * Всё, кроме:
     * - api (обрабатывают заголовки сами через next.config при необходимости)
     * - _next/static, _next/image (статика)
     * - favicon.ico, site icon
     */
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
