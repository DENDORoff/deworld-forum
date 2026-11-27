/**
 * Heartbeat онлайна и учёт уникальных посетителей.
 *
 * Посетитель получает случайный httpOnly-cookie dw_vid (не IP, не email).
 * По нему считаются: текущий онлайн, пользователи онлайн, уникальные
 * посетители суток (включая неавторизованных). Nic в список онлайна попадает
 * только из авторизованной сессии.
 */
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { connection, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getSiteStats } from "@/lib/stats";

const COOKIE_NAME = "dw_vid";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET() {
  await connection();
  const stats = await getSiteStats();
  return NextResponse.json(stats, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST() {
  await connection();
  const cookieStore = await cookies();
  const existing = cookieStore.get(COOKIE_NAME)?.value;
  const visitorId = existing && UUID_RE.test(existing) ? existing : randomUUID();
  const setCookie = visitorId !== existing;

  const session = await auth();
  const user = session?.user;
  const userId = user?.id ?? null;
  const nickname =
    user?.minecraftUsername ?? user?.username ?? user?.name ?? null;
  const now = new Date();
  const day = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  try {
    await prisma.$transaction([
      prisma.visitor.upsert({
        where: { visitorId },
        create: { visitorId, userId, nickname, lastSeen: now },
        update: { lastSeen: now, userId, nickname },
      }),
      prisma.dailyVisit.upsert({
        where: { day_visitorId: { day, visitorId } },
        create: { day, visitorId },
        update: {},
      }),
    ]);
  } catch (error) {
    console.error("[presence] не удалось записать визит", error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const response = NextResponse.json({ ok: true });
  if (setCookie) {
    response.cookies.set(COOKIE_NAME, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
  }
  return response;
}
