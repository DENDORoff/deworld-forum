import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  Crown,
  MessageSquare,
  MessagesSquare,
  PenLine,
  Sword,
  Calendar,
} from "lucide-react";

import { getServerSession } from "@/lib/server-auth";
import { prisma } from "@/lib/db";
import { formatDate, isPremiumActive } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";
import { RoleBadge } from "@/components/role-badge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    select: { name: true, username: true },
  });
  if (!user) return { title: "Участник не найден" };
  return {
    title: `${user.name ?? user.username} (@${user.username})`,
    description: `Профиль участника ${user.name ?? user.username} на форуме DEWORLD.`,
    alternates: { canonical: `/profile/${user.username}` },
  };
}

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent params={params} />
    </Suspense>
  );
}

async function ProfileContent({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const [user, session] = await Promise.all([
    prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        role: true,
        premiumUntil: true,
        minecraftUsername: true,
        createdAt: true,
        _count: { select: { topics: true, posts: true } },
        achievements: {
          include: { achievement: { select: { key: true, title: true, description: true, icon: true } } },
          orderBy: { unlockedAt: "desc" },
          take: 24,
        },
      },
    }),
    getServerSession(),
  ]);

  if (!user) notFound();

  const isMe = session?.user?.id === user.id;
  const premium = isPremiumActive(user);
  const solutionCount = await prisma.post.count({
    where: { authorId: user.id, isSolution: true },
  });
  const likesReceived = await prisma.postLike.count({
    where: { post: { authorId: user.id } },
  });

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Шапка профиля */}
      <div className="flex flex-col gap-6 border-b border-orange-100 pb-8 sm:flex-row sm:items-end">
        <UserAvatar
          name={user.name}
          username={user.username}
          image={user.image}
          size={112}
          className="rounded-2xl ring-2 ring-orange-200"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl text-stone-900 sm:text-3xl">
              {user.name ?? user.username}
            </h1>
            <RoleBadge role={user.role} premiumUntil={user.premiumUntil} />
          </div>
          <p className="mt-1 text-stone-500">@{user.username}</p>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-stone-500">
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} aria-hidden /> На форуме с {formatDate(user.createdAt)}
            </span>
            {user.minecraftUsername && (
              <span className="inline-flex items-center gap-1.5">
                <Sword size={14} aria-hidden /> {user.minecraftUsername}
              </span>
            )}
            {premium && user.premiumUntil && (
              <span className="inline-flex items-center gap-1.5 text-amber-700">
                <Crown size={14} aria-hidden /> Премиум до {formatDate(user.premiumUntil)}
              </span>
            )}
          </div>
        </div>
        {isMe && (
          <Link
            href="/settings"
            className="focus-ring inline-flex shrink-0 items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:border-orange-300 hover:text-orange-800"
          >
            Редактировать профиль
          </Link>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* Статистика */}
        <div className="lg:col-span-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
            Статистика
          </h2>
          <dl className="mt-3 grid grid-cols-2 gap-3">
            {[
              { icon: PenLine, label: "тем открыто", value: user._count.topics },
              { icon: MessageSquare, label: "ответов", value: user._count.posts },
              { icon: MessagesSquare, label: "решений дано", value: solutionCount },
              { icon: Crown, label: "лайков получено", value: likesReceived },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm"
              >
                <stat.icon size={18} className="text-orange-500" aria-hidden />
                <dd className="mt-2 font-display text-2xl text-stone-900">{stat.value}</dd>
                <dt className="text-xs text-stone-500">{stat.label}</dt>
              </div>
            ))}
          </dl>

          {user.minecraftUsername && (
            <p className="mt-4 rounded-2xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-xs leading-relaxed text-orange-900">
              Аккаунт Minecraft привязан к <strong>{user.minecraftUsername}</strong>. Игровая
              статистика появится после подключения плагина интеграции.
            </p>
          )}
        </div>

        {/* Достижения */}
        <div className="lg:col-span-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
            Достижения
          </h2>
          {user.achievements.length > 0 ? (
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {user.achievements.map(({ achievement, unlockedAt }) => (
                <li
                  key={achievement.key}
                  title={`${achievement.description}\nПолучено: ${formatDate(unlockedAt)}`}
                  className="flex flex-col items-center rounded-2xl border border-amber-200/70 bg-gradient-to-b from-amber-50 to-white p-4 text-center shadow-sm"
                >
                  <span
                    aria-hidden
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 font-display text-lg text-white shadow"
                  >
                    {achievement.title.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="mt-2 text-xs font-semibold leading-tight text-stone-800">
                    {achievement.title}
                  </span>
                  <span className="mt-0.5 text-[10px] text-stone-400">
                    {formatDate(unlockedAt)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 p-8 text-center">
              <p className="font-semibold text-stone-800">Достижений пока нет</p>
              <p className="mt-1 text-sm text-stone-600">
                Отвечайте на форуме, создавайте темы и получайте ответы — достижения будут
                появляться здесь автоматически.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-hidden>
      <div className="flex gap-6">
        <div className="skeleton h-28 w-28 rounded-2xl" />
        <div className="flex-1">
          <div className="skeleton h-9 w-64" />
          <div className="skeleton mt-2 h-5 w-32" />
          <div className="skeleton mt-2 h-5 w-72" />
        </div>
      </div>
      <div className="skeleton mt-8 h-64 rounded-2xl" />
    </div>
  );
}
