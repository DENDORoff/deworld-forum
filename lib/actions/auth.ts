/**
 * Серверные действия аутентификации: вход (email+пароль+2FA), регистрация.
 * OAuth-вход выполняется напрямую через signIn на странице /signin.
 */
"use server";

import { AuthError, configuredOAuthProviders, signIn } from "@/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

import { logBotEvent } from "@/lib/bot-logger";
import { verifyTurnstileToken } from "@/lib/turnstile";

export interface AuthFormState {
  status: "idle" | "error";
  message?: string;
  /** Подсветить поле TOTP (сервер попросил код) */
  totpRequired?: boolean;
  fieldErrors?: Record<string, string>;
}

const IDLE: AuthFormState = { status: "idle" };

function safeCallbackUrl(raw: FormDataEntryValue | null | string | undefined): string {
  if (typeof raw !== "string") return "/forum";
  if (!raw.startsWith("/") || raw.startsWith("//") || /[\\\r\n]/.test(raw)) return "/forum";
  return raw.slice(0, 256);
}

async function ipAddress(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip");
}

export async function oauthSignInAction(
  provider: string,
  callbackUrl = "/forum",
): Promise<void> {
  // Провайдер извне недостоверен: разрешаем только настроенные сервисы.
  if (!configuredOAuthProviders().some((item) => item.id === provider)) {
    throw new Error("OAUTH_PROVIDER_UNAVAILABLE");
  }
  await signIn(provider, { redirectTo: safeCallbackUrl(callbackUrl) });
}

export async function signInAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const totp = String(formData.get("totp") ?? "").trim();
  const callbackUrl = safeCallbackUrl(formData.get("callbackUrl"));

  const captchaOk = await verifyTurnstileToken(
    typeof formData.get("turnstile") === "string" ? String(formData.get("turnstile")) : null,
    await ipAddress(),
  );
  if (!captchaOk) {
    return { status: "error", message: "Подтвердите, что вы не робот (капча)." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      ...(totp ? { totp } : {}),
      redirectTo: callbackUrl,
    });
    return IDLE;
  } catch (error) {
    if (error instanceof AuthError) {
      const code = (error as AuthError & { code?: string }).code ?? "credentials";
      switch (code) {
        case "rate_limited":
          return {
            status: "error",
            message: "Слишком много попыток входа. Подождите 15 минут.",
          };
        case "totp_required":
          return {
            status: "error",
            message: "Для этого аккаунта включена двухфакторная аутентификация — введите код из приложения.",
            totpRequired: true,
          };
        case "totp_invalid":
          return {
            status: "error",
            message: "Неверный код двухфакторной аутентификации.",
            totpRequired: true,
          };
        case "minecraft_unavailable":
          return { status: "error", message: "Вход через Minecraft временно недоступен." };
        default:
          return { status: "error", message: "Неверный email или пароль." };
      }
    }
    // NEXT_REDIRECT — успех: пробрасываем дальше
    throw error;
  }
}

export async function minecraftSignInAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = safeCallbackUrl(formData.get("callbackUrl"));

  try {
    await signIn("minecraft", {
      username,
      password,
      redirectTo: callbackUrl,
    });
    return IDLE;
  } catch (error) {
    if (error instanceof AuthError) {
      const code = (error as AuthError & { code?: string }).code ?? "credentials";
      if (code === "rate_limited") {
        return { status: "error", message: "Слишком много попыток. Подождите 15 минут." };
      }
      if (code === "minecraft_unavailable") {
        return { status: "error", message: "Вход через Minecraft временно недоступен." };
      }
      return { status: "error", message: "Неверный ник или пароль LimboAuth." };
    }
    throw error;
  }
}

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const ip = await ipAddress();

  const captchaOk = await verifyTurnstileToken(
    typeof formData.get("turnstile") === "string" ? String(formData.get("turnstile")) : null,
    ip,
  );
  if (!captchaOk) {
    return { status: "error", message: "Подтвердите, что вы не робот (капча)." };
  }

  const rl = rateLimit(`register:${ip ?? "unknown"}`, 5, 60 * 60 * 1000);
  if (!rl.success) {
    return { status: "error", message: "Слишком много регистраций с вашего IP. Попробуйте позже." };
  }

  const parsed = registerSchema.safeParse({
    username: String(formData.get("username") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    consent: formData.get("consent") === "on" ? true : undefined,
    ageConsent: formData.get("ageConsent") === "on" ? true : undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      status: "error",
      message: "Проверьте, пожалуйста, форму.",
      fieldErrors,
    };
  }

  const { username, email, password } = parsed.data;

  const [emailTaken, usernameTaken] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.user.findUnique({ where: { username }, select: { id: true } }),
  ]);

  if (emailTaken) {
    return {
      status: "error",
      message: "Аккаунт с таким email уже существует.",
      fieldErrors: { email: "Этот email уже зарегистрирован" },
    };
  }
  if (usernameTaken) {
    return {
      status: "error",
      message: "Этот логин уже занят.",
      fieldErrors: { username: "Логин занят — попробуйте другой" },
    };
  }

  const passwordHash = await hashPassword(password);

  try {
    await prisma.user.create({
      data: {
        email,
        username,
        name: username,
        passwordHash,
        role: "USER",
      },
    });
    await logBotEvent("user_registered", {
      actor: { name: username, username },
      target: email,
      targetUrl: `/profile/${username}`,
    });
  } catch (error) {
    console.error("[register] не удалось создать пользователя", error);
    return { status: "error", message: "Не удалось создать аккаунт. Попробуйте позже." };
  }

  // Сразу входим после регистрации
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/forum",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Аккаунт создан, но автоматический вход не удался — не маскируем ошибку
      console.error("[register] sign-in after register failed", error);
      return {
        status: "error",
        message: "Аккаунт создан! Автоматический вход не удался — войдите на странице входа.",
      };
    }
    throw error;
  }

  return IDLE;
}
