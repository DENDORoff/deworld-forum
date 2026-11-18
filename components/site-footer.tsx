import Link from "next/link";
import Image from "next/image";
import { MessageCircle } from "lucide-react";

import { DISCORD_INVITE, MINECRAFT_HOST, SITE_NAME, SITE_TAGLINE, YOUTUBE_CHANNEL_URL } from "@/lib/constants";
import { CopyIpButton } from "@/components/copy-ip-button";
import { CookieSettingsButton } from "@/components/cookie-settings-button";

const DOCUMENT_LINKS = [
  { href: "/legal/privacy", label: "Политика конфиденциальности" },
  { href: "/legal/terms", label: "Условия использования" },
  { href: "/legal/refund", label: "Политика возврата средств" },
  { href: "/legal/cookies", label: "Политика использования Cookie" },
  { href: "/legal/consent", label: "Согласие на обработку ПДн" },
  { href: "/legal/requisites", label: "Реквизиты и данные оператора" },
];

const PROJECT_LINKS = [
  { href: "/", label: "Главная" },
  { href: "/forum", label: "Форум" },
  { href: "/forum/rules", label: "Правила форума" },
  { href: "/premium", label: "Премиум" },
];

/** Футер: тёмная тёплый панель, навигация, юридические документы, реквизиты. */
export function SiteFooter() {
  return (
    <footer className="bg-[#201405] text-orange-100/85">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <Link href="/" className="focus-ring inline-flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-black ring-1 ring-amber-400/20">
                <Image
                  src="/brand/dw-wordmark.webp"
                  alt=""
                  width={40}
                  height={40}
                  className="h-9 w-9 object-contain"
                />
              </span>
              <span className="font-display text-xl text-amber-50">
                DE<span className="text-orange-400">WORLD</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-orange-100/70">
              {SITE_TAGLINE}. Сообщество, форум и события проекта.
            </p>
            <CopyIpButton ip={MINECRAFT_HOST} dark className="mt-4" />
            <div className="mt-4 flex items-center gap-2 text-xs text-orange-100/60">
              <MessageCircle size={14} aria-hidden />
              <a
                href={DISCORD_INVITE}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-amber-50 underline-offset-2 hover:underline"
              >
                Сообщество в Discord
              </a>
              <span aria-hidden>·</span>
              <a
                href={YOUTUBE_CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-amber-50 underline-offset-2 hover:underline"
              >
                YouTube-канал
              </a>
            </div>
          </div>

          <nav aria-label="Разделы проекта" className="md:col-span-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-200/80">
              Проект
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {PROJECT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-amber-50 underline-offset-2 hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Документы" className="md:col-span-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-200/80">
              Документы
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {DOCUMENT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-amber-50 underline-offset-2 hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-200/80">
              Данные и права
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/legal/privacy#delete-request"
                  className="hover:text-amber-50 underline-offset-2 hover:underline"
                >
                  Запросить удаление данных
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/privacy#access-request"
                  className="hover:text-amber-50 underline-offset-2 hover:underline"
                >
                  Запросить копию своих данных
                </Link>
              </li>
              <li>
                <CookieSettingsButton className="focus-ring text-left hover:text-amber-50 underline-offset-2 hover:underline" />
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-amber-100/10 pt-6 text-xs leading-relaxed text-orange-100/60">
          <p>
            © 2026 {SITE_NAME} · DENDOR. Все права защищены.
            «Minecraft» является товарным знаком Mojang Studios. Проект не связан с Mojang
            или Microsoft.
          </p>
          <p className="mt-2">
            Оператор персональных данных: DENDOR (данные в{" "}
            <Link href="/legal/requisites" className="underline underline-offset-2 hover:text-amber-50">
              реквизитах
            </Link>
            ). Регистрация и использование сайта возможны только при согласии с{" "}
            <Link href="/legal/terms" className="underline underline-offset-2 hover:text-amber-50">
              условиями использования
            </Link>{" "}
            и{" "}
            <Link href="/legal/consent" className="underline underline-offset-2 hover:text-amber-50">
              политикой конфиденциальности
            </Link>
            . Возрастное ограничение: 14+.
          </p>
        </div>
      </div>
    </footer>
  );
}
