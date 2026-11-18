import { clsx, type ClassValue } from "clsx";

/** Склейка классов Tailwind без внешних зависимостей. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(...inputs);
}

/** Абсолютный URL сайта (production / preview / local). */
export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.AUTH_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    "http://localhost:3000";
  return raw.startsWith("http") ? raw : `https://${raw}`;
}

export function absoluteUrl(path = "/"): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(date: Date | string): string {
  return dateTimeFormatter.format(new Date(date));
}

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatDate(date: Date | string): string {
  return dateFormatter.format(new Date(date));
}

/** «5 минут назад», «3 дня назад» и т.п. */
export function timeAgo(date: Date | string): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "только что";
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} дн назад`;
  return formatDate(date);
}

export interface PremiumCapable {
  premiumUntil: Date | string | null | undefined;
}

export function isPremiumActive(user: PremiumCapable | null | undefined): boolean {
  if (!user?.premiumUntil) return false;
  return new Date(user.premiumUntil).getTime() > Date.now();
}

/** Человекочитаемое склонение: 1 тема / 2 темы / 5 тем */
export function plural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} ${one}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
    return `${count} ${few}`;
  return `${count} ${many}`;
}
