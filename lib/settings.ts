/**
 * Редактируемые из админки настройки сайта (таблица Setting в БД).
 * Кэшируются через «use cache» (Next.js Cache Components) и инвалидируются
 * тегом «settings» при сохранении в админке.
 */
import "server-only";

import { cacheLife, cacheTag, revalidateTag } from "next/cache";

import { prisma } from "@/lib/db";

export const SETTINGS_CACHE_TAG = "settings";

export const SETTING_KEYS = [
  "site_announcement", // объявление на форуме (пусто = скрыто)
  "youtube_video_ids", // JSON-массив ID роликов для карусели
  "premium_perks", // JSON-массив строк с преимуществами подписки
  "premium_price_label", // например «149 ₽/мес»
  "server_online_goal", // ориентир онлайн-рекорда
] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

export async function getSetting(key: string): Promise<string | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(SETTINGS_CACHE_TAG);

  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function getSettingJson<T>(
  key: string,
  fallback: T,
): Promise<T> {
  const raw = await getSetting(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Вызывается из админки. Инвалидирует кэш «settings». */
export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
  revalidateTag(SETTINGS_CACHE_TAG, "max");
}

export async function getDefaultSettings(): Promise<
  Array<{ key: SettingKey; value: string | null }>
> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: [...SETTING_KEYS] } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return SETTING_KEYS.map((key) => ({ key, value: map.get(key) ?? null }));
}
