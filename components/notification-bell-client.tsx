"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bell, CheckCheck, MessageSquarePlus, AtSign, CheckCircle2, Flag, Info } from "lucide-react";

import { markAllNotificationsReadAction } from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";

export interface BellItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  createdAt: string;
}

const TYPE_ICONS: Record<string, typeof MessageSquarePlus> = {
  reply: MessageSquarePlus,
  mention: AtSign,
  solution: CheckCircle2,
  report: Flag,
  system: Info,
  ticket: Info,
};

/** Колокольчик уведомлений: показывает счётчик и последние 5, ведёт на /notifications. */
export function NotificationBellClient({
  unreadCount,
  items,
}: {
  unreadCount: number;
  items: BellItem[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unreadCount > 0 ? `Уведомления: ${unreadCount} непрочитанных` : "Уведомления"}
        aria-expanded={open}
        className="focus-ring relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-stone-600 transition-colors hover:bg-orange-50 hover:text-orange-700"
      >
        <Bell size={20} aria-hidden />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Закрыть уведомления"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-label="Уведомления"
            className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-xl shadow-orange-900/10"
          >
            <div className="flex items-center justify-between border-b border-stone-100 px-4 py-2.5">
              <p className="text-sm font-semibold text-stone-900">Уведомления</p>
              <button
                type="button"
                disabled={isPending || unreadCount === 0}
                onClick={() =>
                  startTransition(async () => {
                    await markAllNotificationsReadAction();
                    setOpen(false);
                  })
                }
                className="focus-ring inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 transition-colors hover:text-orange-800 disabled:opacity-40"
              >
                <CheckCheck size={13} aria-hidden />
                Прочитать все
              </button>
            </div>

            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-stone-500">
                Пока пусто. Отвечайте и участвуйте — уведомления прилетят сюда.
              </p>
            ) : (
              <ul className="max-h-96 overflow-y-auto divide-y divide-stone-50">
                {items.map((item) => {
                  const Icon = TYPE_ICONS[item.type] ?? Info;
                  const row = (
                    <span className="flex items-start gap-2.5 px-4 py-2.5 transition-colors hover:bg-orange-50/60">
                      <Icon size={16} className="mt-0.5 shrink-0 text-orange-500" aria-hidden />
                      <span className="min-w-0">
                        <span className="line-clamp-2 text-xs font-medium leading-snug text-stone-800">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-stone-400">
                          {timeAgo(item.createdAt)}
                        </span>
                      </span>
                    </span>
                  );
                  return (
                    <li key={item.id}>
                      {item.link ? (
                        <Link href={item.link} onClick={() => setOpen(false)} className="block">
                          {row}
                        </Link>
                      ) : (
                        row
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="focus-ring block border-t border-stone-100 px-4 py-2.5 text-center text-xs font-semibold text-orange-700 transition-colors hover:bg-orange-50"
            >
              Все уведомления →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
