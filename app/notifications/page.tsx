import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  AtSign,
  Bell,
  CheckCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  Info,
  MessageSquarePlus,
} from "lucide-react";

import { getServerSession } from "@/lib/server-auth";
import { prisma } from "@/lib/db";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/lib/actions/notifications";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Уведомления",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 20;

const TYPE_ICONS: Record<string, typeof Info> = {
  reply: MessageSquarePlus,
  mention: AtSign,
  solution: CheckCircle2,
  report: Flag,
  system: Info,
  ticket: Info,
};

export default function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return (
    <Suspense fallback={<NotificationsSkeleton />}>
      <NotificationsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function NotificationsContent({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/notifications");

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const userId = session.user.id;

  const [items, total, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-orange-100 pb-5">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
            <Bell size={14} aria-hidden /> Уведомления
          </p>
          <h1 className="mt-1 font-display text-2xl text-stone-900">
            {unread > 0 ? `${unread} непрочитанных` : "Всё прочитано"}
          </h1>
        </div>
        {unread > 0 && (
          <form action={markAllNotificationsReadAction}>
            <button
              type="submit"
              className="focus-ring inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:border-orange-300 hover:text-orange-800"
            >
              <CheckCheck size={16} aria-hidden />
              Отметить все прочитанными
            </button>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 p-12 text-center">
          <Bell size={32} className="mx-auto text-orange-300" aria-hidden />
          <p className="mt-3 font-semibold text-stone-800">Пока пусто</p>
          <p className="mt-1 text-sm text-stone-600">
            Ответы на ваши темы, упоминания и решения обсуждений будут появляться здесь.
          </p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-stone-100 border-y border-stone-100">
          {items.map((item) => {
            const Icon = TYPE_ICONS[item.type] ?? Info;
            const content = (
              <span className="flex items-start gap-3 py-3.5 pl-2 transition-colors hover:bg-orange-50/50">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    item.read ? "bg-stone-100 text-stone-400" : "bg-orange-100 text-orange-600"
                  }`}
                >
                  <Icon size={17} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-sm leading-snug ${
                      item.read ? "text-stone-500" : "font-medium text-stone-900"
                    }`}
                  >
                    {item.title}
                  </span>
                  {item.body && (
                    <span className="mt-0.5 line-clamp-2 block text-xs text-stone-500">
                      {item.body}
                    </span>
                  )}
                  <span className="mt-1 block text-[10px] uppercase tracking-wide text-stone-400">
                    {timeAgo(item.createdAt)}
                  </span>
                </span>
                {!item.read && (
                  <form action={markNotificationReadAction.bind(null, item.id)}>
                    <button
                      type="submit"
                      title="Отметить прочитанным"
                      aria-label="Отметить прочитанным"
                      className="focus-ring rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-orange-100 hover:text-orange-700"
                    >
                      <CheckCheck size={17} />
                    </button>
                  </form>
                )}
              </span>
            );
            return (
              <li key={item.id}>
                {item.link ? (
                  <Link href={item.link} className="focus-ring block">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <nav aria-label="Страницы уведомлений" className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={`/notifications?page=${page - 1}`} className="focus-ring rounded-xl border border-stone-200 p-2.5 text-stone-600 hover:bg-stone-50" aria-label="Предыдущая страница">
              <ChevronLeft size={17} />
            </Link>
          )}
          <span className="px-2 text-sm text-stone-600">{page} / {totalPages}</span>
          {page < totalPages && (
            <Link href={`/notifications?page=${page + 1}`} className="focus-ring rounded-xl border border-stone-200 p-2.5 text-stone-600 hover:bg-stone-50" aria-label="Следующая страница">
              <ChevronRight size={17} />
            </Link>
          )}
        </nav>
      )}

      <p className="mt-6 text-center text-xs text-stone-400">
        Управлять email-уведомлениями можно в{" "}
        <Link href="/settings" className="underline underline-offset-2 hover:text-orange-800">
          настройках
        </Link>
        {" "}(скоро здесь). Пока письма приходят только о важных событиях.
      </p>
    </section>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6" aria-hidden>
      <div className="skeleton h-5 w-40" />
      <div className="skeleton mt-2 h-9 w-56" />
      <div className="mt-6 divide-y divide-stone-100">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex gap-3 py-3.5">
            <div className="skeleton h-9 w-9 rounded-xl" />
            <div className="flex-1">
              <div className="skeleton h-4 w-2/3" />
              <div className="skeleton mt-2 h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
