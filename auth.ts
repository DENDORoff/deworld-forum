/**
 * Аутентификация DEWORLD Forum — Auth.js (NextAuth v5).
 *
 * Стратегия сессий: JWT (обязательно для Credentials-провайдера),
 * срок жизни 30 дней, cookie httpOnly + secure в production.
 * OAuth-аккаунты линкуются к пользователю через таблицу Account.
 */
import NextAuth, { AuthError, CredentialsSignin } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Discord from "next-auth/providers/discord";
import VK from "next-auth/providers/vk";
import { cookies, headers } from "next/headers";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { rateLimit, loginRateLimitKey } from "@/lib/rate-limit";
import { verifyTotpToken } from "@/lib/totp";
import { signinSchema } from "@/lib/validations";
import { limboAuthEnabled, verifyLimboCredentials } from "@/lib/limboauth";
import type { Role } from "@/generated/prisma/enums";

/** Специализированные ошибки, чтобы клиент мог различить причину отказа. */
class TotpRequiredError extends CredentialsSignin {
  code = "totp_required";
}
class TotpInvalidError extends CredentialsSignin {
  code = "totp_invalid";
}
class RateLimitedError extends CredentialsSignin {
  code = "rate_limited";
}
class MinecraftUnavailableError extends CredentialsSignin {
  code = "minecraft_unavailable";
}

// ── OAuth: общие объявления и защита привязки ────────────────────────────

export type OAuthProviderId = "google" | "github" | "discord" | "vk";

/**
 * Единый список провайдеров. Кнопки входа и привязки берут его отсюда, чтобы
 * никогда не показывать сервис без заданных ключей.
 */
export const OAUTH_PROVIDERS = [
  { id: "google", label: "Google", enabled: Boolean(process.env.AUTH_GOOGLE_ID) },
  { id: "github", label: "GitHub", enabled: Boolean(process.env.AUTH_GITHUB_ID) },
  { id: "discord", label: "Discord", enabled: Boolean(process.env.AUTH_DISCORD_ID) },
  { id: "vk", label: "VK", enabled: Boolean(process.env.AUTH_VK_ID) },
] as const satisfies ReadonlyArray<{
  id: OAuthProviderId;
  label: string;
  enabled: boolean;
}>;

export function configuredOAuthProviders() {
  return OAUTH_PROVIDERS.filter((provider) => provider.enabled);
}

export function isOAuthProvider(value: string): value is OAuthProviderId {
  return OAUTH_PROVIDERS.some((provider) => provider.id === value);
}

const LINK_INTENT_COOKIE = "deworld_oauth_link";
const NOTICE_COOKIE = "deworld_oauth_notice";
const LINK_INTENT_MAX_AGE = 10 * 60; // 10 минут на прохождение OAuth
const NOTICE_MAX_AGE = 60; // уведомление «одного показа»

interface LinkIntent {
  userId: string;
  provider: OAuthProviderId;
  exp: number;
  nonce: string;
}

export type OAuthNoticeCode =
  | "linked"
  | "unlinked"
  | "already_linked"
  | "link_denied"
  | "unlink_last"
  | "unavailable";

export type OAuthNotice = { kind: "success" | "error"; message: string };

const NOTICE_MESSAGES: Record<OAuthNoticeCode, OAuthNotice> = {
  linked: { kind: "success", message: "Соцсеть успешно привязана к аккаунту." },
  unlinked: { kind: "success", message: "Соцсеть отвязана от аккаунта." },
  already_linked: { kind: "success", message: "Эта соцсеть уже привязана." },
  link_denied: {
    kind: "error",
    message: "Не удалось привязать соцсеть: аккаунт уже используется другим пользователем.",
  },
  unlink_last: {
    kind: "error",
    message: "Нельзя отвязать последний способ входа: задайте пароль или привяжите другую соцсеть.",
  },
  unavailable: { kind: "error", message: "Этот способ входа сейчас недоступен." },
};

function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("[auth] AUTH_SECRET не задан — привязка соцсетей недоступна");
  return secret;
}

function signIntentPayload(payload: string): string {
  return createHmac("sha256", authSecret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Подписанное намерение привязки: выставляется только server action после проверки сессии. */
export async function writeOAuthLinkIntent(
  userId: string,
  provider: OAuthProviderId,
): Promise<void> {
  const intent: LinkIntent = {
    userId,
    provider,
    exp: Date.now() + LINK_INTENT_MAX_AGE * 1000,
    nonce: randomBytes(16).toString("base64url"),
  };
  const payload = Buffer.from(JSON.stringify(intent)).toString("base64url");
  (await cookies()).set(LINK_INTENT_COOKIE, `${payload}.${signIntentPayload(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: LINK_INTENT_MAX_AGE,
  });
}

export async function readOAuthLinkIntent(): Promise<LinkIntent | null> {
  const raw = (await cookies()).get(LINK_INTENT_COOKIE)?.value;
  if (!raw) return null;

  const [payload, signature, ...extra] = raw.split(".");
  if (!payload || !signature || extra.length > 0) return null;
  if (!safeEqual(signature, signIntentPayload(payload))) return null;

  try {
    const intent = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as LinkIntent;
    if (
      !intent ||
      typeof intent.userId !== "string" ||
      !isOAuthProvider(intent.provider) ||
      typeof intent.exp !== "number" ||
      Date.now() > intent.exp
    ) {
      return null;
    }
    return intent;
  } catch {
    return null;
  }
}

export async function clearOAuthLinkIntent(): Promise<void> {
  (await cookies()).set(LINK_INTENT_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

/** Короткоживущее уведомление для настроек. Никаких токенов/секретов внутри. */
export async function setOAuthNotice(code: OAuthNoticeCode): Promise<void> {
  try {
    (await cookies()).set(NOTICE_COOKIE, code, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: NOTICE_MAX_AGE,
    });
  } catch (error) {
    console.error("[auth] не удалось выставить уведомление OAuth", error);
  }
}

export async function getOAuthNotice(): Promise<OAuthNotice | null> {
  const code = (await cookies()).get(NOTICE_COOKIE)?.value as OAuthNoticeCode | undefined;
  return code ? (NOTICE_MESSAGES[code] ?? null) : null;
}

async function clientIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip");
}

async function touchLogin(userId: string): Promise<void> {
  // Не блокируем вход, если запись «последнего визита» не удалась
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  } catch (error) {
    console.error("[auth] не удалось обновить lastLoginAt", error);
  }
}

const providers = [
  Credentials({
    id: "credentials",
    name: "Email и пароль",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Пароль", type: "password" },
      totp: { label: "Код 2FA", type: "text" },
    },
    async authorize(raw) {
      const parsed = signinSchema.safeParse(raw);
      if (!parsed.success) throw new CredentialsSignin();

      const { email, password, totp } = parsed.data;
      const ip = await clientIp();

      const limit = rateLimit(loginRateLimitKey(ip, email), 5, 15 * 60 * 1000);
      if (!limit.success) throw new RateLimitedError();

      const user = await prisma.user.findUnique({ where: { email } });
      // Единое сообщение об ошибке: не раскрываем, существует ли аккаунт
      if (!user?.passwordHash) throw new CredentialsSignin();

      const passwordOk = await verifyPassword(password, user.passwordHash);
      if (!passwordOk) throw new CredentialsSignin();

      if (user.totpEnabled) {
        if (!user.totpSecret) throw new CredentialsSignin();
        if (!totp) throw new TotpRequiredError();
        const account = user.email ?? user.username ?? user.id;
        if (!verifyTotpToken(user.totpSecret, totp, account)) {
          throw new TotpInvalidError();
        }
      }

      await touchLogin(user.id);
      return {
        id: user.id,
        email: user.email,
        name: user.name ?? user.username,
        image: user.image,
      };
    },
  }),

  Credentials({
    id: "minecraft",
    name: "Minecraft",
    credentials: {
      username: { label: "Ник в Minecraft", type: "text" },
      password: { label: "Пароль LimboAuth", type: "password" },
    },
    async authorize(raw) {
      if (!limboAuthEnabled()) throw new MinecraftUnavailableError();

      const username = String((raw as { username?: unknown })?.username ?? "").trim();
      const password = String((raw as { password?: unknown })?.password ?? "");
      if (!/^[A-Za-z0-9_]{3,16}$/.test(username) || password.length < 1) {
        throw new CredentialsSignin();
      }

      const ip = await clientIp();
      const limit = rateLimit(`mc:${ip ?? "unknown"}:${username.toLowerCase()}`, 5, 15 * 60 * 1000);
      if (!limit.success) throw new RateLimitedError();

      const result = await verifyLimboCredentials(username, password);
      if (!result.ok || !result.realname) throw new CredentialsSignin();

      const nick = result.realname;
      // Находим или создаём учётную запись форума для этого ника
      const baseUsername = `mc_${nick}`
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_")
        .slice(0, 20);

      const existing = await prisma.user.findUnique({
        where: { minecraftUsername: nick },
      });
      if (existing) {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            limboAuthId: result.limboId ?? undefined,
            lastLoginAt: new Date(),
          },
        });
      } else {
        // Username может быть занят — перебираем кандидатов с суффиксом
        let created = false;
        for (let attempt = 0; attempt < 5 && !created; attempt++) {
          const candidate =
            attempt === 0 ? baseUsername : `${baseUsername}_${randomInt(1000, 9999)}`;
          try {
            await prisma.user.create({
              data: {
                name: nick,
                username: candidate,
                minecraftUsername: nick,
                limboAuthId: result.limboId ?? undefined,
                lastLoginAt: new Date(),
              },
            });
            created = true;
          } catch (error) {
            if (attempt === 4) throw error;
          }
        }
      }

      const user = await prisma.user.findUniqueOrThrow({
        where: { minecraftUsername: nick },
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name ?? nick,
        image: user.image,
      };
    },
  }),

  ...(process.env.AUTH_GOOGLE_ID ? [Google] : []),
  ...(process.env.AUTH_GITHUB_ID ? [GitHub] : []),
  ...(process.env.AUTH_DISCORD_ID ? [Discord] : []),
  ...(process.env.AUTH_VK_ID ? [VK] : []),
];

const baseAdapter = PrismaAdapter(
  prisma as unknown as Parameters<typeof PrismaAdapter>[0],
);

type LinkAccountArg = Parameters<NonNullable<typeof baseAdapter.linkAccount>>[0];

/**
 * Обёртка adapter.linkAccount — единственное место, где Auth.js реально
 * связывает OAuth-аккаунт с пользователем. Проверяем:
 * 1) аккаунт провайдера уже не принадлежит другому пользователю;
 * 2) если есть сессия — привязка идёт именно к её пользователю и только по
 *    подписанному намерению из настроек;
 * 3) если сессии нет — это регистрация свежесозданного пользователя.
 * Токены провайдера в логи не попадают.
 */
const adapter = {
  ...baseAdapter,
  async linkAccount(account: LinkAccountArg): Promise<void> {
    const existing = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        },
      },
      select: { userId: true },
    });
    if (existing && existing.userId !== account.userId) {
      console.error(
        "[auth] отказ в привязке: OAuth-аккаунт уже связан с другим пользователем",
        { provider: account.provider },
      );
      await setOAuthNotice("link_denied");
      throw new Error("OAUTH_ACCOUNT_ALREADY_LINKED");
    }

    const session = await auth();
    if (session?.user?.id) {
      if (session.user.id !== account.userId) {
        console.error("[auth] отказ в привязке: сессия и целевой пользователь не совпадают", {
          provider: account.provider,
        });
        await setOAuthNotice("link_denied");
        throw new Error("OAUTH_LINK_SESSION_MISMATCH");
      }
      const intent = await readOAuthLinkIntent();
      if (!intent || intent.userId !== session.user.id || intent.provider !== account.provider) {
        console.error("[auth] отказ в привязке: нет подписанного намерения", {
          provider: account.provider,
        });
        await setOAuthNotice("link_denied");
        throw new Error("OAUTH_LINK_INTENT_INVALID");
      }
    } else {
      // Регистрация через соцсеть: разрешаем только свежесозданного пользователя
      // без других способов входа. Email провайдера для связывания не используется.
      const created = await prisma.user.findUnique({
        where: { id: account.userId },
        select: { createdAt: true, _count: { select: { accounts: true } } },
      });
      if (
        !created ||
        created._count.accounts > 0 ||
        Date.now() - created.createdAt.getTime() > 10 * 60 * 1000
      ) {
        console.error("[auth] отказ в привязке: нет сессии и пользователь не новый", {
          provider: account.provider,
        });
        throw new Error("OAUTH_LINK_NO_SESSION");
      }
    }

    await baseAdapter.linkAccount!(account);
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/signin",
  },
  providers,
  callbacks: {
    /**
     * Дополнительная проверка OAuth до того, как Auth.js создаст/свяжет аккаунт.
     * Email из профиля никогда не используется для автоматического связывания:
     * allowDangerousEmailAccountLinking намеренно не включаем.
     */
    async signIn({ user, account, profile }) {
      if (!account || account.type === "credentials" || account.type === "email") {
        return true;
      }
      if (!isOAuthProvider(account.provider)) {
        console.error("[auth] вход через неизвестный OAuth-провайдер", {
          provider: account.provider,
        });
        await setOAuthNotice("unavailable");
        return false;
      }

      const intent = await readOAuthLinkIntent();
      if (intent && (intent.provider !== account.provider || !(await prisma.user.findUnique({
        where: { id: intent.userId },
        select: { id: true },
      })))) {
        console.error("[auth] отказ в привязке: недействительное намерение", {
          provider: account.provider,
        });
        await setOAuthNotice("link_denied");
        return false;
      }

      // Запрещаем неявную привязку по email: если email уже занят другим
      // пользователем/forum-аккаунтом — отказываем в входе/привязке.
      const email =
        typeof profile?.email === "string" ? profile.email.trim().toLowerCase() : null;
      if (email) {
        const owner = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });
        const currentUserId = intent?.userId ?? user.id;
        if (owner && currentUserId && owner.id !== currentUserId) {
          console.error("[auth] отказ входа: email уже принадлежит другому пользователю", {
            provider: account.provider,
          });
          await setOAuthNotice("link_denied");
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      // Первичный вход: фиксируем id
      if (user?.id) {
        token.id = user.id;
        token.roleFetchedAt = 0;
      }
      // Перечитываем роль/премиум из БД не чаще, чем раз в 10 минут
      const fetchedAt =
        typeof token.roleFetchedAt === "number" ? token.roleFetchedAt : 0;
      if (token.id && Date.now() - fetchedAt > 10 * 60 * 1000) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: String(token.id) },
            select: {
              role: true,
              username: true,
              premiumUntil: true,
              totpEnabled: true,
              minecraftUsername: true,
            },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.username = dbUser.username;
            token.premiumUntil = dbUser.premiumUntil?.toISOString() ?? null;
            token.totpEnabled = dbUser.totpEnabled;
            token.minecraftUsername = dbUser.minecraftUsername;
            token.roleFetchedAt = Date.now();
          } else {
            // Пользователь удалён — инвалидируем claims
            token.id = undefined;
            token.role = undefined;
            token.username = undefined;
            token.premiumUntil = undefined;
            token.totpEnabled = undefined;
            token.minecraftUsername = undefined;
          }
        } catch (error) {
          console.error("[auth] не удалось обновить claims токена", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) session.user.id = String(token.id);
      session.user.role = (token.role as Role | undefined) ?? "USER";
      session.user.username = (token.username as string | null | undefined) ?? null;
      session.user.premiumUntil =
        (token.premiumUntil as string | null | undefined) ?? null;
      session.user.totpEnabled = Boolean(token.totpEnabled);
      session.user.minecraftUsername =
        (token.minecraftUsername as string | null | undefined) ?? null;
      return session;
    },
  },
  events: {
    async linkAccount({ user, account }) {
      if (!isOAuthProvider(account.provider)) return;
      try {
        const intent = await readOAuthLinkIntent();
        const explicitLink = Boolean(
          intent && intent.userId === user.id && intent.provider === account.provider,
        );
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: explicitLink ? "oauth_linked" : "oauth_signup",
            // Только идентификатор провайдера — никаких токенов и email.
            metadata: { provider: account.provider },
            ip: await clientIp(),
          },
        });
        if (explicitLink) {
          await clearOAuthLinkIntent();
          await setOAuthNotice("linked");
        }
      } catch (error) {
        console.error("[auth] не удалось записать событие привязки OAuth", error);
      }
    },
  },
  trustHost: true,
});

export { AuthError, CredentialsSignin };
