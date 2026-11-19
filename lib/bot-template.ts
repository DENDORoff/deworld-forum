/**
 * Движок шаблонов сообщений для ботов: подстановка плейсхолдеров и
 * экранирование пользовательских данных (для Telegram HTML).
 */

export interface BotTemplateContext {
  /** Имя пользователя-инициатора события */
  user: string;
  /** Ссылка на профиль (абсолютная) */
  userUrl: string;
  /** Заголовок объекта события (тема, жалоба, пользователь) */
  target: string;
  /** Ссылка на объект события (абсолютная) */
  targetUrl: string;
  /** Базовый URL сайта */
  site: string;
  /** Локализованная дата-время */
  date: string;
}

export const BOT_TEMPLATE_PLACEHOLDERS = [
  { token: "{user}", hint: "Имя пользователя" },
  { token: "{user_url}", hint: "Ссылка на профиль" },
  { token: "{target}", hint: "Заголовок цели (тема/жалоба)" },
  { token: "{target_url}", hint: "Ссылка на цель" },
  { token: "{site}", hint: "Адрес сайта" },
  { token: "{date}", hint: "Дата и время" },
] as const;

function escapeTelegramHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Рендерит шаблон: значения пользователя экранируются, разметка самого шаблона
 * сохраняется. Для Telegram передайте escapeValues=true (HTML), для Discord
 * экранирование не требуется (JSON всё экранирует сам).
 */
export function renderBotTemplate(
  template: string,
  ctx: BotTemplateContext,
  { escapeValues = true }: { escapeValues?: boolean } = {},
): string {
  const safe = (value: string) => (escapeValues ? escapeTelegramHtml(value) : value);
  const map: Record<string, string> = {
    user: safe(ctx.user),
    user_url: safe(ctx.userUrl),
    target: safe(ctx.target),
    target_url: safe(ctx.targetUrl),
    site: safe(ctx.site),
    date: safe(ctx.date),
  };
  return template.replace(/\{(user|user_url|target|target_url|site|date)\}/g, (_, key) => map[key] ?? "");
}

export function hexToInt(hex: string): number {
  const clean = hex.replace(/^#/, "");
  const parsed = parseInt(clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean, 16);
  return Number.isFinite(parsed) ? parsed : 0xf97316;
}
