import type { ComponentType } from "react";
import { Link2, Link2Off } from "lucide-react";

import {
  configuredOAuthProviders,
  getOAuthNotice,
  type OAuthNotice,
  type OAuthProviderId,
} from "@/auth";
import {
  DiscordIcon,
  GitHubIcon,
  GoogleIcon,
  VKIcon,
} from "@/components/auth/provider-icons";
import { linkOAuthAction, unlinkOAuthAction } from "@/lib/actions/oauth-link";
import { prisma } from "@/lib/db";
import { getServerSession } from "@/lib/server-auth";
import { cn } from "@/lib/utils";

const ICONS: Record<OAuthProviderId, ComponentType<{ size?: number }>> = {
  google: GoogleIcon,
  github: GitHubIcon,
  discord: DiscordIcon,
  vk: VKIcon,
};

/**
 * Самостоятельный раздел настроек: сам читает сессию и список привязок.
 * Подключается как <OAuthLinks /> внутри уже существующего <Suspense>.
 */
export async function OAuthLinks({
  notice,
}: { notice?: OAuthNotice | null } = {}) {
  const session = await getServerSession();
  if (!session?.user?.id) return null;

  const providers = configuredOAuthProviders();
  if (providers.length === 0) return null;

  const [accounts, user, flashNotice] = await Promise.all([
    prisma.account.findMany({
      where: { userId: session.user.id },
      select: { provider: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        passwordHash: true,
        minecraftUsername: true,
        limboAuthId: true,
      },
    }),
    getOAuthNotice(),
  ]);

  const linked = new Set(accounts.map((account) => account.provider));
  const activeNotice = notice ?? flashNotice;
  const hasOtherLogin =
    Boolean(user?.passwordHash || user?.minecraftUsername || user?.limboAuthId) ||
    linked.size > 1;

  return (
    <section
      id="oauth"
      aria-labelledby="oauth-heading"
      className="scroll-mt-24 rounded-2xl border border-orange-100 bg-white p-6 shadow-sm"
    >
      <h2 id="oauth-heading" className="font-display text-lg text-stone-900">
        Привязка соцсетей
      </h2>
      <p className="mt-1.5 text-sm text-stone-600">
        Привяжите Google, GitHub, Discord или VK, чтобы входить на форум через удобный сервис.
        Отвязка последнего способа входа запрещена.
      </p>

      {activeNotice && (
        <p
          role={activeNotice.kind === "error" ? "alert" : "status"}
          className={cn(
            "mt-4 rounded-xl border px-4 py-2.5 text-sm",
            activeNotice.kind === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800",
          )}
        >
          {activeNotice.message}
        </p>
      )}

      <ul className="mt-4 space-y-2">
        {providers.map((provider) => {
          const Icon = ICONS[provider.id];
          const isLinked = linked.has(provider.id);
          const canUnlink = !isLinked || hasOtherLogin;

          return (
            <li
              key={provider.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50/60 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-white shadow-sm">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="font-semibold text-stone-900">{provider.label}</p>
                  <p
                    className={cn(
                      "text-xs font-medium",
                      isLinked ? "text-emerald-700" : "text-stone-500",
                    )}
                  >
                    {isLinked ? "Привязан" : "Не привязан"}
                  </p>
                </div>
              </div>

              <form
                action={
                  isLinked
                    ? unlinkOAuthAction.bind(null, provider.id)
                    : linkOAuthAction.bind(null, provider.id)
                }
              >
                <button
                  type="submit"
                  disabled={!canUnlink}
                  title={
                    canUnlink
                      ? undefined
                      : "Сначала задайте пароль или привяжите другой способ входа"
                  }
                  className={cn(
                    "focus-ring inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    isLinked
                      ? "border border-stone-200 bg-white text-stone-700 hover:border-red-300 hover:text-red-700"
                      : "bg-stone-900 text-amber-300 hover:bg-stone-800",
                  )}
                >
                  {isLinked ? (
                    <>
                      <Link2Off size={16} aria-hidden />
                      Отвязать
                    </>
                  ) : (
                    <>
                      <Link2 size={16} aria-hidden />
                      Привязать
                    </>
                  )}
                </button>
              </form>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-xs text-stone-500">
        Email из соцсети никогда не используется для автоматического связывания аккаунтов:
        привязка возможна только из авторизованной сессии.
      </p>
    </section>
  );
}
