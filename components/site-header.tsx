import Link from "next/link";
import Image from "next/image";
import { connection } from "next/server";
import { Crown, LogOut, ShieldCheck } from "lucide-react";

import { auth, signOut } from "@/auth";
import { isPremiumActive } from "@/lib/utils";
import { DISCORD_INVITE } from "@/lib/constants";
import { Logo } from "@/components/logo";
import { MobileNav, type NavLink } from "@/components/mobile-nav";

const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Главная" },
  { href: "/forum", label: "Форум" },
  { href: "/forum/rules", label: "Правила" },
  { href: "/premium", label: "Премиум" },
];

/**
 * Липкая шапка: остаётся на месте при прокрутке (position: sticky),
 * полупрозрачная с блюром. Рендерится на сервере с учётом сессии.
 */
export async function SiteHeader() {
  // Явный запрос серверного рендера: сессия всегда читается в рантайме
  await connection();
  const session = await auth();
  const user = session?.user;
  const premium = user ? isPremiumActive({ premiumUntil: user.premiumUntil }) : false;
  const isStaff = user?.role === "MODERATOR" || user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-50 border-b border-orange-100/80 bg-white/85 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo />

        <nav aria-label="Основная навигация" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="focus-ring rounded-lg px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-orange-50 hover:text-stone-900"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={DISCORD_INVITE}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring rounded-lg px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-orange-50 hover:text-stone-900"
          >
            Discord
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {isStaff && (
                <Link
                  href="/admin"
                  title="Админ-панель"
                  aria-label="Админ-панель"
                  className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-xl text-stone-600 transition-colors hover:bg-orange-50 hover:text-orange-700"
                >
                  <ShieldCheck size={20} aria-hidden />
                </Link>
              )}
              <Link
                href={user.username ? `/profile/${user.username}` : "/settings"}
                className="focus-ring flex items-center gap-2 rounded-xl py-1.5 pl-1.5 pr-2 transition-colors hover:bg-orange-50"
              >
                <Image
                  src={user.image ?? "/brand/dendor-avatar.jpg"}
                  alt=""
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-lg object-cover ring-1 ring-orange-200"
                />
                <span className="hidden max-w-36 truncate text-sm font-semibold text-stone-800 sm:block">
                  {user.name ?? user.username ?? "Профиль"}
                </span>
                {premium && (
                  <Crown
                    size={16}
                    className="hidden text-amber-500 sm:block"
                    aria-label="Премиум"
                  />
                )}
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  title="Выйти"
                  aria-label="Выйти"
                  className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-xl text-stone-500 transition-colors hover:bg-orange-50 hover:text-stone-800"
                >
                  <LogOut size={19} aria-hidden />
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className="focus-ring hidden rounded-xl px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:bg-orange-50 sm:inline-flex"
              >
                Войти
              </Link>
              <Link
                href="/signup"
                className="focus-ring inline-flex items-center rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-orange-500/30 transition-colors hover:bg-orange-600"
              >
                Регистрация
              </Link>
            </>
          )}
          <MobileNav links={[...NAV_LINKS, { href: "/signin", label: "Войти" }]} />
        </div>
      </div>
    </header>
  );
}
