import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ChevronRight, Pin } from "lucide-react";

import { getServerSession } from "@/lib/server-auth";
import { prisma } from "@/lib/db";
import { timeAgo } from "@/lib/utils";
import { TopicActions } from "@/components/topic-actions";

export default function AdminTopicsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return (
    <Suspense fallback={<div className="skeleton h-96 rounded-2xl" />}>
      <AdminTopicsContent searchParams={searchParams} />
    </Suspense>
  );
}

const PAGE_SIZE = 30;

async function AdminTopicsContent({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getServerSession();
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "MODERATOR")) redirect("/");

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [topics, total] = await Promise.all([
    prisma.topic.findMany({
      orderBy: { lastPostAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        slug: true,
        title: true,
        pinned: true,
        locked: true,
        replyCount: true,
        views: true,
        lastPostAt: true,
        category: { select: { name: true } },
        author: { select: { username: true, name: true } },
      },
    }),
    prisma.topic.count(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="font-display text-2xl text-stone-900">Темы</h1>
      <p className="mt-1 text-sm text-stone-500">
        Свежие {topics.length} из {total} тем. Закрепление важных анонсов и закрытие решённых
        обсуждений — здесь.
      </p>

      <ul className="mt-6 divide-y divide-stone-100 rounded-2xl border border-stone-100 bg-white shadow-sm">
        {topics.map((topic) => (
          <li key={topic.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <Link
                href={`/forum/topic/${topic.slug}`}
                className="focus-ring flex min-w-0 items-center gap-2 font-medium text-stone-900 hover:text-orange-900"
              >
                {topic.pinned && <Pin size={13} className="shrink-0 text-orange-500" aria-hidden />}
                <span className="truncate">{topic.title}</span>
              </Link>
              <p className="mt-0.5 text-xs text-stone-500">
                {topic.category.name} · {topic.author.name ?? topic.author.username ?? "anon"} ·{" "}
                {timeAgo(topic.lastPostAt)} · {topic.replyCount} ответов · {topic.views} просмотров
              </p>
            </div>
            <TopicActions
              topicId={topic.id}
              locked={topic.locked}
              pinned={topic.pinned}
              isStaff
              canDelete
            />
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <nav aria-label="Страницы тем" className="mt-4 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={`/admin/topics?page=${page - 1}`} className="focus-ring rounded-xl border border-stone-200 p-2 text-stone-600 hover:bg-stone-50" aria-label="Предыдущая">
              <ChevronRight size={17} className="rotate-180" />
            </Link>
          )}
          <span className="text-sm text-stone-600">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/admin/topics?page=${page + 1}`} className="focus-ring rounded-xl border border-stone-200 p-2 text-stone-600 hover:bg-stone-50" aria-label="Следующая">
              <ChevronRight size={17} />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
