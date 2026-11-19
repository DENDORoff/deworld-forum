"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile для форм авторизации/регистрации.
 * Без окружения используется публичный тестовый ключ (работает везде, всегда проходит).
 * В PRODUCTION задайте NEXT_PUBLIC_TURNSTILE_SITE_KEY + TURNSTILE_SECRET_KEY.
 */

const TEST_SITE_KEY = "1x00000000000000000000AA";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: { sitekey: string; callback: (token: string) => void; theme?: string },
      ) => string | undefined;
      reset: (widgetId?: string) => void;
    };
  }
}

export function Turnstile() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || TEST_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    let cancelled = false;
    const render = () => {
      if (cancelled || !window.turnstile || !containerRef.current) return;
      window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (t: string) => setToken(t),
        theme: "light",
      });
    };

    if (window.turnstile) {
      render();
      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = render;
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [siteKey]);

  return (
    <div className="flex justify-center">
      <input type="hidden" name="turnstile" value={token} />
      <div ref={containerRef} className="cf-turnstile" data-testid="turnstile-widget" />
    </div>
  );
}
