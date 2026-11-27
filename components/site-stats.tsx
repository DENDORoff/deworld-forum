"use client";

import { useEffect, useState } from "react";
import { Activity, CalendarDays, Radio, UserRound, Users } from "lucide-react";

import type { SiteStats } from "@/lib/stats";
import { cn, plural } from "@/lib/utils";

/**
 * Живая статистика сайта. Сервер отдаёт первый снимок, дальше данные
 * обновляются после heartbeat посетителя и раз в минуту.
 */
export function SiteStatsPanel({
  initial,
  tone = "dark",
  compact = false,
}: {
  initial: SiteStats;
  tone?: "dark" | "light";
  compact?: boolean;
}) {
  const [stats, setStats] = useState(initial);
  const dark = tone === "dark";

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      void fetch("/api/presence", { cache: "no-store" })
        .then((res) => (res.ok ? (res.json() as Promise<SiteStats>) : null))
        .then((next) => {
          if (!cancelled && next) setStats(next);
        })
        .catch(() => {});
    };
    window.addEventListener("dw:presence", refresh);
    const timer = window.setInterval(refresh, 60_000);
    return () => {
      cancelled = true;
      window.removeEventListener("dw:presence", refresh);
      window.clearInterval(timer);
    };
  }, []);

  const tiles = [
    { label: "Сейчас онлайн", value: stats.online, icon: Radio },
    { label: "Пользователей", value: stats.onlineUsers, icon: UserRound },
    { label: "Посетителей сегодня", value: stats.todayVisitors, icon: CalendarDays },
    { label: "Всего посетителей", value: stats.totalVisitors, icon: Users },
  ];

  return (
    <section
      aria-labelledby="site-stats-heading"
      className={cn(
        "rounded-2xl border p-5",
        dark ? "border-white/10 bg-white/5" : "border-orange-100 bg-white shadow-sm",
        compact && "p-4",
      )}
    >
      <h3
        id="site-stats-heading"
        className={cn(
          "flex items-center gap-2 text-sm font-semibold",
          dark ? "text-amber-100" : "text-stone-900",
        )}
      >
        <Activity size={16} aria-hidden />
        Живая статистика
      </h3>

      <dl
        className={cn(
          "mt-4 grid gap-3",
          compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4",
        )}
      >
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className={cn(
              "rounded-xl px-3 py-3",
              dark ? "bg-white/5 ring-1 ring-white/5" : "bg-orange-50/60",
            )}
          >
            <dt
              className={cn(
                "flex items-center gap-1 text-[11px] uppercase tracking-wide",
                dark ? "text-orange-100/60" : "text-stone-500",
              )}
            >
              <tile.icon size={12} aria-hidden />
              {tile.label}
            </dt>
            <dd
              className={cn(
                "font-display text-xl",
                dark ? "text-amber-100" : "text-stone-900",
              )}
            >
              {tile.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className={cn("mt-4", compact ? "text-xs" : "text-sm")}>
        <p className={cn(dark ? "text-orange-100/70" : "text-stone-500")}>
          В сети сейчас:{" "}
          {stats.nicknames.length > 0 ? (
            <span className={cn("font-medium", dark ? "text-amber-50" : "text-stone-800")}>
              {stats.nicknames.join(", ")}
            </span>
          ) : (
            "пока только гости"
          )}
        </p>
        {stats.nicknames.length > 0 && (
          <p className={cn("mt-1", dark ? "text-orange-100/50" : "text-stone-400")}>
            {plural(stats.nicknames.length, "ник", "ника", "ников")} в списке · лимит 12
          </p>
        )}
      </div>
    </section>
  );
}
