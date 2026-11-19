/**
 * Восстановление пароля по email: одноразовый токен (хранится хэшем),
 * ссылка живёт 1 час, письмо уходит только если SMTP настроен.
 */
"use server";

import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";

import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { emailSchema, passwordSchema } from "@/lib/validations";
import { absoluteUrl } from "@/lib/utils";
import { sendPasswordResetMail, mailEnabled } from "@/lib/mail";
import { rateLimit } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { z } from "zod";

export interface ResetFormState {
  status: "idle" | "error" | "success";
  message?: string;
}

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 час

async function ipAddress(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function forgotPasswordAction(
  _prev: ResetFormState,
  formData: FormData,
): Promise<ResetFormState> {
  const ip = await ipAddress();

  const captchaOk = await verifyTurnstileToken(
    typeof formData.get("turnstile") === "string" ? String(formData.get("turnstile")) : null,
    ip,
  );
  if (!captchaOk) {
    return { status: "error", message: "Подтвердите, что вы не робот (капча)." };
  }

  const rl = rateLimit(`forgot:${ip ?? "unknown"}`, 3, 60 * 60 * 1000);
  if (!rl.success) {
    return { status: "error", message: "Слишком много запросов. Попробуйте позже." };
  }

  const parsed = emailSchema.safeParse(String(formData.get("email") ?? ""));
  if (!parsed.success) {
    return { status: "error", message: "Укажите корректный email." };
  }
  const email = parsed.data;

  // Ответ всегда одинаковый: не раскрываем, существует ли аккаунт
  const genericMessage =
    "Если аккаунт с таким email существует, мы отправили письмо со ссылкой для сброса.";

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, username: true } });
  if (!user) {
    return { status: "success", message: genericMessage };
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expires = new Date(Date.now() + TOKEN_TTL_MS);

  // Старые токены этого email больше не действительны
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({
    data: { identifier: email, token: tokenHash, expires },
  });

  if (!mailEnabled()) {
    console.log(
      `[forgot] SMTP не настроен. Сброс для ${email} (не отправлен). Ссылка: ${absoluteUrl(`/reset?token=${token}`)}`,
    );
    return {
      status: "success",
      message:
        "Письма временно недоступны: администратор ещё не подключил почтовый шлюз. Попросите сбросить пароль администрацию сервера.",
    };
  }

  await sendPasswordResetMail(email, absoluteUrl(`/reset?token=${token}`), user.username);
  return { status: "success", message: genericMessage };
}

const resetSchema = z.object({
  token: z.string().min(10).max(128),
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Повторите пароль"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

export async function resetPasswordAction(
  _prev: ResetFormState,
  formData: FormData,
): Promise<ResetFormState> {
  const parsed = resetSchema.safeParse({
    token: String(formData.get("token") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }

  const tokenHash = hashToken(parsed.data.token);
  const entry = await prisma.verificationToken.findFirst({
    where: { token: tokenHash, expires: { gt: new Date() } },
  });

  if (!entry) {
    return {
      status: "error",
      message: "Ссылка недействительна или устарела. Запросите сброс пароля ещё раз.",
    };
  }

  const email = entry.identifier;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    return { status: "error", message: "Аккаунт не найден." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(parsed.data.password) },
    }),
    prisma.verificationToken.deleteMany({ where: { identifier: email } }),
  ]);

  try {
    await prisma.auditLog.create({
      data: { userId: user.id, action: "auth.password_reset" },
    });
  } catch (error) {
    console.error("[audit]", error);
  }

  return {
    status: "success",
    message: "Пароль обновлён. Теперь войдите с новым паролем.",
  };
}
