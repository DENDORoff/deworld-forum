/** Единственное место с «глобальными» константами проекта. */

export const SITE_NAME = "DEWORLD";
export const SITE_TAGLINE = "Всё ещё Minecraft, просто лучше";
export const SITE_DESCRIPTION =
  "DEWORLD — Minecraft-сервер сообщества и форум: новости, обсуждения, ресурсы и поддержка. Играй на mc.de-world.net.";

export const MINECRAFT_HOST =
  process.env.MINECRAFT_SERVER_HOST ?? "mc.de-world.net";
export const MINECRAFT_PORT = Number(process.env.MINECRAFT_SERVER_PORT ?? 25565);

export const DISCORD_INVITE =
  process.env.NEXT_PUBLIC_DISCORD_INVITE ?? "https://discord.gg/deworld";

export const YOUTUBE_CHANNEL_ID = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID ?? "";
export const YOUTUBE_CHANNEL_URL = YOUTUBE_CHANNEL_ID
  ? `https://www.youtube.com/channel/${YOUTUBE_CHANNEL_ID}`
  : "https://www.youtube.com/";

export const ROLES = ["USER", "MODERATOR", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  USER: "Пользователь",
  MODERATOR: "Модератор",
  ADMIN: "Администратор",
};
