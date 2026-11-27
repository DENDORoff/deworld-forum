/**
 * Статус Minecraft-сервера (MOTD, онлайн, версия) с кэшем на 45 секунд,
 * чтобы не пинговать сервер на каждый рендер страницы.
 */
import { connection, NextResponse } from "next/server";

import { pingMinecraftServer, type MinecraftStatus } from "@/lib/minecraft-ping";
import { MINECRAFT_HOST, MINECRAFT_PORT } from "@/lib/constants";

let cached: { key: string; value: MinecraftStatus; expires: number } | null = null;
const TTL_MS = 45_000;
const HEADERS = {
  "Cache-Control": "public, s-maxage=45, stale-while-revalidate=60",
};

export async function GET() {
  // Явно вычисляем статус на запрос (Next 16 Cache Components).
  await connection();

  const now = Date.now();
  const key = `${MINECRAFT_HOST}:${MINECRAFT_PORT}`;
  if (cached && cached.key === key && cached.expires > now) {
    return NextResponse.json(cached.value, { headers: HEADERS });
  }

  const status = await pingMinecraftServer(MINECRAFT_HOST, MINECRAFT_PORT, {
    timeoutMs: 2500,
    attempts: 2,
  });
  cached = { key, value: status, expires: now + TTL_MS };

  return NextResponse.json(status, { headers: HEADERS });
}
