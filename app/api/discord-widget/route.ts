/**
 * Публичный резолвер ID сервера для официального Discord Server Widget.
 *
 * Берём NEXT_PUBLIC_DISCORD_GUILD_ID, либо (если его нет) получаем ID через
 * публичный эндпоинт приглашений discord.com/api/v10/invites/<code> без токена.
 * Клиент подставляет ID в iframe discord.com/widget. При любых ошибках
 * возвращаем безопасный ответ без 500 — карточка покажет fallback с CTA.
 */
import { NextResponse } from "next/server";

interface GuildResolution {
  configured: boolean;
  guildId: string | null;
  source?: "env" | "invite";
  message?: string;
}

const GUILD_ID_RE = /^\d{17,20}$/;
const INVITE_CODE_RE = /^[a-zA-Z0-9_-]{2,32}$/;
const TTL_MS = 6 * 60 * 60 * 1000;
const ERROR_TTL_MS = 60 * 1000;

let cached: { value: GuildResolution; expires: number } | null = null;
let inFlight: Promise<GuildResolution> | null = null;

/** Принимает код, discord.gg/<code>, discord.com/invite/<code> и полный URL. */
function parseInviteCode(input: string | undefined): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;

  let candidate = raw;
  if (/^https?:\/\//i.test(raw) || /^(www\.)?discord(app)?\.(com|gg)\//i.test(raw)) {
    try {
      const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
      if (host === "discord.gg") {
        candidate = url.pathname.replace(/^\/+/, "");
      } else if (host === "discord.com" || host === "discordapp.com") {
        candidate = url.pathname.match(/^\/invite\/([^/]+)/i)?.[1] ?? "";
      } else {
        return null;
      }
    } catch {
      return null;
    }
  }

  const code = candidate.split(/[/?#]/)[0] ?? "";
  return INVITE_CODE_RE.test(code) ? code : null;
}

async function resolveGuild(): Promise<GuildResolution> {
  const envGuildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID?.trim() ?? "";
  if (GUILD_ID_RE.test(envGuildId)) {
    return { configured: true, guildId: envGuildId, source: "env" };
  }

  const code = parseInviteCode(process.env.NEXT_PUBLIC_DISCORD_INVITE);
  if (!code) {
    return {
      configured: false,
      guildId: null,
      message: "NEXT_PUBLIC_DISCORD_GUILD_ID не задан и код приглашения не распознан",
    };
  }

  try {
    const res = await fetch(
      `https://discord.com/api/v10/invites/${encodeURIComponent(code)}`,
      {
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
        headers: { Accept: "application/json", "User-Agent": "deworld-forum/1.0" },
      },
    );
    if (!res.ok) {
      return {
        configured: false,
        guildId: null,
        message: `Не удалось прочитать приглашение Discord (${res.status})`,
      };
    }

    const data = (await res.json()) as { guild?: { id?: unknown } };
    const id = data.guild?.id;
    if (typeof id !== "string" || !GUILD_ID_RE.test(id)) {
      return { configured: false, guildId: null, message: "Discord не вернул ID сервера" };
    }

    return { configured: true, guildId: id, source: "invite" };
  } catch {
    return { configured: false, guildId: null, message: "Discord недоступен" };
  }
}

function respond(value: GuildResolution) {
  return NextResponse.json(value, {
    headers: {
      "Cache-Control": value.configured
        ? "public, s-maxage=300, stale-while-revalidate=3600"
        : "no-store",
    },
  });
}

export async function GET() {
  const now = Date.now();
  if (cached && cached.expires > now) return respond(cached.value);

  if (!inFlight) {
    inFlight = resolveGuild()
      .then((value) => {
        cached = {
          value,
          expires: Date.now() + (value.configured ? TTL_MS : ERROR_TTL_MS),
        };
        return value;
      })
      .finally(() => {
        inFlight = null;
      });
  }

  return respond(await inFlight);
}
