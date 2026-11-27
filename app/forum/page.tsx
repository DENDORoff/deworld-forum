import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import {
  ChevronRight,
  Crown,
  LifeBuoy,
  Megaphone,
  MessagesSquare,
  Bug,
  Palette,
  LifeBuoy as SupportIcon,
  Search,
  ArrowRight,
  BookOpenCheck,
} from "lucide-react";

import { getServerSession } from "@/lib/server-auth";
import { prisma } from "@/lib/db";
import { topicVisibilityWhere } from "@/lib/forum-visibility";
import { plural, timeAgo } from "@/lib/utils";
import { getSiteStats } from "@/lib/stats";
import { SiteStatsPanel } from "@/components/site-stats";

export const metadata: Metadata = {
  title: "Форум",
  description:
    "Официальный форум DEWORLD: новости, общее обсуждение, поддержка, творчество и раздел для премиум-подписчиков.",
  alternates: { canonical: "/forum" },
};

const CATEGORY_ICONS: Record<string, typeof MessagesSquare> = {
  Megaphone,
  MessagesSquare,
  LifeBuoy,
  Palette,
  Bug,
  Crown,
  SupportIcon,
};

export default function ForumPage() {
  return (
    <>
      {/* ── Шапка раздела + поиск ─────────────────────────────────── */}
      <section className="border-b border-orange-100 bg-gradient-to-b from-orange-50/70 to-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
            Форум
          </p>
          <h1 className="mt-2 font-display text-2xl text-stone-900 sm:text-3xl">
            Обсуждения сообщества
          </h1>
          <p className="mt-2 max-w-xl text-stone-600">
            Новости, помощь, творчество и разговоры обо всём игровом — в одном месте.
            Перед первым постом загляните в{" "}
            <Link href="/forum/rules" className="font-semibold text-orange-700 hover:underline">
              правила
            </Link>
            .
          </p>

          <form action="/forum/search" method="get" role="search" className="mt-6 flex max-w-lg">
            <label htmlFor="forum-search" className="sr-only">
              Поиск по форуму
            </label>
            <input
              id="forum-search"
              type="search"
              name="q"
              placeholder="Поиск тем и ответов…"
              maxLength={120}
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
        </div>
      </section>

      {/* ── Разделы + сайдбар ───────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-8">
            <Suspense fallback={<ForumCategoriesSkeleton />}>
              <ForumCategories />
            </Suspense>
          </div>
          <aside className="min-w-0 lg:col-span-4">
            <Suspense fallback={<div className="skeleton h-64 rounded-2xl" />}>
              <LatestTopicsSidebar />
            </Suspense>
          </aside>
        </div>
      </section>
    </>
  );
}

async function ForumCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { position: "asc" },
    include: {
      _count: { select: { topics: true } },
      topics: {
        orderBy: { lastPostAt: "desc" },
        take: 1,
        select: { title: true, slug: true, lastPostAt: true },
      },
    },
  });

  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 p-10 text-center">
        <p className="font-semibold text-stone-800">Разделы пока не созданы</p>
        <p className="mt-1 text-sm text-stone-600">
          Администратор настраивает структуру форума — загляните позже.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-stone-100 border-y border-stone-100">
      {categories.map((category) => {
        const Icon = CATEGORY_ICONS[category.icon ?? ""] ?? MessagesSquare;
        const latest = category.topics[0];
        return (
          <li key={category.id}>
            <Link
              href={`/forum/${category.slug}`}
              className="focus-ring group flex items-center gap-4 px-2 py-5 transition-colors hover:bg-orange-50/60"
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  category.premiumOnly
                    ? "bg-amber-100 text-amber-700"
                    : "bg-orange-100 text-orange-600"
                }`}
              >
                {category.premiumOnly ? (
                  <Crown size={22} aria-hidden />
                ) : (
                  <Icon size={22} aria-hidden />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-stone-900 group-hover:text-orange-900">
                    {category.name}
                  </span>
                  {category.premiumOnly && (
                    <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 ring-1 ring-amber-300">
                      Премиум
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-sm text-stone-500">
                  {category.description}
                </span>
                {latest && (
                  <span className="mt-1 hidden truncate text-xs text-stone-400 sm:block">
                    Последнее: {latest.title}
                  </span>
                )}
              </span>
              <span className="flex shrink-0 flex-col items-end">
                <span className="font-display text-lg text-stone-800">{category._count.topics}</span>
                <span className="text-[10px] uppercase tracking-wide text-stone-400">
                  {plural(category._count.topics, "тема", "темы", "тем").split(" ")[1]}
                </span>
                <ChevronRight
                  size={18}
                  aria-hidden
                  className="mt-1 text-stone-300 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-400"
                />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ForumCategoriesSkeleton() {
  return (
    <div className="divide-y divide-stone-100 border-y border-stone-100" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-2 py-5">
          <div className="skeleton h-12 w-12 rounded-xl" />
          <div className="flex-1">
            <div className="skeleton h-5 w-40" />
            <div className="skeleton mt-2 h-4 w-64" />
          </div>
          <div className="skeleton h-6 w-10" />
        </div>
      ))}
    </div>
  );
}

async function LatestTopicsSidebar() {
  const session = await getServerSession();
  const viewer = session?.user
    ? { role: session.user.role, premiumUntil: session.user.premiumUntil }
    : null;

  const [latestTopics, stats] = await Promise.all([
    prisma.topic.findMany({
      where: topicVisibilityWhere(viewer),
      orderBy: { lastPostAt: "desc" },
      take: 5,
      select: {
        slug: true,
        title: true,
        replyCount: true,
        lastPostAt: true,
        category: { select: { name: true, slug: true } },
      },
    }),
    getSiteStats(),
  ]);

  return (
    <div className="space-y-6">
      <SiteStatsPanel initial={stats} tone="light" compact />
      <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-semibold text-stone-900">
          <BookOpenCheck size={18} className="text-orange-500" aria-hidden />
          Последние темы
        </h2>
        {latestTopics.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">Тем ещё нет — самое время начать.</p>
        ) : (
          <ul className="mt-3 divide-y divide-stone-100">
            {latestTopics.map((topic) => (
              <li key={topic.slug}>
                <Link
                  href={`/forum/topic/${topic.slug}`}
                  className="focus-ring block py-2.5 transition-colors hover:text-orange-800"
                >
                  <span className="line-clamp-2 text-sm font-medium leading-snug text-stone-800">
                    {topic.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-stone-400">
                    {topic.category.name} · {timeAgo(topic.lastPostAt)} ·{" "}
                    {plural(topic.replyCount, "ответ", "ответа", "ответов")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/forum/new"
          className="focus-ring mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-700 hover:text-orange-800"
        >
          Создать тему
          <ArrowRight size={15} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
