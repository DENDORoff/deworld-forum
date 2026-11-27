"use client";

import { useEffect } from "react";

const HEARTBEAT_MS = 60_000;
const CONSENT_KEY = "dw_cookie_consent_v1";

function analyticsAllowed(): boolean {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    return raw ? Boolean(JSON.parse(raw)?.analytics) : false;
  } catch {
    return false;
  }
}

/** Тихий heartbeat: обновляет онлайн и учитывает посетителя дня. */
export function PresenceTracker() {
  useEffect(() => {
    const ping = () => {
      if (document.visibilityState !== "visible" || !analyticsAllowed()) return;
      void fetch("/api/presence", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        keepalive: true,
      })
        .then((response) => {
          if (response.ok) {
            window.dispatchEvent(new Event("dw:presence"));
          }
        })
        .catch(() => {});
    };

    ping();
    const timer = window.setInterval(ping, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", ping);
    window.addEventListener("pageshow", ping);
    window.addEventListener("dw:cookie-consent", ping);
    window.addEventListener("storage", ping);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", ping);
      window.removeEventListener("pageshow", ping);
      window.removeEventListener("dw:cookie-consent", ping);
      window.removeEventListener("storage", ping);
    };
  }, []);

  return null;
}
