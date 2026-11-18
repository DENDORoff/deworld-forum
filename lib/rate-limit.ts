/**
 * Простой in-memory rate limiter (скользящее окно).
 *
 * Подходит для одного инстанса / serverless-функций с "тёплыми" вызовами.
 * Для строгого ограничения в распределённой среде замените хранилище на Redis.
 */

import "server-only";

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

// Периодическая очистка старых ключей, чтобы Map не рос бесконечно
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
    if (bucket.timestamps.length === 0) buckets.delete(key);
  }
}

export interface RateLimitResult {
  success: boolean;
  /** Сколько запросов осталось в текущем окне */
  remaining: number;
  /** Через сколько миллисекунд окно сбросится */
  resetAfterMs: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  if (process.env.RATE_LIMIT_ENABLED === "false") {
    return { success: true, remaining: limit, resetAfterMs: 0 };
  }

  cleanup(windowMs);
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    buckets.set(key, bucket);
    return {
      success: false,
      remaining: 0,
      resetAfterMs: oldest + windowMs - now,
    };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return {
    success: true,
    remaining: limit - bucket.timestamps.length,
    resetAfterMs: windowMs,
  };
}

/** Ключ лимита для входа: по IP и по email (двойная защита). */
export function loginRateLimitKey(ip: string | null, email: string): string {
  return `login:${ip ?? "unknown"}:${email.toLowerCase()}`;
}
