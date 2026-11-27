import type { ComponentType } from "react";

import { configuredOAuthProviders, type OAuthProviderId } from "@/auth";
import { oauthSignInAction } from "@/lib/actions/auth";
import {
  DiscordIcon,
  GitHubIcon,
  GoogleIcon,
  VKIcon,
} from "@/components/auth/provider-icons";

const ICONS: Record<OAuthProviderId, ComponentType<{ size?: number }>> = {
  google: GoogleIcon,
  github: GitHubIcon,
  discord: DiscordIcon,
  vk: VKIcon,
};

/** Кнопки входа через внешние сервисы. Показываем только настроенные провайдеры. */
export function OAuthButtons({ callbackUrl }: { callbackUrl: string }) {
  const providers = configuredOAuthProviders();

  if (providers.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-stone-400">
        <span className="h-px flex-1 bg-stone-200" aria-hidden />
        или войти через
        <span className="h-px flex-1 bg-stone-200" aria-hidden />
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-2">
        {providers.map((provider) => {
          const Icon = ICONS[provider.id];
          const highlight = provider.id === "discord";
          return (
            <li key={provider.id}>
              <form action={oauthSignInAction.bind(null, provider.id, callbackUrl)}>
                <button
                  type="submit"
                  className={`focus-ring flex h-12 w-full items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors ${
                    highlight
                      ? "border-[#5865F2]/40 bg-[#5865F2]/10 text-[#4752c4] hover:bg-[#5865F2]/20"
                      : "border-stone-200 bg-white text-stone-800 hover:border-orange-300 hover:text-orange-900"
                  }`}
                >
                  <Icon size={18} />
                  {provider.label}
                </button>
              </form>
            </li>
          );
        })}
      </ul>
      {providers.some((provider) => provider.id === "discord") && (
        <p className="mt-2 text-center text-xs text-stone-500">
          Discord-вход также синхронизирует ваш аккаунт с сервером сообщества.
        </p>
      )}
    </div>
  );
}
