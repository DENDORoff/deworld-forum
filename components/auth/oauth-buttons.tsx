import { Gamepad2 } from "lucide-react";

import { oauthSignInAction } from "@/lib/actions/auth";
import { GitHubIcon, GoogleIcon } from "@/components/auth/provider-icons";

/** Кнопки входа через внешние сервисы. Показываем только настроенные провайдеры. */
export function OAuthButtons({ callbackUrl }: { callbackUrl: string }) {
  const providers = [
    { id: "google", label: "Google", icon: GoogleIcon, enabled: Boolean(process.env.AUTH_GOOGLE_ID) },
    { id: "github", label: "GitHub", icon: GitHubIcon, enabled: Boolean(process.env.AUTH_GITHUB_ID) },
    {
      id: "discord",
      label: "Discord",
      icon: Gamepad2,
      enabled: Boolean(process.env.AUTH_DISCORD_ID),
      highlight: true,
    },
    {
      id: "vk",
      label: "VK",
      icon: null,
      enabled: Boolean(process.env.AUTH_VK_ID),
    },
  ].filter((provider) => provider.enabled);

  if (providers.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-stone-400">
        <span className="h-px flex-1 bg-stone-200" aria-hidden />
        или войти через
        <span className="h-px flex-1 bg-stone-200" aria-hidden />
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-2">
        {providers.map((provider) => (
          <li key={provider.id}>
            <form action={oauthSignInAction.bind(null, provider.id, callbackUrl)}>
              <button
                type="submit"
                className={`focus-ring flex h-12 w-full items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors ${
                  provider.highlight
                    ? "border-[#5865F2]/40 bg-[#5865F2]/10 text-[#4752c4] hover:bg-[#5865F2]/20"
                    : "border-stone-200 bg-white text-stone-800 hover:border-orange-300 hover:text-orange-900"
                }`}
              >
                {provider.icon ? <provider.icon size={18} aria-hidden /> : <span className="font-display text-base font-bold">VK</span>}
                {provider.label}
              </button>
            </form>
          </li>
        ))}
      </ul>
      {Boolean(process.env.AUTH_DISCORD_ID) && (
        <p className="mt-2 text-center text-xs text-stone-500">
          Discord-вход также синхронизирует ваш аккаунт с сервером сообщества.
        </p>
      )}
    </div>
  );
}
