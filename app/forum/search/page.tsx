import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { ChevronRight, Lock, Pin, Search } from "lucide-react";

import { getServerSession } from "@/lib/server-auth";
import { prisma } from "@/lib/db";
import { topicVisibilityWhere } from "@/lib/forum-visibility";
import { plural, timeAgo } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Поиск по форуму",
  description: "Поиск тем и ответов на форуме DEWORLD.",
  robots: { index: false, follow: true },
};

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchContent searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim().slice(0, 120);

  const session = await getServerSession();
  const viewer = session?.user
    ? { role: session.user.role, premiumUntil: session.user.premiumUntil }
    : null;

  const topics =
    query.length >= 3
      ? await prisma.topic.findMany({
          where: {
            ...topicVisibilityWhere(viewer),
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { content: { contains: query, mode: "insensitive" } },
            ],
          },
          orderBy: { lastPostAt: "desc" },
          take: 30,
          select: {
            slug: true,
            title: true,
            replyCount: true,
            views: true,
            locked: true,
            pinned: true,
            lastPostAt: true,
            category: { select: { name: true, slug: true } },
          },
        })
      : [];

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <nav aria-label="Хлебные крошки" className="flex items-center gap-1.5 text-sm text-stone-500">
        <Link href="/forum" className="hover:text-orange-800">
          Форум
        </Link>
        <ChevronRight size={14} aria-hidden />
        <span aria-current="page" className="text-stone-800">
          Поиск
        </span>
      </nav>

      <h1 className="mt-4 font-display text-2xl text-stone-900 sm:text-3xl">Поиск по форуму</h1>

      <form action="/forum/search" method="get" role="search" className="mt-5 flex">
        <label htmlFor="search-input" className="sr-only">
          Поисковый запрос
        </label>
        <input
          id="search-input"
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Минимум 3 символа…"
          maxLength={120}
          autoFocus
          className="focus-ring h-12 w-full rounded-l-xl border border-r-0 border-stone-200 bg-white px-4 text-base placeholder:text-stone-400"
        />
        <button
          type="submit"
          aria-label="Найти"
          className="focus-ring h-12 rounded-r-xl border border-orange-500 bg-orange-500 px-5 text-white transition-colors hover:bg-orange-600"
        >
          <Search size={20} aria-hidden />
        </button>
      </form>

      <div className="mt-6">
        {query.length === 0 ? (
          <p className="text-stone-500">Введите запрос, чтобы найти темы и ответы.</p>
        ) : query.length < 3 ? (
          <p className="text-stone-500">Слишком короткий запрос — минимум 3 символа.</p>
        ) : topics.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 p-10 text-center">
            <p className="font-semibold text-stone-800">Ничего не нашлось по «{query}»</p>
            <p className="mt-1 text-sm text-stone-600">
              Попробуйте другие слова или создайте тему — сообщество поможет.
            </p>
            <Link
              href="/forum/new"
              className="focus-ring mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Создать тему
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-stone-500" aria-live="polite">
              Найдено: {topics.length}
            </p>
            <ul className="mt-3 divide-y divide-stone-100 border-y border-stone-100">
              {topics.map((topic) => (
                <li key={topic.slug}>
                  <Link
                    href={`/forum/topic/${topic.slug}`}
                    className="focus-ring block py-4 transition-colors hover:bg-orange-50/50"
                  >
                    <span className="flex items-center gap-2">
                      {topic.pinned && <Pin size={13} className="text-orange-500" aria-hidden />}
                      {topic.locked && <Lock size={13} className="text-stone-400" aria-hidden />}
                      <span className="truncate font-medium text-stone-900">{topic.title}</span>
                    </span>
                    <span className="mt-0.5 block text-xs text-stone-500">
                      {topic.category.name} · {plural(topic.replyCount, "ответ", "ответа", "ответов")} ·{" "}
                      {topic.views} просмотров · обновлена {timeAgo(topic.lastPostAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

function SearchSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6" aria-hidden>
      <div className="skeleton h-9 w-56" />
      <div className="skeleton mt-5 h-12 w-full" />
      <div className="mt-6 space-y-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
