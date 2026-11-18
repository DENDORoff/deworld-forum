/**
 * Статус Minecraft-сервера (MOTD, онлайн, версия) с кэшем на 45 секунд,
 * чтобы не пинговать сервер на каждый рендер страницы.
 */
import { NextResponse } from "next/server";

import { pingMinecraftServer, type MinecraftStatus } from "@/lib/minecraft-ping";
import { MINECRAFT_HOST, MINECRAFT_PORT } from "@/lib/constants";

let cached: { value: MinecraftStatus; expires: number } | null = null;
const TTL_MS = 45_000;

export async function GET() {
  const now = Date.now();
  if (cached && cached.expires > now) {
    return NextResponse.json(cached.value, {
      headers: { "Cache-Control": "public, s-maxage=45, stale-while-revalidate=60" },
    });
  }

  const status = await pingMinecraftServer(MINECRAFT_HOST, MINECRAFT_PORT, 3500);
  cached = { value: status, expires: now + TTL_MS };

  return NextResponse.json(status, {
    headers: { "Cache-Control": "public, s-maxage=45, stale-while-revalidate=60" },
  });
}
