/**
 * Публичный виджет Discord-сервера DEWORLD: название и онлайн.
 * Прокси к discord.com/api/guilds/{id}/widget.json (нужен включённый
 * «Виджет сервера» в настройках Discord). Кэш 5 минут. Если сервер не
 * настроен — 503.
 */
import { NextResponse } from "next/server";

interface DiscordWidget {
  name: string;
  presence_count: number;
  members: Array<{
    id: string;
    username: string;
    status: string;
    avatar_url: string | null;
  }>;
}

interface WidgetResult {
  configured: boolean;
  available?: boolean;
  name?: string;
  online?: number;
  members?: Array<{ username: string; avatarUrl: string | null }>;
  status?: number;
  message?: string;
}

let cached: { value: WidgetResult; expires: number } | null = null;
const TTL_MS = 5 * 60 * 1000;

export async function GET() {
  const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;
  if (!guildId) {
    return NextResponse.json(
      { configured: false, message: "NEXT_PUBLIC_DISCORD_GUILD_ID не задан" },
      { status: 200 },
    );
  }

  const now = Date.now();
  if (cached && cached.expires > now) {
    return NextResponse.json(cached.value, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300" },
    });
  }

  try {
    const res = await fetch(
      `https://discord.com/api/guilds/${guildId}/widget.json`,
      {
        signal: AbortSignal.timeout(5000),
        headers: { "User-Agent": "deworld-forum/1.0" },
      },
    );
    if (!res.ok) {
      return NextResponse.json(
        { configured: true, available: false, status: res.status },
        { status: 502 },
      );
    }
    const data = (await res.json()) as DiscordWidget;
    const value: WidgetResult = {
      configured: true,
      available: true,
      name: data.name,
      online: data.presence_count,
      members: (data.members ?? []).slice(0, 8).map((m) => ({
        username: m.username,
        avatarUrl: m.avatar_url ?? null,
      })),
    };
    cached = { value, expires: now + TTL_MS };
    return NextResponse.json(value, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300" },
    });
  } catch {
    return NextResponse.json(
      { configured: true, available: false, message: "Discord недоступен" },
      { status: 502 },
    );
  }
}
