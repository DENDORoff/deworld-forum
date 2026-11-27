import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  Bot,
  Flag,
  FolderCog,
  LayoutDashboard,
  LayoutList,
  MessagesSquare,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Админ-панель",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Обзор", icon: LayoutDashboard },
  { href: "/admin/categories", label: "Разделы форума", icon: FolderCog },
  { href: "/admin/topics", label: "Темы", icon: MessagesSquare },
  { href: "/admin/reports", label: "Жалобы", icon: Flag },
  { href: "/admin/users", label: "Пользователи", icon: Users },
  { href: "/admin/settings", label: "Настройки сайта", icon: Settings },
  { href: "/admin/content", label: "Контент сайта", icon: LayoutList },
  { href: "/admin/bots", label: "Боты для логов", icon: Bot },
  { href: "/admin/logs", label: "Логи", icon: ScrollText },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-12">
        <aside className="min-w-0 lg:col-span-3 xl:col-span-2">
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm lg:sticky lg:top-20">
            <Link
              href="/"
              className="focus-ring flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-orange-800"
            >
              <ArrowLeft size={14} aria-hidden />
              На сайт
            </Link>
            <p className="mt-3 px-1 font-display text-sm uppercase tracking-wider text-stone-800">
              Админ-панель
            </p>
            <nav aria-label="Разделы админки" className="mt-2">
              <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
                {NAV.map((item) => (
                  <li key={item.href} className="shrink-0">
                    <Link
                      href={item.href}
                      className="focus-ring flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-orange-50 hover:text-orange-900"
                    >
                      <item.icon size={16} aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>
        <div className="min-w-0 lg:col-span-9 xl:col-span-10">{children}</div>
      </div>
    </div>
  );
}
