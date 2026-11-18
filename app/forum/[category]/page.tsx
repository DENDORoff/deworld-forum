import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Lock,
  MessagesSquare,
  Pin,
  Plus,
} from "lucide-react";
import { notFound } from "next/navigation";

import { getServerSession } from "@/lib/server-auth";
import { prisma } from "@/lib/db";
import { canSeePremium, topicVisibilityWhere } from "@/lib/forum-visibility";
import { plural, timeAgo } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";

const PAGE_SIZE = 15;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });
  if (!category) return { title: "Раздел не найден" };
  return {
    title: category.name,
    description: category.description ?? `Темы раздела «${category.name}» на форуме DEWORLD.`,
    alternates: { canonical: `/forum/${slug}` },
  };
}

export default function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  return (
    <Suspense fallback={<CategorySkeleton />}>
      <CategoryContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function CategoryContent({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { category: slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const session = await getServerSession();
  const viewer = session?.user
    ? { role: session.user.role, premiumUntil: session.user.premiumUntil }
    : null;
  const premium = canSeePremium(viewer);

  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const premiumLocked = category.premiumOnly && !premium;

  if (premiumLocked) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <Lock size={30} aria-hidden />
        </span>
        <h1 className="mt-5 font-display text-2xl text-stone-900">
          «{category.name}» — только для премиума
        </h1>
        <p className="mt-2 text-stone-600">
          В этом разделе общаются участники с активной подпиской DEWORLD Premium.
          Подписка поддерживает сервер и открывает доступ в закрытое сообщество.
        </p>
        <Link
          href="/premium"
          className="focus-ring mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 font-semibold text-stone-950 hover:bg-amber-400"
        >
          <Crown size={18} aria-hidden />
          Узнать о Премиум
        </Link>
      </section>
    );
  }

  const where = {
    categoryId: category.id,
    ...topicVisibilityWhere(viewer),
  };

  const [topics, total] = await Promise.all([
    prisma.topic.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { lastPostAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        author: {
          select: { name: true, username: true, image: true },
        },
      },
    }),
    prisma.topic.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Шапка раздела */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-orange-100 pb-6">
        <div className="min-w-0">
          <Link
            href="/forum"
            className="focus-ring inline-flex items-center gap-1 text-sm text-stone-500 hover:text-orange-800"
          >
            <ChevronLeft size={15} aria-hidden />
            Форум
          </Link>
          <h1 className="mt-1.5 flex flex-wrap items-center gap-2.5 font-display text-2xl text-stone-900 sm:text-3xl">
            {category.name}
            {category.premiumOnly && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-800 ring-1 ring-amber-300">
                <Crown size={12} aria-hidden /> Премиум
              </span>
            )}
          </h1>
          {category.description && (
            <p className="mt-1.5 max-w-2xl text-stone-600">{category.description}</p>
          )}
        </div>
        {session?.user ? (
          <Link
            href={`/forum/new?category=${category.slug}`}
            className="focus-ring inline-flex shrink-0 items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-500/30 transition-colors hover:bg-orange-600"
          >
            <Plus size={17} aria-hidden />
            Новая тема
          </Link>
        ) : (
          <Link
            href={`/signin?callbackUrl=${encodeURIComponent(`/forum/new?category=${category.slug}`)}`}
            className="focus-ring inline-flex shrink-0 items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:border-orange-300 hover:text-orange-800"
          >
            Войти, чтобы писать
          </Link>
        )}
      </div>

      {/* Список тем */}
      {topics.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 p-12 text-center">
          <MessagesSquare size={32} className="mx-auto text-orange-300" aria-hidden />
          <p className="mt-3 font-semibold text-stone-800">В этом разделе пока пусто</p>
          <p className="mt-1 text-sm text-stone-600">Станьте первым — создайте тему.</p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-stone-100 border-y border-stone-100">
          {topics.map((topic) => (
            <li key={topic.id}>
              <Link
                href={`/forum/topic/${topic.slug}`}
                className="focus-ring group flex items-center gap-4 py-4 transition-colors hover:bg-orange-50/50"
              >
                <UserAvatar
                  name={topic.author.name}
                  username={topic.author.username}
                  image={topic.author.image}
                  size={44}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    {topic.pinned && (
                      <Pin size={13} className="shrink-0 text-orange-500" aria-label="Закреплено" />
                    )}
                    {topic.locked && (
                      <Lock size={13} className="shrink-0 text-stone-400" aria-label="Закрыто" />
                    )}
                    {topic.premiumOnly && (
                      <Crown size={13} className="shrink-0 text-amber-500" aria-label="Премиум" />
                    )}
                    <span className="truncate font-medium text-stone-900 group-hover:text-orange-900">
                      {topic.title}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-stone-500">
                    {topic.author.name ?? topic.author.username ?? "Аноним"} ·{" "}
                    {timeAgo(topic.lastPostAt)}
                  </span>
                </span>
                <span className="hidden shrink-0 text-right text-xs text-stone-400 sm:block">
                  <span className="block font-semibold text-stone-700">{topic.replyCount}</span>
                  {plural(topic.replyCount, "ответ", "ответа", "ответов").split(" ")[1]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Пагинация */}
      {totalPages > 1 && (
        <nav aria-label="Страницы тем" className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/forum/${category.slug}?page=${page - 1}`}
              className="focus-ring rounded-xl border border-stone-200 p-2.5 text-stone-600 hover:bg-stone-50"
              aria-label="Предыдущая страница"
            >
              <ChevronLeft size={18} />
            </Link>
          )}
          <span className="px-3 text-sm text-stone-600">
            Страница {page} из {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/forum/${category.slug}?page=${page + 1}`}
              className="focus-ring rounded-xl border border-stone-200 p-2.5 text-stone-600 hover:bg-stone-50"
              aria-label="Следующая страница"
            >
              <ChevronRight size={18} />
            </Link>
          )}
        </nav>
      )}
    </section>
  );
}

function CategorySkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6" aria-hidden>
      <div className="skeleton h-4 w-20" />
      <div className="skeleton mt-3 h-10 w-72" />
      <div className="skeleton mt-2 h-5 w-96" />
      <div className="mt-6 divide-y divide-stone-100 border-y border-stone-100">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 py-4">
            <div className="skeleton h-11 w-11 rounded-xl" />
            <div className="flex-1">
              <div className="skeleton h-5 w-2/3" />
              <div className="skeleton mt-2 h-4 w-40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
