"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavItem } from "@/lib/site-content";
import { DISCORD_INVITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Навигация шапки: подсвечивает активную страницу (по usePathname). */
export function SiteNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav aria-label="Основная навигация" className="hidden items-center gap-1 lg:flex">
      {items.map((item) => {
        const active = isActive(item.href);
        const external = item.href.startsWith("http");
        const common = cn(
          "focus-ring rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-orange-100 text-orange-900"
            : "text-stone-700 hover:bg-orange-50 hover:text-stone-900",
        );
        return external ? (
          <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className={common}>
            {item.label}
          </a>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={common}
          >
            {item.label}
          </Link>
        );
      })}
      <a
        href={DISCORD_INVITE}
        target="_blank"
        rel="noopener noreferrer"
        className="focus-ring rounded-lg px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-orange-50 hover:text-stone-900"
      >
        Discord
      </a>
    </nav>
  );
}
