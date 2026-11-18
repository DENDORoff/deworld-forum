/**
 * Серверные действия настроек аккаунта: профиль, пароль, 2FA (TOTP),
 * привязка Minecraft, удаление аккаунта (152-ФЗ «право на удаление»).
 */
"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { passwordSchema, usernameSchema } from "@/lib/validations";
import { generateTotpSecret, verifyTotpToken } from "@/lib/totp";
import { limboAuthEnabled, verifyLimboCredentials } from "@/lib/limboauth";
import { rateLimit } from "@/lib/rate-limit";

export interface SettingsFormState {
  status: "idle" | "error" | "success";
  message?: string;
}

const IDLE: SettingsFormState = { status: "idle" };

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHENTICATED");
  return session.user.id;
}

async function ipAddress(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip");
}

async function audit(
  userId: string | null,
  action: string,
  metadata?: Record<string, unknown>,
) {
  try {
    await prisma.auditLog.create({
      data: { userId, action, metadata: metadata as object | undefined, ip: await ipAddress() },
    });
  } catch (error) {
    console.error("[audit]", error);
  }
}

// ── Профиль ────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().trim().min(1, "Имя не может быть пустым").max(80, "Максимум 80 символов"),
  image: z
    .string()
    .trim()
    .max(512)
    .refine(
      (v) => v === "" || /^https:\/\/[^\s]+$/.test(v),
      "Аватар — только https-ссылка",
    ),
});

export async function updateProfileAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const userId = await requireUserId();
  const parsed = profileSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    image: String(formData.get("image") ?? ""),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.data.name,
      image: parsed.data.image || null,
    },
  });
  await audit(userId, "settings.profile");
  revalidatePath("/settings");
  return { status: "success", message: "Профиль сохранён." };
}

export async function updateUsernameAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const userId = await requireUserId();
  const parsed = usernameSchema.safeParse(String(formData.get("username") ?? ""));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }
  const taken = await prisma.user.findFirst({
    where: { username: parsed.data, NOT: { id: userId } },
    select: { id: true },
  });
  if (taken) return { status: "error", message: "Этот логин уже занят." };

  await prisma.user.update({ where: { id: userId }, data: { username: parsed.data } });
  await audit(userId, "settings.username", { username: parsed.data });
  revalidatePath("/settings");
  return { status: "success", message: "Логин обновлён. Войдите заново, чтобы он применился в сессии." };
}

// ── Пароль ─────────────────────────────────────────────────────────────────

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Введите текущий пароль"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Повторите новый пароль"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export async function updatePasswordAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const userId = await requireUserId();
  const parsed = passwordFormSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user?.passwordHash) {
    return {
      status: "error",
      message: "У аккаунта нет пароля (вход через внешний сервис). Смените пароль невозможна.",
    };
  }
  const ok = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!ok) return { status: "error", message: "Текущий пароль неверен." };

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });
  await audit(userId, "settings.password");
  return { status: "success", message: "Пароль обновлён." };
}

// ── TOTP 2FA ───────────────────────────────────────────────────────────────

/** Шаг 1: создать секрет (ещё не включён — пользователь сканирует QR). */
export async function totpStartAction(): Promise<void> {
  const userId = await requireUserId();
  const ip = await ipAddress();
  const rl = rateLimit(`totp-start:${ip ?? userId}`, 5, 10 * 60 * 1000);
  if (!rl.success) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpEnabled: true, email: true, username: true },
  });
  if (!user || user.totpEnabled) return;

  await prisma.user.update({
    where: { id: userId },
    data: { totpSecret: generateTotpSecret() },
  });
  revalidatePath("/settings");
}

/** Шаг 2: подтвердить код из приложения и включить 2FA. */
export async function totpConfirmAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const userId = await requireUserId();
  const token = String(formData.get("token") ?? "").trim();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpSecret: true, email: true, username: true, totpEnabled: true },
  });
  if (!user?.totpSecret) {
    return { status: "error", message: "Сначала сгенерируйте ключ 2FA." };
  }
  if (user.totpEnabled) {
    return { status: "success", message: "2FA уже включена." };
  }

  const account = user.email ?? user.username ?? userId;
  if (!verifyTotpToken(user.totpSecret, token, account)) {
    return { status: "error", message: "Код не подходит. Проверьте время на устройстве и повторите." };
  }

  await prisma.user.update({ where: { id: userId }, data: { totpEnabled: true } });
  await audit(userId, "settings.totp_enable");
  revalidatePath("/settings");
  return { status: "success", message: "Двухфакторная аутентификация включена." };
}

/** Отключить 2FA: нужен пароль и действующий код. */
export async function totpDisableAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const userId = await requireUserId();
  const password = String(formData.get("password") ?? "");
  const token = String(formData.get("token") ?? "").trim();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, totpSecret: true, email: true, username: true, totpEnabled: true },
  });
  if (!user?.totpEnabled || !user.totpSecret) {
    return { status: "error", message: "2FA не включена." };
  }
  if (user.passwordHash) {
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return { status: "error", message: "Неверный пароль." };
  }
  const account = user.email ?? user.username ?? userId;
  if (!verifyTotpToken(user.totpSecret, token, account)) {
    return { status: "error", message: "Неверный код из приложения." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { totpEnabled: false, totpSecret: null },
  });
  await audit(userId, "settings.totp_disable");
  revalidatePath("/settings");
  return { status: "success", message: "Двухфакторная аутентификация отключена." };
}

// ── Привязка Minecraft ─────────────────────────────────────────────────────

const minecraftLinkSchema = z.object({
  nickname: z.string().trim().regex(/^[A-Za-z0-9_]{3,16}$/, "Ник: 3–16 символов, латиница, цифры, «_»"),
  password: z.string().min(1, "Введите пароль LimboAuth"),
});

export async function linkMinecraftAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const userId = await requireUserId();
  if (!limboAuthEnabled()) {
    return { status: "error", message: "Интеграция с Minecraft пока не настроена на сервере." };
  }

  const ip = await ipAddress();
  const rl = rateLimit(`link-mc:${ip ?? userId}`, 5, 15 * 60 * 1000);
  if (!rl.success) {
    return { status: "error", message: "Слишком много попыток. Подождите 15 минут." };
  }

  const parsed = minecraftLinkSchema.safeParse({
    nickname: String(formData.get("nickname") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }

  const result = await verifyLimboCredentials(parsed.data.nickname, parsed.data.password);
  if (!result.ok || !result.realname) {
    return { status: "error", message: "Ник или пароль не подошли (сверка с LimboAuth не удалась)." };
  }

  const attached = await prisma.user.findFirst({
    where: { minecraftUsername: result.realname, NOT: { id: userId } },
    select: { id: true },
  });
  if (attached) {
    return { status: "error", message: "Этот Minecraft-ник уже привязан к другому аккаунту." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      minecraftUsername: result.realname,
      limboAuthId: result.limboId,
    },
  });
  await audit(userId, "settings.minecraft_link", { nickname: result.realname });
  revalidatePath("/settings");
  return { status: "success", message: `Minecraft-ник ${result.realname} привязан.` };
}

export async function unlinkMinecraftAction(): Promise<void> {
  const userId = await requireUserId();
  await prisma.user.update({
    where: { id: userId },
    data: { minecraftUsername: null, limboAuthId: null },
  });
  await audit(userId, "settings.minecraft_unlink");
  revalidatePath("/settings");
}

// ── Удаление аккаунта (право на удаление данных, 152-ФЗ) ──────────────────

const deleteAccountSchema = z.object({
  password: z.string().min(1, "Введите пароль"),
  confirmText: z.literal("УДАЛИТЬ", { error: "Введите слово «УДАЛИТЬ»" }),
});

export async function deleteAccountAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const userId = await requireUserId();
  const parsed = deleteAccountSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirmText: String(formData.get("confirmText") ?? ""),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, totpEnabled: true, totpSecret: true, email: true, username: true },
  });
  if (!user) return { status: "error", message: "Аккаунт не найден." };

  if (user.passwordHash) {
    const ok = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!ok) return { status: "error", message: "Неверный пароль." };
  }

  // Жёсткое удаление: посты/темы/лайки удалятся каскадом по FK
  await audit(userId, "settings.account_delete", {
    email: user.email,
    username: user.username,
  });
  await prisma.user.delete({ where: { id: userId } });

  // Гасим сессию — дальше cookie бесполезна
  const { signOut } = await import("@/auth");
  await signOut({ redirectTo: "/" });
  return IDLE;
}
