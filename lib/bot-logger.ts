/**
 * Боты для логов DEWORLD: Discord (вебхук, обычные и форум-каналы) и
 * Telegram (отправка через Bot API, поддержка топиков в супергруппах).
 *
 * Конфигурация хранится в Setting «bots.config» (JSON) и редактируется
 * в админке → /admin/bots. У каждого события — собственный шаблон с
 * плейсхолдерами ({user}, {target}, {target_url}, {site}, {date}, {user_url}).
 *
 * Важно: ошибки отправки НИКОГДА не ломают бизнес-действие (try/catch).
 */
import "server-only";

import { getSettingJson } from "@/lib/settings";
import { hexToInt, renderBotTemplate } from "@/lib/bot-template";
import { absoluteUrl } from "@/lib/utils";

export const BOT_EVENTS = [
  "topic_created",
  "post_created",
  "user_registered",
  "report_created",
  "role_changed",
  "settings_changed",
] as const;
export type BotEvent = (typeof BOT_EVENTS)[number];

export interface BotEventConfig {
  enabled: boolean;
  title: string;
  message: string;
  color: string;
}

export interface BotsConfig {
  enabled: boolean;
  discord: {
    webhookUrl: string;
    targetType: "channel" | "forum";
    threadId: string;
    perEventThread: boolean;
  };
  telegram: {
    botToken: string;
    chatId: string;
    threadId: string;
    parseMode: "HTML" | "MarkdownV2";
  };
  events: Record<BotEvent, BotEventConfig>;
}

export const DEFAULT_BOT_EVENTS: Record<BotEvent, BotEventConfig> = {
  topic_created: {
    enabled: true,
    title: "📝 Новая тема",
    message: "**{user}** открыл тему «{target}»",
    color: "#f97316",
  },
  post_created: {
    enabled: false,
    title: "💬 Новый ответ",
    message: "**{user}** ответил в «{target}»",
    color: "#f97316",
  },
  user_registered: {
    enabled: true,
    title: "👋 Новый игрок",
    message: "Зарегистрировался **{user}**",
    color: "#22c55e",
  },
  report_created: {
    enabled: true,
    title: "🚩 Жалоба",
    message: "**{user}** отправил жалобу: {target}",
    color: "#ef4444",
  },
  role_changed: {
    enabled: true,
    title: "🛡️ Роль изменена",
    message: "**{user}**: {target}",
    color: "#3b82f6",
  },
  settings_changed: {
    enabled: false,
    title: "⚙️ Настройки сайта изменены",
    message: "**{user}** изменил настройки: {target}",
    color: "#8b5cf6",
  },
};

export const DEFAULT_BOTS_CONFIG: BotsConfig = {
  enabled: false,
  discord: { webhookUrl: "", targetType: "channel", threadId: "", perEventThread: true },
  telegram: { botToken: "", chatId: "", threadId: "", parseMode: "HTML" },
  events: DEFAULT_BOT_EVENTS,
};

export async function getBotsConfig(): Promise<BotsConfig> {
  const stored = await getSettingJson<Partial<BotsConfig>>("bots.config", {});
  const events = { ...DEFAULT_BOT_EVENTS, ...(stored.events ?? {}) };
  return {
    ...DEFAULT_BOTS_CONFIG,
    ...stored,
    discord: { ...DEFAULT_BOTS_CONFIG.discord, ...(stored.discord ?? {}) },
    telegram: { ...DEFAULT_BOTS_CONFIG.telegram, ...(stored.telegram ?? {}) },
    events,
  };
}

export interface BotEventInput {
  /** Заголовок/цель события (название темы, причина жалобы…) */
  target?: string;
  /** Ссылка на цель (внутренний путь или абсолютный URL) */
  targetUrl?: string;
  /** Кто инициировал (если не указан — «Система») */
  actor?: { name: string; username?: string | null } | null;
}

interface BuiltMessage {
  title: string;
  message: string;
  color: number;
}

async function buildMessage(
  event: BotEvent,
  config: BotsConfig,
  input: BotEventInput,
): Promise<BuiltMessage | null> {
  const eventConfig = config.events[event];
  if (!eventConfig?.enabled) return null;

  const now = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  const actorName = input.actor?.name ?? input.actor?.username ?? "Система";
  const site = absoluteUrl("/");
  const userUrl = input.actor?.username ? absoluteUrl(`/profile/${input.actor.username}`) : site;
  const target = (input.target ?? "").slice(0, 300);
  const targetUrl = input.targetUrl?.startsWith("http")
    ? input.targetUrl
    : input.targetUrl
      ? absoluteUrl(input.targetUrl)
      : site;

  const ctx = { user: actorName, userUrl, target, targetUrl, site, date: now };
  return {
    title: renderBotTemplate(eventConfig.title || DEFAULT_BOT_EVENTS[event].title, ctx, {
      escapeValues: false,
    }),
    message: renderBotTemplate(eventConfig.message || DEFAULT_BOT_EVENTS[event].message, ctx, {
      escapeValues: false,
    }),
    color: hexToInt(eventConfig.color || DEFAULT_BOT_EVENTS[event].color),
  };
}

/** Отправить тестовое сообщение во все настроенные сервисы (для кнопки в админке). */
export async function sendTestBotMessage(): Promise<{ discord: boolean; telegram: boolean }> {
  const config = await getBotsConfig();
  const results = { discord: false, telegram: false };
  if (config.discord.webhookUrl) {
    results.discord = await postDiscord(
      config,
      "🧪 Тестовое сообщение",
      "Бот DEWORLD подключен корректно. Сообщения этого типа можно настроить в /admin/bots.",
      hexToInt("#f97316"),
    );
  }
  if (config.telegram.botToken && config.telegram.chatId) {
    results.telegram = await postTelegram(
      config,
      "<b>🧪 Тестовое сообщение</b>\nБот DEWORLD подключен корректно.",
    );
  }
  return results;
}

/** Отправить событие всем настроенным ботам. Никогда не бросает исключений. */
export async function logBotEvent(event: BotEvent, input: BotEventInput): Promise<void> {
  try {
    const config = await getBotsConfig();
    if (!config.enabled) return;

    const built = await buildMessage(event, config, input);
    if (!built) return;

    if (config.discord.webhookUrl) {
      await postDiscord(config, built.title, built.message, built.color, input);
    }
    if (config.telegram.botToken && config.telegram.chatId) {
      const threadPart = config.telegram.threadId ? ` (тема #${config.telegram.threadId})` : "";
      const text =
        config.telegram.parseMode === "HTML"
          ? `<b>${escapeForTelegram(built.title)}</b>\n${renderForTelegram(built.message)}`
          : `${built.title}\n${built.message}${threadPart}`;
      await postTelegram(config, text);
    }
  } catch (error) {
    console.error("[bots] не удалось отправить событие", event, error);
  }
}

function escapeForTelegram(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderForTelegram(markdownish: string): string {
  // Поддержка **жирного** в шаблонах Telegram HTML
  return escapeForTelegram(markdownish)
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

async function postDiscord(
  config: BotsConfig,
  title: string,
  description: string,
  color: number,
  input?: BotEventInput,
): Promise<boolean> {
  const targetUrl = input?.targetUrl?.startsWith("http")
    ? input.targetUrl
    : input?.targetUrl
      ? absoluteUrl(input.targetUrl)
      : undefined;

  const embed: Record<string, unknown> = {
    title: title.slice(0, 256),
    description: description.slice(0, 4096),
    color,
    timestamp: new Date().toISOString(),
    footer: { text: "DEWORLD · de-world.net" },
  };
  if (targetUrl) embed.url = targetUrl;

  const body: Record<string, unknown> = { embeds: [embed] };

  let webhook = config.discord.webhookUrl;
  if (config.discord.targetType === "forum") {
    if (config.discord.threadId) {
      webhook += `${webhook.includes("?") ? "&" : "?"}thread_id=${encodeURIComponent(config.discord.threadId)}`;
    } else if (config.discord.perEventThread) {
      body.thread_name = title.slice(0, 100);
      body.thread_auto_archive_duration = 1440;
    }
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error("[bots] discord webhook failed", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (error) {
    console.error("[bots] discord webhook error", error);
    return false;
  }
}

async function postTelegram(config: BotsConfig, text: string): Promise<boolean> {
  const payload: Record<string, unknown> = {
    chat_id: config.telegram.chatId,
    text: text.slice(0, 4096),
    parse_mode: config.telegram.parseMode,
    disable_web_page_preview: false,
  };
  if (config.telegram.threadId) {
    payload.message_thread_id = Number(config.telegram.threadId);
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error("[bots] telegram send failed", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (error) {
    console.error("[bots] telegram send error", error);
    return false;
  }
}
