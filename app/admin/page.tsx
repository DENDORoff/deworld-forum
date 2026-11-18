import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  Crown,
  FileText,
  Flag,
  MessagesSquare,
  Users,
  ArrowRight,
} from "lucide-react";

import { getServerSession } from "@/lib/server-auth";
import { prisma } from "@/lib/db";
import { timeAgo } from "@/lib/utils";

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminDashboardSkeleton />}>
      <AdminDashboard />
    </Suspense>
  );
}

async function AdminDashboard() {
  const session = await getServerSession();
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "MODERATOR")) {
    redirect("/");
  }

  const [
    userCount,
    premiumCount,
    topicCount,
    postCount,
    openReports,
    recentLogs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { premiumUntil: { gt: new Date() } } }),
    prisma.topic.count(),
    prisma.post.count(),
    prisma.report.count({ where: { status: { in: ["OPEN", "IN_REVIEW"] } } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { username: true, name: true } } },
    }),
  ]);

  const stats = [
    { label: "Участников", value: userCount, icon: Users, href: "/admin/users" },
    { label: "Премиум-подписок", value: premiumCount, icon: Crown, href: "/admin/users" },
    { label: "Тем на форуме", value: topicCount, icon: MessagesSquare, href: "/admin/topics" },
    { label: "Сообщений", value: postCount + topicCount, icon: FileText, href: "/admin/topics" },
    { label: "Открытых жалоб", value: openReports, icon: Flag, href: "/admin/logs" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl text-stone-900">Обзор</h1>
      <p className="mt-1 text-sm text-stone-500">
        Привет, {session.user.name ?? session.user.username}. Вот что происходит на DEWORLD.
      </p>

      {/* Статистика */}
      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="focus-ring group rounded-2xl border border-stone-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <stat.icon size={18} className="text-orange-500" aria-hidden />
            <dd className="mt-2 font-display text-2xl text-stone-900">{stat.value}</dd>
            <dt className="text-[11px] leading-tight text-stone-500">{stat.label}</dt>
          </Link>
        ))}
      </dl>

      <div className="mt-8 grid gap-6 xl:grid-cols-5">
        {/* Последние действия */}
        <section aria-labelledby="recent-actions" className="xl:col-span-3">
          <div className="flex items-center justify-between">
            <h2 id="recent-actions" className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
              Последние действия
            </h2>
            <Link
              href="/admin/logs"
              className="focus-ring inline-flex items-center gap-1 text-xs font-semibold text-orange-700 hover:underline"
            >
              Все логи <ArrowRight size={12} />
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-stone-100 rounded-2xl border border-stone-100 bg-white shadow-sm">
            {recentLogs.length === 0 && (
              <li className="px-5 py-6 text-center text-sm text-stone-500">
                Действий пока не зафиксировано.
              </li>
            )}
            {recentLogs.map((log) => (
              <li key={log.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <code className="shrink-0 rounded-md bg-stone-100 px-2 py-0.5 font-mono text-[11px] text-stone-700">
                  {log.action}
                </code>
                <span className="min-w-0 flex-1 truncate text-stone-600">
                  {log.user ? `@${log.user.username ?? log.user.name}` : "система"}
                  {log.targetId ? ` → ${log.targetId.slice(0, 40)}` : ""}
                </span>
                <span className="shrink-0 text-xs text-stone-400">{timeAgo(log.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Быстрые действия */}
        <section aria-labelledby="quick-actions" className="xl:col-span-2">
          <h2 id="quick-actions" className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            Быстрые действия
          </h2>
          <ul className="mt-3 space-y-2">
            {[
              { href: "/admin/categories", label: "Управлять разделами форума" },
              { href: "/admin/settings", label: "Обновить анонс и преимущества премиума" },
              { href: "/admin/topics", label: "Модерация тем: закрепить, закрыть, удалить" },
              { href: "/admin/users", label: "Выдать премиум или сменить роли" },
            ].map((action) => (
              <li key={action.href}>
                <Link
                  href={action.href}
                  className="focus-ring flex items-center justify-between gap-2 rounded-xl border border-stone-100 bg-white px-4 py-3 text-sm font-medium text-stone-700 shadow-sm transition-colors hover:border-orange-200 hover:text-orange-900"
                >
                  {action.label}
                  <ArrowRight size={15} className="shrink-0 text-stone-400" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function AdminDashboardSkeleton() {
  return (
    <div aria-hidden>
      <div className="skeleton h-8 w-40" />
      <div className="skeleton mt-2 h-5 w-72" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="skeleton h-24 rounded-2xl" />
        ))}
      </div>
      <div className="skeleton mt-6 h-72 rounded-2xl" />
    </div>
  );
}
