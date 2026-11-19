import Link from "next/link";
import Image from "next/image";
import { MessageCircle } from "lucide-react";

import {
  DISCORD_INVITE,
  MINECRAFT_HOST,
  SITE_NAME,
  YOUTUBE_CHANNEL_URL,
} from "@/lib/constants";
import { CopyIpButton } from "@/components/copy-ip-button";
import { CookieSettingsButton } from "@/components/cookie-settings-button";
import { getFooterColumns, getFooterTagline, getOperatorRequisites } from "@/lib/site-content";

/** Футер: тёплый тёмный блок; колонки, слоган и реквизиты редактируются в админке. */
export async function SiteFooter() {
  const [columns, tagline, requisites] = await Promise.all([
    getFooterColumns(),
    getFooterTagline(),
    getOperatorRequisites(),
  ]);

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
              {tagline}
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

          {columns.map((column) => (
            <nav
              key={column.title}
              aria-label={column.title}
              className="md:col-span-2"
            >
              <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-200/80">
                {column.title}
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {column.links.map((link) => (
                  <li key={link.href}>
                    {link.href.startsWith("http") ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-amber-50 underline-offset-2 hover:underline"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="hover:text-amber-50 underline-offset-2 hover:underline"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="md:col-span-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-200/80">
              Данные
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <CookieSettingsButton className="focus-ring text-left hover:text-amber-50 underline-offset-2 hover:underline" />
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-amber-100/10 pt-6 text-xs leading-relaxed text-orange-100/60">
          <p>
            © 2026 {SITE_NAME} · DENDOR. Все права защищены. «Minecraft» является товарным
            знаком Mojang Studios. Проект не связан с Mojang или Microsoft.
          </p>
          <p className="mt-2">
            Оператор персональных данных: {requisites.name}. {requisites.address.includes("Заполняется") ? null : `${requisites.address}.`} Реквизиты:{" "}
            <Link href="/legal/requisites" className="underline underline-offset-2 hover:text-amber-50">
              /legal/requisites
            </Link>
            . Вопросы по данным:{" "}
            <a href={`mailto:${requisites.emailPrivacy}`} className="underline underline-offset-2 hover:text-amber-50">
              {requisites.emailPrivacy}
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
