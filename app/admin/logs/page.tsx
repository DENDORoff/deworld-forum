import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { getServerSession } from "@/lib/server-auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

export default function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return (
    <Suspense fallback={<div className="skeleton h-96 rounded-2xl" />}>
      <AdminLogsContent searchParams={searchParams} />
    </Suspense>
  );
}

const PAGE_SIZE = 40;

async function AdminLogsContent({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getServerSession();
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "MODERATOR")) redirect("/");

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { username: true, name: true } } },
    }),
    prisma.auditLog.count(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="font-display text-2xl text-stone-900">Журнал действий</h1>
      <p className="mt-1 text-sm text-stone-500">
        Все важные операции: создание тем, модерация, изменения настроек и ролей. Всего записей: {total}.
      </p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-100 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-stone-100 bg-stone-50/60 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Время</th>
              <th className="px-4 py-3 font-semibold">Действие</th>
              <th className="px-4 py-3 font-semibold">Кто</th>
              <th className="px-4 py-3 font-semibold">Цель</th>
              <th className="px-4 py-3 font-semibold">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {logs.map((log) => (
              <tr key={log.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-2.5 text-xs text-stone-500">
                  {formatDateTime(log.createdAt)}
                </td>
                <td className="px-4 py-2.5">
                  <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[11px] text-stone-700">
                    {log.action}
                  </code>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-stone-700">
                  {log.user ? `@${log.user.username ?? log.user.name}` : "система"}
                </td>
                <td className="max-w-56 truncate px-4 py-2.5 text-xs text-stone-500" title={log.targetId ?? ""}>
                  {log.targetType ? `${log.targetType}: ` : ""}
                  {log.targetId ?? "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] text-stone-400">
                  {log.ip ?? "—"}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                  Записей пока нет.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav aria-label="Страницы логов" className="mt-4 flex items-center justify-center gap-2">
          {page > 1 && (
            <a href={`/admin/logs?page=${page - 1}`} className="focus-ring rounded-xl border border-stone-200 p-2 hover:bg-stone-50" aria-label="Предыдущая">
              <ChevronRight size={17} className="rotate-180" />
            </a>
          )}
          <span className="text-sm text-stone-600">{page} / {totalPages}</span>
          {page < totalPages && (
            <a href={`/admin/logs?page=${page + 1}`} className="focus-ring rounded-xl border border-stone-200 p-2 hover:bg-stone-50" aria-label="Следующая">
              <ChevronRight size={17} />
            </a>
          )}
        </nav>
      )}
    </div>
  );
}
