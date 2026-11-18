"use client";

import { useEffect, useState } from "react";
import { ExternalLink, MessageCircle, Users } from "lucide-react";

import { DISCORD_INVITE } from "@/lib/constants";

interface WidgetResponse {
  configured: boolean;
  available?: boolean;
  name?: string;
  online?: number;
  members?: Array<{ username: string; avatarUrl: string | null }>;
}

/** Карточка Discord-сервера с живым онлайном (через прокси /api/discord-widget). */
export function DiscordCard() {
  const [data, setData] = useState<WidgetResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/discord-widget")
      .then((res) => res.json() as Promise<WidgetResponse>)
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setData({ configured: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const online = data?.available ? data.online : undefined;

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
        {online != null ? (
          <>
            <p className="flex items-center gap-2 text-sm font-medium text-stone-800">
              <Users size={16} className="text-emerald-500" aria-hidden />
              <span>
                <span className="font-display text-base text-stone-900">{online}</span> в сети сейчас
              </span>
            </p>
            {data?.members && data.members.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2" aria-label="Кто сейчас в сети">
                {data.members.map((member) => (
                  <li
                    key={member.username}
                    title={member.username}
                    className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-violet-100 text-xs font-bold uppercase text-violet-700 ring-2 ring-white"
                  >
                    {member.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.avatarUrl}
                        alt={member.username}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      member.username.slice(0, 2)
                    )}
                  </li>
                ))}
              </ul>
            )}
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
        className="focus-ring mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[#5865F2] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4752c4]"
      >
        Открыть Discord
        <ExternalLink size={15} aria-hidden />
      </a>
    </div>
  );
}
