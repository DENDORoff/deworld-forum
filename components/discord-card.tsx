"use client";

import { useEffect, useState } from "react";
import { ExternalLink, MessageCircle, Users } from "lucide-react";

import { DISCORD_INVITE } from "@/lib/constants";

interface GuildResolution {
  configured: boolean;
  guildId: string | null;
  source?: "env" | "invite";
  message?: string;
}

type WidgetState =
  | { status: "loading" }
  | { status: "ready"; guildId: string }
  | { status: "fallback" };

const GUILD_ID_RE = /^\d{17,20}$/;

/** Карточка Discord-сервера с официальным Server Widget (iframe discord.com). */
export function DiscordCard() {
  const envGuildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID?.trim() ?? "";
  const theme =
    process.env.NEXT_PUBLIC_DISCORD_WIDGET_THEME?.trim().toLowerCase() === "dark"
      ? "dark"
      : "light";

  const [state, setState] = useState<WidgetState>(() =>
    GUILD_ID_RE.test(envGuildId)
      ? { status: "ready", guildId: envGuildId }
      : { status: "loading" },
  );

  useEffect(() => {
    // ID из NEXT_PUBLIC известен на этапе сборки — лишний запрос не нужен.
    if (GUILD_ID_RE.test(envGuildId)) return;

    let cancelled = false;
    fetch("/api/discord-widget")
      .then((res) =>
        res.ok ? (res.json() as Promise<GuildResolution>) : Promise.reject(),
      )
      .then((data) => {
        if (cancelled) return;
        setState(
          data.guildId && GUILD_ID_RE.test(data.guildId)
            ? { status: "ready", guildId: data.guildId }
            : { status: "fallback" },
        );
      })
      .catch(() => {
        if (!cancelled) setState({ status: "fallback" });
      });
    return () => {
      cancelled = true;
    };
  }, [envGuildId]);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#5865F2]/10 text-[#5865F2]">
          <MessageCircle size={22} aria-hidden />
        </span>
        <div>
          <h3 className="font-semibold text-stone-900">Discord DEWORLD</h3>
          <p className="text-xs text-stone-500">Чат, помощь, анонсы и ивенты</p>
        </div>
      </div>

      <div className="mt-4 flex-1">
        {state.status === "loading" ? (
          <div className="flex h-[500px] items-center justify-center rounded-xl bg-orange-50/60 ring-1 ring-orange-100">
            <p className="text-sm text-stone-500">Подключаем Discord…</p>
          </div>
        ) : state.status === "ready" ? (
          <>
            <div className="mx-auto w-full max-w-[350px] overflow-hidden rounded-xl bg-[#f2f3f5] shadow-sm ring-1 ring-orange-100">
              <iframe
                title="Официальный виджет сервера DEWORLD в Discord"
                src={`https://discord.com/widget?id=${encodeURIComponent(state.guildId)}&theme=${theme}`}
                width={350}
                height={500}
                allowTransparency
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                className="block h-[500px] w-full border-0"
              />
            </div>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
              <Users size={12} aria-hidden /> Онлайн и участники — прямо из Discord
            </p>
          </>
        ) : (
          <ul className="space-y-1.5 text-sm text-stone-600">
            <li>• Живой чат проекта и вопросы новичков</li>
            <li>• Анонсы обновлений и ивентов</li>
            <li>• Быстрый ответ администрации в тикетах</li>
          </ul>
        )}
      </div>

      <a
        href={DISCORD_INVITE}
        target="_blank"
        rel="noopener noreferrer"
        className="focus-ring mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[#4752c4] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3645a3]"
      >
        Присоединиться
        <ExternalLink size={15} aria-hidden />
      </a>
    </div>
  );
}
