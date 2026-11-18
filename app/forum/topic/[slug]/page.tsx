import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Eye,
  Lock,
  Lock as LockIcon,
  MessagesSquare,
  Pin,
} from "lucide-react";
import { notFound } from "next/navigation";

import { getServerSession } from "@/lib/server-auth";
import { prisma } from "@/lib/db";
import { canSeePremium } from "@/lib/forum-visibility";
import { formatDateTime, timeAgo } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";
import { RoleBadge } from "@/components/role-badge";
import { PostContent } from "@/components/post-content";
import { PostLikeButton } from "@/components/post-like-button";
import { PostForm } from "@/components/post-form";
import { PostDeleteButton, SolutionToggleButton, TopicActions } from "@/components/topic-actions";

const PAGE_SIZE = 20;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = await prisma.topic.findUnique({
    where: { slug },
    select: { title: true, content: true },
  });
  if (!topic) return { title: "Тема не найдена" };
  return {
    title: topic.title,
    description: topic.content.replace(/\s+/g, " ").slice(0, 160),
    alternates: { canonical: `/forum/topic/${slug}` },
    openGraph: { title: topic.title, type: "article" },
  };
}

export default function TopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  return (
    <Suspense fallback={<TopicSkeleton />}>
      <TopicContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function TopicContent({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const session = await getServerSession();
  const viewer = session?.user
    ? { role: session.user.role, premiumUntil: session.user.premiumUntil }
    : null;
  const premium = canSeePremium(viewer);
  const isStaff = viewer ? viewer.role !== "USER" : false;

  const topic = await prisma.topic.findUnique({
    where: { slug },
    include: {
      category: { select: { name: true, slug: true, premiumOnly: true } },
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          role: true,
          premiumUntil: true,
          createdAt: true,
        },
      },
    },
  });
  if (!topic) notFound();

  const premiumLocked =
    (topic.premiumOnly || topic.category.premiumOnly) && !premium;

  if (premiumLocked) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <Lock size={30} aria-hidden />
        </span>
        <h1 className="mt-5 font-display text-2xl text-stone-900">Только для премиум-участников</h1>
        <p className="mt-2 text-stone-600">
          Эта тема доступна участникам DEWORLD Premium. Оформите подписку, чтобы читать и
          участвовать в обсуждении.
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

  // Считаем просмотр (не блокируем рендер при ошибке)
  try {
    await prisma.topic.update({
      where: { id: topic.id },
      data: { views: { increment: 1 } },
    });
  } catch (error) {
    console.error("[topic] view increment failed", error);
  }

  const totalPosts = await prisma.post.count({ where: { topicId: topic.id } });
  const totalPages = Math.max(1, Math.ceil((totalPosts + 1) / PAGE_SIZE)); // +1 = первый пост

  // Первая страница включает пост автора (content темы); дальше — ответы из БД
  const replies = await prisma.post.findMany({
    where: { topicId: topic.id },
    orderBy: { createdAt: "asc" },
    skip: page === 1 ? 0 : (page - 1) * PAGE_SIZE - 1,
    take: page === 1 ? PAGE_SIZE - 1 : PAGE_SIZE,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          role: true,
          premiumUntil: true,
        },
      },
      _count: { select: { likes: true } },
    },
  });

  const postIds = replies.map((post) => post.id);
  const likedRows =
    session?.user?.id && postIds.length > 0
      ? await prisma.postLike.findMany({
          where: { postId: { in: postIds }, userId: session.user.id },
          select: { postId: true },
        })
      : [];
  const likedSet = new Set(likedRows.map((row) => row.postId));

  const currentUserId = session?.user?.id;
  const isTopicAuthor = currentUserId === topic.authorId;

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Хлебные крошки */}
      <nav aria-label="Хлебные крошки" className="flex flex-wrap items-center gap-1.5 text-sm text-stone-500">
        <Link href="/forum" className="hover:text-orange-800">
          Форум
        </Link>
        <ChevronRight size={14} aria-hidden />
        <Link href={`/forum/${topic.category.slug}`} className="hover:text-orange-800">
          {topic.category.name}
        </Link>
        <ChevronRight size={14} aria-hidden />
        <span aria-current="page" className="max-w-56 truncate text-stone-800">
          {topic.title}
        </span>
      </nav>

      <div className="mt-5 grid gap-8 lg:grid-cols-12">
        {/* ── Тело темы ─────────────────────────────────────────────── */}
        <div className="lg:col-span-9">
          <header className="border-b border-orange-100 pb-5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
              {topic.pinned && (
                <span className="inline-flex items-center gap-1 rounded-md bg-orange-100 px-2 py-1 font-semibold text-orange-800">
                  <Pin size={12} aria-hidden /> Закреплено
                </span>
              )}
              {topic.locked && (
                <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-1 font-semibold text-stone-600">
                  <LockIcon size={12} aria-hidden /> Закрыто
                </span>
              )}
              {topic.premiumOnly && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 font-semibold text-amber-800 ring-1 ring-amber-300">
                  <Crown size={12} aria-hidden /> Премиум
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Eye size={12} aria-hidden /> {topic.views + 1} просмотров
              </span>
              <span>Создана {formatDateTime(topic.createdAt)}</span>
            </div>
            <h1 className="mt-3 font-display text-2xl leading-snug text-stone-900 sm:text-3xl">
              {topic.title}
            </h1>
          </header>

          {/* Первый пост (только на первой странице) */}
          {page === 1 && (
            <article className="border-b border-stone-100 py-6">
              <div className="flex items-start gap-4">
                <Link href={profileHref(topic.author)} className="shrink-0">
                  <UserAvatar
                    name={topic.author.name}
                    username={topic.author.username}
                    image={topic.author.image}
                    size={48}
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <AuthorLine
                    author={topic.author}
                    date={topic.createdAt}
                  />
                  <div className="mt-3">
                    <PostContent text={topic.content} />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {isTopicAuthor || isStaff ? (
                      <TopicActions
                        topicId={topic.id}
                        locked={topic.locked}
                        pinned={topic.pinned}
                        isStaff={isStaff}
                        canDelete
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          )}

          {/* Ответы */}
          <div className="divide-y divide-stone-100">
            {replies.map((post, index) => {
              const number = (page === 1 ? 0 : (page - 1) * PAGE_SIZE - 1) + index + 1;
              const canRemove = currentUserId === post.author.id || isStaff;
              const canMarkSolution = (isTopicAuthor || isStaff) && currentUserId !== post.author.id;
              return (
                <article
                  key={post.id}
                  id={`post-${post.id}`}
                  className={`py-6 ${post.isSolution ? "rounded-2xl bg-emerald-50/60 px-4 ring-1 ring-emerald-200" : ""}`}
                >
                  <div className="flex items-start gap-4">
                    <Link href={profileHref(post.author)} className="shrink-0">
                      <UserAvatar
                        name={post.author.name}
                        username={post.author.username}
                        image={post.author.image}
                        size={44}
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <AuthorLine
                        author={post.author}
                        date={post.createdAt}
                        extra={
                          <span className="text-xs text-stone-400">
                            #{number}
                            {post.isSolution && (
                              <span className="ml-2 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                                Решение
                              </span>
                            )}
                          </span>
                        }
                      />
                      <div className="mt-2.5">
                        <PostContent text={post.content} />
                      </div>
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <PostLikeButton
                          postId={post.id}
                          initialLiked={likedSet.has(post.id)}
                          initialCount={post._count.likes}
                          disabled={!currentUserId}
                        />
                        {canMarkSolution && (
                          <SolutionToggleButton
                            topicId={topic.id}
                            postId={post.id}
                            isSolution={post.isSolution}
                          />
                        )}
                        {canRemove && <PostDeleteButton postId={post.id} />}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Пагинация */}
          {totalPages > 1 && (
            <nav aria-label="Страницы ответов" className="mt-6 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`/forum/topic/${topic.slug}?page=${page - 1}#post-start`}
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
                  href={`/forum/topic/${topic.slug}?page=${page + 1}`}
                  className="focus-ring rounded-xl border border-stone-200 p-2.5 text-stone-600 hover:bg-stone-50"
                  aria-label="Следующая страница"
                >
                  <ChevronRight size={18} />
                </Link>
              )}
            </nav>
          )}

          {/* Форма ответа / блокировка */}
          <div className="mt-6" id="post-start">
            {topic.locked ? (
              <p className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-center text-sm text-stone-600">
                Тема закрыта для новых ответов.
              </p>
            ) : currentUserId ? (
              <PostForm topicId={topic.id} />
            ) : (
              <p className="rounded-2xl border border-orange-100 bg-orange-50/50 px-5 py-5 text-center text-sm text-stone-700">
                <Link
                  href={`/signin?callbackUrl=${encodeURIComponent(`/forum/topic/${topic.slug}`)}`}
                  className="font-semibold text-orange-700 hover:underline"
                >
                  Войдите
                </Link>
                , чтобы ответить в этой теме.
              </p>
            )}
          </div>
        </div>

        {/* ── Сайдбар ───────────────────────────────────────────────── */}
        <aside className="lg:col-span-3">
          <div className="sticky top-20 space-y-5">
            <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Автор темы
              </p>
              <Link
                href={profileHref(topic.author)}
                className="focus-ring mt-2 flex items-center gap-3 rounded-xl p-1 transition-colors hover:bg-orange-50"
              >
                <UserAvatar
                  name={topic.author.name}
                  username={topic.author.username}
                  image={topic.author.image}
                  size={44}
                />
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-stone-900">
                    {topic.author.name ?? topic.author.username ?? "Аноним"}
                  </span>
                  <span className="mt-0.5 block text-xs text-stone-500">
                    на форуме с {new Date(topic.author.createdAt).getFullYear()}
                  </span>
                </span>
              </Link>
              <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-stone-100 pt-4 text-center text-xs text-stone-500">
                <div>
                  <dt className="sr-only">Ответов</dt>
                  <dd className="font-display text-base text-stone-800">{topic.replyCount}</dd>
                  ответов
                </div>
                <div>
                  <dt className="sr-only">Просмотров</dt>
                  <dd className="font-display text-base text-stone-800">{topic.views + 1}</dd>
                  просмотров
                </div>
                <div>
                  <dt className="sr-only">Раздел</dt>
                  <dd className="truncate font-display text-base text-stone-800" title={topic.category.name}>
                    {topic.category.name}
                  </dd>
                  раздел
                </div>
              </dl>
            </div>

            <Link
              href={`/forum/${topic.category.slug}`}
              className="focus-ring flex items-center justify-between gap-2 rounded-2xl border border-stone-100 bg-white px-5 py-4 text-sm font-semibold text-stone-700 shadow-sm transition-colors hover:border-orange-200 hover:text-orange-800"
            >
              <span className="flex items-center gap-2">
                <MessagesSquare size={16} aria-hidden />
                Все темы раздела
              </span>
              <ChevronRight size={16} aria-hidden />
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}

function profileHref(author: { username: string | null }) {
  return author.username ? `/profile/${author.username}` : "/profile";
}

function AuthorLine({
  author,
  date,
  extra,
}: {
  author: {
    name: string | null;
    username: string | null;
    role: "USER" | "MODERATOR" | "ADMIN";
    premiumUntil: Date | string | null;
  };
  date: Date;
  extra?: React.ReactNode;
}) {
  return (
    <p className="flex flex-wrap items-center gap-2 text-sm">
      <Link
        href={profileHref(author)}
        className="font-semibold text-stone-900 hover:text-orange-800"
      >
        {author.name ?? author.username ?? "Аноним"}
      </Link>
      <RoleBadge role={author.role} premiumUntil={author.premiumUntil} />
      <span className="text-xs text-stone-400">{timeAgo(date)}</span>
      {extra}
    </p>
  );
}

function TopicSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6" aria-hidden>
      <div className="skeleton h-4 w-64" />
      <div className="skeleton mt-3 h-9 w-2/3" />
      <div className="mt-6 flex gap-6">
        <div className="flex-1">
          <div className="skeleton h-40 rounded-2xl" />
          <div className="skeleton mt-4 h-32 rounded-2xl" />
          <div className="skeleton mt-4 h-32 rounded-2xl" />
        </div>
        <div className="hidden w-64 lg:block">
          <div className="skeleton h-56 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
