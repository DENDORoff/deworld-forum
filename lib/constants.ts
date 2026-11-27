/** Единственное место с «глобальными» константами проекта. */

export const SITE_NAME = "DEWORLD";
export const SITE_TAGLINE = "Всё ещё Minecraft, просто лучше";
export const SITE_DESCRIPTION =
  "DEWORLD — Minecraft-сервер сообщества и форум: новости, обсуждения, ресурсы и поддержка. Играй на mc.de-world.net.";

function env(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

function parsePort(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : fallback;
}

/**
 * Хост сервера можно задать как MINECRAFT_HOST / MINECRAFT_SERVER_HOST,
 * в том числе в форме "host:port" (или "[::1]:25565" для IPv6).
 * Поддерживаются и короткие MINECRAFT_PORT / MINECRAFT_SERVER_PORT.
 *
 * Публичная SRV-запись _minecraft._tcp.mc.de-world.net указывает на порт
 * 30077 — он и используется по умолчанию; пингер всё равно проверит SRV.
 */
const minecraftRawHost =
  env("MINECRAFT_HOST", "MINECRAFT_SERVER_HOST") ?? "mc.de-world.net";
const minecraftWithPort =
  minecraftRawHost.match(/^\[([^\]]+)\]:(\d{1,5})$/) ??
  minecraftRawHost.match(/^([^:]+):(\d{1,5})$/);

export const MINECRAFT_HOST = minecraftWithPort?.[1] ?? minecraftRawHost;
export const MINECRAFT_PORT = parsePort(
  minecraftWithPort?.[2] ?? env("MINECRAFT_PORT", "MINECRAFT_SERVER_PORT"),
  30077,
);

export const DISCORD_INVITE =
  process.env.NEXT_PUBLIC_DISCORD_INVITE ?? "https://discord.gg/deworld";

/**
 * Канал DENDOR / DEWORLD (@deworld_ru) найден по публичным источникам:
 * ID подтверждён страницей YouTube и RSS-фидом (видео с тегом #deworld).
 * Пустые значения env означают «использовать этот канал по умолчанию».
 */
const DEFAULT_YOUTUBE_CHANNEL_ID = "UCnPHpCrXyRREynAUPcYnqqA";
// Стандартный плейлист загрузок того же канала (UC → UU), проверен через RSS.
const DEFAULT_YOUTUBE_PLAYLIST_ID = "UUnPHpCrXyRREynAUPcYnqqA";

export const YOUTUBE_CHANNEL_ID_OVERRIDE = env(
  "NEXT_PUBLIC_YOUTUBE_CHANNEL_ID",
  "YOUTUBE_CHANNEL_ID",
);
export const YOUTUBE_PLAYLIST_ID_OVERRIDE = env(
  "NEXT_PUBLIC_YOUTUBE_PLAYLIST_ID",
  "YOUTUBE_PLAYLIST_ID",
);

export const YOUTUBE_CHANNEL_ID =
  YOUTUBE_CHANNEL_ID_OVERRIDE ?? DEFAULT_YOUTUBE_CHANNEL_ID;
export const YOUTUBE_PLAYLIST_ID =
  YOUTUBE_PLAYLIST_ID_OVERRIDE ?? DEFAULT_YOUTUBE_PLAYLIST_ID;
export const YOUTUBE_CHANNEL_URL = `https://www.youtube.com/channel/${YOUTUBE_CHANNEL_ID}`;

export const ROLES = ["USER", "MODERATOR", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  USER: "Пользователь",
  MODERATOR: "Модератор",
  ADMIN: "Администратор",
};
