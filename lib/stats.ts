import "server-only";

import { connection } from "next/server";

import { prisma } from "@/lib/db";

/** Считаем онлайном активность за последние 5 минут. */
export const ONLINE_WINDOW_MS = 5 * 60 * 1000;

/** Ограничение списка никнеймов на странице. */
export const ONLINE_NICKNAME_LIMIT = 12;

export interface SiteStats {
  /** Уникальные посетители (включая гостей) онлайн прямо сейчас. */
  online: number;
  /** Из них авторизованные пользователи. */
  onlineUsers: number;
  /** Уникальные посетители за текущие сутки UTC, включая неавторизованных. */
  todayVisitors: number;
  /** Всего известных посетителей с момента запуска статистики. */
  totalVisitors: number;
  /** Никнеймы недавно активных пользователей (не гостей). */
  nicknames: string[];
}

/** Статистика для лендинга и форума. Идентификаторы посетителей не раскрываются. */
export async function getSiteStats(): Promise<SiteStats> {
  // Текущее время и «сейчас онлайн» должны считаться на запросе, не на сборке.
  await connection();
  const now = new Date();
  const onlineSince = new Date(now.getTime() - ONLINE_WINDOW_MS);
  const day = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  const [online, onlineVisitors, todayVisitors, totalVisitors, recent] =
    await Promise.all([
      prisma.visitor.count({ where: { lastSeen: { gte: onlineSince } } }),
      prisma.visitor.findMany({
        where: { lastSeen: { gte: onlineSince }, userId: { not: null } },
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.dailyVisit.count({ where: { day } }),
      prisma.visitor.count(),
      prisma.visitor.findMany({
        where: { lastSeen: { gte: onlineSince }, nickname: { not: null } },
        select: { nickname: true },
        orderBy: { lastSeen: "desc" },
        take: ONLINE_NICKNAME_LIMIT * 3,
      }),
    ]);

  const nicknames: string[] = [];
  for (const row of recent) {
    const nickname = row.nickname?.trim();
    if (nickname && !nicknames.includes(nickname)) {
      nicknames.push(nickname);
      if (nicknames.length >= ONLINE_NICKNAME_LIMIT) break;
    }
  }

  return {
    online,
    onlineUsers: onlineVisitors.length,
    todayVisitors,
    totalVisitors,
    nicknames,
  };
}
