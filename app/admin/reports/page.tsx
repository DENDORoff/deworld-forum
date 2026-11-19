import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Flag } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { timeAgo } from "@/lib/utils";
import { ReportActionButtons, ReportStatusBadge } from "@/components/admin/report-actions";

export default function AdminReportsPage() {
  return (
    <Suspense fallback={<div className="skeleton h-96 rounded-2xl" />}>
      <AdminReportsContent />
    </Suspense>
  );
}

interface TargetInfo {
  title: string;
  href: string | null;
}

async function loadTargets(
  reports: Array<{ targetType: string; targetId: string }>,
): Promise<Map<string, TargetInfo>> {
  const topicIds = reports.filter((r) => r.targetType === "TOPIC").map((r) => r.targetId);
  const postIds = reports.filter((r) => r.targetType === "POST").map((r) => r.targetId);
  const userIds = reports.filter((r) => r.targetType === "USER").map((r) => r.targetId);

  const [topics, posts, users] = await Promise.all([
    topicIds.length
      ? prisma.topic.findMany({ where: { id: { in: topicIds } }, select: { id: true, title: true, slug: true } })
      : [],
    postIds.length
      ? prisma.post.findMany({
          where: { id: { in: postIds } },
          select: { id: true, topic: { select: { slug: true } } },
        })
      : [],
    userIds.length
      ? prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, username: true, name: true },
        })
      : [],
  ]);

  const map = new Map<string, TargetInfo>();
  for (const t of topics) {
    map.set(`TOPIC:${t.id}`, { title: t.title, href: `/forum/topic/${t.slug}` });
  }
  for (const p of posts) {
    map.set(`POST:${p.id}`, { title: "Ответ на форуме", href: `/forum/topic/${p.topic.slug}#post-${p.id}` });
  }
  for (const u of users) {
    map.set(`USER:${u.id}`, {
      title: u.name ?? u.username ?? "Пользователь",
      href: u.username ? `/profile/${u.username}` : null,
    });
  }
  return map;
}

async function AdminReportsContent() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "MODERATOR")) redirect("/");

  const reports = await prisma.report.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 60,
    include: { reporter: { select: { username: true, name: true } } },
  });

  const targets = await loadTargets(reports);
  const open = reports.filter((r) => r.status === "OPEN" || r.status === "IN_REVIEW");
  const closed = reports.filter((r) => r.status === "RESOLVED" || r.status === "REJECTED");

  const renderReport = (report: (typeof reports)[number]) => {
    const key = `${report.targetType}:${report.targetId}`;
    const target = targets.get(key);
    const title = target?.title ?? `${report.targetType} ${report.targetId.slice(0, 12)}…`;
    return (
      <li key={report.id} className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <ReportStatusBadge status={report.status} />
              <span className="text-xs uppercase tracking-wide text-stone-400">
                {report.targetType}
              </span>
              <span className="text-xs text-stone-400">· {timeAgo(report.createdAt)}</span>
            </p>
            <p className="mt-1.5 font-medium text-stone-900">
              {target?.href ? (
                <Link href={target.href} className="hover:text-orange-800 hover:underline">
                  {title}
                </Link>
              ) : (
                title
              )}
            </p>
            <p className="mt-1 text-sm leading-snug text-stone-600">{report.reason}</p>
            <p className="mt-1 text-xs text-stone-400">
              От: {report.reporter.name ?? report.reporter.username ?? "аноним"}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-stone-50 pt-3">
          <ReportActionButtons reportId={report.id} />
          {report.resolution && (
            <p className="text-xs text-stone-500">Решение: {report.resolution}</p>
          )}
        </div>
      </li>
    );
  };

  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
        <Flag size={14} aria-hidden /> Модерация
      </p>
      <h1 className="mt-1 font-display text-2xl text-stone-900">Жалобы</h1>
      <p className="mt-1 text-sm text-stone-500">
        Открыто: {open.length} · Всего загружено: {reports.length}
      </p>

      {open.length > 0 && (
        <ul className="mt-6 space-y-3">{open.map(renderReport)}</ul>
      )}

      {open.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-10 text-center">
          <p className="font-semibold text-emerald-900">Открытых жалоб нет</p>
          <p className="mt-1 text-sm text-emerald-800/80">Чистое поле — можно выдохнуть.</p>
        </div>
      )}

      {closed.length > 0 && (
        <details className="mt-6">
          <summary className="focus-ring cursor-pointer rounded-xl px-2 py-2 text-sm font-semibold text-stone-500 hover:text-stone-800">
            Закрытые жалобы ({closed.length})
          </summary>
          <ul className="mt-3 space-y-3 opacity-75">{closed.map(renderReport)}</ul>
        </details>
      )}
    </div>
  );
}
