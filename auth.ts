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
import { headers } from "next/headers";
import { randomInt } from "node:crypto";

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

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(
    prisma as unknown as Parameters<typeof PrismaAdapter>[0],
  ),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/signin",
  },
  providers,
  callbacks: {
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
  trustHost: true,
});

export { AuthError, CredentialsSignin };
