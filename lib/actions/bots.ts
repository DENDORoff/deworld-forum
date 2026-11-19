/**
 * Серверные действия для настроек ботов (admin-only).
 * Секреты (webhookUrl, botToken) не перетираются пустыми значениями.
 */
"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getSettingJson, setSetting } from "@/lib/settings";
import {
  BOT_EVENTS,
  DEFAULT_BOTS_CONFIG,
  getBotsConfig,
  sendTestBotMessage,
  type BotEvent,
  type BotsConfig,
} from "@/lib/bot-logger";

export interface BotsFormState {
  status: "idle" | "error" | "success";
  message?: string;
  discordOk?: boolean;
  telegramOk?: boolean;
}

async function requireStaff() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "MODERATOR")) {
    throw new Error("FORBIDDEN");
  }
  return { userId: session.user.id, role };
}

async function auditBots(userId: string, action: string, metadata?: Record<string, unknown>) {
  try {
    await prisma.auditLog.create({
      data: { userId, action, metadata: metadata as object | undefined },
    });
  } catch (error) {
    console.error("[audit]", error);
  }
}

const HEX_COLOR_REGEX = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export async function updateBotsConfigAction(
  _prev: BotsFormState,
  formData: FormData,
): Promise<BotsFormState> {
  const ctx = await requireStaff();
  const current = await getBotsConfig();

  const enabled = formData.get("enabled") === "on";

  const webhookUrlInput = String(formData.get("discord_webhookUrl") ?? "").trim();
  const webhookUrl = webhookUrlInput || current.discord.webhookUrl;
  if (webhookUrl && !/^https:\/\/discord(app)?\.com\/api\/webhooks\//.test(webhookUrl)) {
    return { status: "error", message: "Discord webhook URL должен начинаться с https://discord.com/api/webhooks/" };
  }

  const targetTypeRaw = String(formData.get("discord_targetType") ?? "channel");
  const targetType = targetTypeRaw === "forum" ? "forum" : "channel";
  const threadIdDiscord = String(formData.get("discord_threadId") ?? "").trim().slice(0, 32);
  const perEventThread = formData.get("discord_perEventThread") === "on";

  const botTokenInput = String(formData.get("telegram_botToken") ?? "").trim();
  const botToken = botTokenInput || current.telegram.botToken;
  if (botToken && !/^\d+:[A-Za-z0-9_-]{30,}$/.test(botToken)) {
    return { status: "error", message: "Telegram bot token выглядит некорректно (123456:ABC…)" };
  }
  const chatId = String(formData.get("telegram_chatId") ?? "").trim().slice(0, 32);
  if (chatId && !/^-?\d+$/.test(chatId)) {
    return { status: "error", message: "Telegram chat_id должен быть числом (например -1001234567890)" };
  }
  const threadIdTelegram = String(formData.get("telegram_threadId") ?? "").trim().slice(0, 16);
  if (threadIdTelegram && !/^\d+$/.test(threadIdTelegram)) {
    return { status: "error", message: "Telegram thread_id (message_thread_id) должен быть числом" };
  }
  const parseMode = String(formData.get("telegram_parseMode") ?? "HTML") === "MarkdownV2" ? "MarkdownV2" : "HTML";

  const events = { ...DEFAULT_BOTS_CONFIG.events };
  for (const key of BOT_EVENTS) {
    const eventEnabled = formData.get(`event_${key}_enabled`) === "on";
    const title = String(formData.get(`event_${key}_title`) ?? "").slice(0, 120).trim();
    const message = String(formData.get(`event_${key}_message`) ?? "").slice(0, 1500).trim();
    let color = String(formData.get(`event_${key}_color`) ?? "#f97316").trim();
    if (!HEX_COLOR_REGEX.test(color)) color = "#f97316";
    events[key as BotEvent] = { enabled: eventEnabled, title, message, color };
  }

  const next: BotsConfig = {
    enabled,
    discord: { webhookUrl, targetType, threadId: threadIdDiscord, perEventThread },
    telegram: { botToken, chatId, threadId: threadIdTelegram, parseMode },
    events,
  };

  await setSetting("bots.config", JSON.stringify(next));
  await auditBots(ctx.userId, "admin.bots_update", {
    discordEnabled: Boolean(webhookUrl),
    telegramEnabled: Boolean(botToken && chatId),
  });
  revalidatePath("/admin/bots");
  return { status: "success", message: "Настройки ботов сохранены." };
}

export async function testBotsAction(_prev: BotsFormState): Promise<BotsFormState> {
  const ctx = await requireStaff();
  const result = await sendTestBotMessage();
  await auditBots(ctx.userId, "admin.bots_test", result);
  const parts: string[] = [];
  parts.push(result.discord ? "Discord ✓" : "Discord — не настроен или ошибка");
  parts.push(result.telegram ? "Telegram ✓" : "Telegram — не настроен или ошибка");
  return {
    status: "success",
    message: `Тест: ${parts.join(" · ")}`,
    discordOk: result.discord,
    telegramOk: result.telegram,
  };
}
