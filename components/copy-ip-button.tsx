"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

/** Кнопка «Скопировать IP» с обратной связью. */
export function CopyIpButton({
  ip,
  className,
  dark = false,
}: {
  ip: string;
  className?: string;
  dark?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(ip);
    } catch {
      // Fallback для старых браузеров / небезопасного контекста
      const area = document.createElement("textarea");
      area.value = ip;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy");
      } catch {
        // noop
      }
      document.body.removeChild(area);
    }
    setCopied(true);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className={cn(
        "focus-ring inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
        dark
          ? "bg-white/10 text-amber-100 ring-1 ring-white/15 hover:bg-white/15"
          : "border border-orange-200 bg-orange-50 text-orange-900 hover:bg-orange-100",
        className,
      )}
    >
      {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
      {copied ? "IP скопирован!" : ip}
    </button>
  );
}
