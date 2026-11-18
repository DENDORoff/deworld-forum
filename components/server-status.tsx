"use client";

import { useEffect, useState } from "react";
import { Activity, RefreshCw, Server, Users, Wifi } from "lucide-react";

interface ServerStatus {
  online: boolean;
  latencyMs: number | null;
  version: string | null;
  playersOnline: number | null;
  playersMax: number | null;
  motd: string | null;
}

type LoadState = "loading" | "ready" | "error";

function MotdLines({ motd }: { motd: string }) {
  // MOTD приходит с переносами строк — сохраняем их построчно
  const lines = motd.split(/\r?\n/).filter(Boolean);
  return (
    <div className="font-mono text-sm leading-snug text-amber-200">
      {lines.map((line, i) => (
        <p key={i} className="truncate" title={line}>
          {line}
        </p>
      ))}
    </div>
  );
}

/** Живой статус Minecraft-сервера: MOTD, онлайн, версия, пинг. */
export function ServerStatusCard() {
  const [state, setState] = useState<LoadState>("loading");
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await fetch("/api/server-status", { cache: "no-store" });
      if (!res.ok) throw new Error("status request failed");
      setStatus((await res.json()) as ServerStatus);
      setState("ready");
    } catch {
      setState((prev) => (prev === "ready" ? prev : "error"));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Отложенный первый вызов: избегаем синхронного setState в эффекте
    const initial = window.setTimeout(() => load(), 0);
    const timer = setInterval(() => load(), 60_000);
    return () => {
      window.clearTimeout(initial);
      clearInterval(timer);
    };
  }, []);

  if (state === "loading") {
    return (
      <div aria-hidden className="rounded-2xl border border-white/10 bg-[#241608] p-5">
        <div className="skeleton h-5 w-40 bg-amber-100/10" />
        <div className="skeleton mt-3 h-4 w-56 bg-amber-100/10" />
        <div className="skeleton mt-4 h-9 w-full bg-amber-100/10" />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#241608] p-5 text-sm text-orange-100/85">
        <p className="font-semibold text-amber-100">Статус временно недоступен</p>
        <p className="mt-1">Не удалось получить данные о сервере. Попробуйте ещё раз.</p>
        <button
          type="button"
          onClick={() => load(true)}
          className="focus-ring mt-3 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 font-medium text-amber-100 ring-1 ring-white/15 hover:bg-white/15"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} aria-hidden />
          Повторить
        </button>
      </div>
    );
  }

  const online = status?.online;
  return (
    <div className="rounded-2xl border border-white/10 bg-[#241608] p-5 ring-1 ring-amber-400/10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex h-2.5 w-2.5 rounded-full ${
              online ? "bg-emerald-400" : "bg-red-400"
            }`}
            aria-hidden
          />
          <span className="text-sm font-semibold uppercase tracking-wider text-amber-200/80">
            {online ? "Сервер онлайн" : "Сервер офлайн"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          aria-label="Обновить статус сервера"
          className="focus-ring rounded-lg p-2 text-orange-100/70 hover:bg-white/5 hover:text-amber-100"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} aria-hidden />
        </button>
      </div>

      {status?.motd ? (
        <div className="mt-3 rounded-xl bg-black/35 px-4 py-3 ring-1 ring-white/5">
          <MotdLines motd={status.motd} />
        </div>
      ) : (
        <p className="mt-3 text-sm text-orange-100/60">MOTD недоступен</p>
      )}

      <dl className="mt-4 grid grid-cols-3 gap-3 text-amber-50">
        <div className="rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/5">
          <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-orange-100/60">
            <Users size={12} aria-hidden /> Онлайн
          </dt>
          <dd className="mt-1 font-display text-lg">
            {online && status?.playersOnline != null
              ? `${status.playersOnline}/${status.playersMax ?? "?"}`
              : "—"}
          </dd>
        </div>
        <div className="rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/5">
          <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-orange-100/60">
            <Server size={12} aria-hidden /> Версия
          </dt>
          <dd className="mt-1 truncate font-display text-lg" title={status?.version ?? ""}>
            {status?.version ?? "—"}
          </dd>
        </div>
        <div className="rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/5">
          <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-orange-100/60">
            <Wifi size={12} aria-hidden /> Пинг
          </dt>
          <dd className="mt-1 font-display text-lg">
            {status?.latencyMs != null ? `${status.latencyMs} мс` : "—"}
          </dd>
        </div>
      </dl>

      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-orange-100/45">
        <Activity size={11} aria-hidden /> Обновляется автоматически раз в минуту
      </p>
    </div>
  );
}
