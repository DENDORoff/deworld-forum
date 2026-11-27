/**
 * Серверные действия привязки/отвязки внешних аккаунтов (Google, GitHub,
 * Discord, VK) к уже авторизованному пользователю форума.
 *
 * Привязка идёт через стандартный OAuth-флоу Auth.js: server action проверяет
 * сессию, выставляет подписанное httpOnly-намерение и вызывает signIn().
 * Auth.js сам генерирует OAuth state/PKCE; в callback обёртка adapter.linkAccount
 * сверяет намерение, сессию и отсутствие чужого аккаунта у провайдера.
 */
"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  auth,
  configuredOAuthProviders,
  isOAuthProvider,
  setOAuthNotice,
  signIn,
  writeOAuthLinkIntent,
  type OAuthProviderId,
} from "@/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

/** Возвращаемое состояние оставлено на будущие клиентские формы (useActionState). */
export type OAuthLinkState = {
  status: "idle" | "error";
  message?: string;
};

async function ipAddress(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip");
}

function providerEnabled(provider: string): provider is OAuthProviderId {
  return (
    isOAuthProvider(provider) &&
    configuredOAuthProviders().some((item) => item.id === provider)
  );
}

async function audit(
  userId: string,
  action: "oauth_linked" | "oauth_unlinked",
  provider: OAuthProviderId,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        // Только идентификатор провайдера: токены/email/секреты не пишем.
        metadata: { provider },
        ip: await ipAddress(),
      },
    });
  } catch (error) {
    console.error("[oauth-link] не удалось записать аудит", error);
  }
}

/** Начать привязку соцсети: проверяем сессию и передаём намерение в OAuth-флоу. */
export async function linkOAuthAction(provider: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    await setOAuthNotice("unavailable");
    redirect("/signin?callbackUrl=/settings");
  }
  if (!providerEnabled(provider)) {
    await setOAuthNotice("unavailable");
    redirect("/settings#oauth");
  }

  const limit = rateLimit(`oauth-link:${session.user.id}`, 10, 15 * 60 * 1000);
  if (!limit.success) {
    await setOAuthNotice("unavailable");
    redirect("/settings#oauth");
  }

  await writeOAuthLinkIntent(session.user.id, provider);
  // В NextAuth v5 используется redirectTo (callbackUrl объявлен deprecated).
  // OAuth state формируется библиотекой — подписанное намерение живёт в cookie.
  await signIn(provider, { redirectTo: "/settings?linked=1" });
}

/**
 * Отвязать соцсеть. Запрещаем отвязку последнего способа входа: если нет
 * пароля, Minecraft-ника и других привязанных аккаунтов — отказываем.
 */
export async function unlinkOAuthAction(provider: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    await setOAuthNotice("unavailable");
    revalidatePath("/settings");
    return;
  }
  if (!providerEnabled(provider)) {
    await setOAuthNotice("unavailable");
    revalidatePath("/settings");
    return;
  }

  const limit = rateLimit(`oauth-unlink:${session.user.id}`, 10, 15 * 60 * 1000);
  if (!limit.success) {
    await setOAuthNotice("unavailable");
    revalidatePath("/settings");
    return;
  }

  const userId = session.user.id;
  const result = await prisma.$transaction(async (tx) => {
    const [user, accounts] = await Promise.all([
      tx.user.findUnique({
        where: { id: userId },
        select: {
          passwordHash: true,
          minecraftUsername: true,
          limboAuthId: true,
        },
      }),
      tx.account.findMany({ where: { userId }, select: { provider: true } }),
    ]);

    if (!user) return "not_found" as const;
    if (!accounts.some((account) => account.provider === provider)) {
      return "not_linked" as const;
    }

    const hasPassword = Boolean(user.passwordHash);
    const hasMinecraft = Boolean(user.minecraftUsername || user.limboAuthId);
    const hasOtherOAuth = accounts.some((account) => account.provider !== provider);
    if (!hasPassword && !hasMinecraft && !hasOtherOAuth) {
      return "last_login" as const;
    }

    // Удаляем строго по связке userId+provider, id аккаунта от клиента не берём.
    await tx.account.deleteMany({ where: { userId, provider } });
    return "ok" as const;
  });

  switch (result) {
    case "ok":
      await audit(userId, "oauth_unlinked", provider);
      await setOAuthNotice("unlinked");
      break;
    case "last_login":
      await setOAuthNotice("unlink_last");
      break;
    case "not_linked":
    case "not_found":
    default:
      await setOAuthNotice("link_denied");
      break;
  }

  revalidatePath("/settings");
}
