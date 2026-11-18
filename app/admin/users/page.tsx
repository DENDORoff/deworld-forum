import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ChevronRight, Crown, Search } from "lucide-react";

import { getServerSession } from "@/lib/server-auth";
import { prisma } from "@/lib/db";
import { formatDate, isPremiumActive } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";
import { RoleBadge } from "@/components/role-badge";
import { PremiumControls, RoleSelect } from "@/components/admin/user-controls";

export default function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  return (
    <Suspense fallback={<div className="skeleton h-96 rounded-2xl" />}>
      <AdminUsersContent searchParams={searchParams} />
    </Suspense>
  );
}

const PAGE_SIZE = 25;

async function AdminUsersContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await getServerSession();
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "MODERATOR")) redirect("/");
  const isAdmin = role === "ADMIN";

  const { q, page: pageParam } = await searchParams;
  const query = (q ?? "").trim().slice(0, 64);
  const page = Math.max(1, Number(pageParam) || 1);

  const where = query
    ? {
        OR: [
          { username: { contains: query, mode: "insensitive" as const } },
          { email: { contains: query, mode: "insensitive" as const } },
          { name: { contains: query, mode: "insensitive" as const } },
          { minecraftUsername: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        role: true,
        premiumUntil: true,
        minecraftUsername: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="font-display text-2xl text-stone-900">Пользователи</h1>
      <p className="mt-1 text-sm text-stone-500">
        {total} в базе. Поиск по логину, почте, имени и Minecraft-нику.
      </p>

      <form action="/admin/users" method="get" role="search" className="mt-5 flex max-w-md">
        <label htmlFor="admin-user-search" className="sr-only">
          Поиск пользователя
        </label>
        <input
          id="admin-user-search"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Логин, почта или Minecraft-ник…"
          className="focus-ring h-11 w-full rounded-l-xl border border-r-0 border-stone-200 px-4 text-sm"
        />
        <button
          type="submit"
          aria-label="Найти"
          className="focus-ring h-11 rounded-r-xl border border-orange-500 bg-orange-500 px-4 text-white hover:bg-orange-600"
        >
          <Search size={17} />
        </button>
      </form>

      <ul className="mt-5 divide-y divide-stone-100 rounded-2xl border border-stone-100 bg-white shadow-sm">
        {users.map((user) => {
          const premium = isPremiumActive(user);
          return (
            <li key={user.id} className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <UserAvatar name={user.name} username={user.username} image={user.image} size={40} />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-stone-900">
                    <Link
                      href={user.username ? `/profile/${user.username}` : "#"}
                      className="truncate hover:text-orange-800"
                    >
                      {user.name ?? user.username ?? "Без имени"}
                    </Link>
                    <RoleBadge role={user.role} premiumUntil={user.premiumUntil} />
                    {premium && <Crown size={13} className="text-amber-500" aria-hidden />}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-stone-500">
                    {user.email ?? "без почты"} · с {formatDate(user.createdAt)}
                    {user.minecraftUsername ? ` · MC: ${user.minecraftUsername}` : ""}
                  </p>
                </div>
              </div>
              {isAdmin && (
                <div className="flex shrink-0 items-center gap-2 pl-12 lg:pl-0">
                  <RoleSelect userId={user.id} currentRole={user.role} isSelf={user.id === session.user.id} />
                  <PremiumControls userId={user.id} activeUntil={user.premiumUntil} />
                </div>
              )}
            </li>
          );
        })}
        {users.length === 0 && (
          <li className="px-5 py-8 text-center text-sm text-stone-500">Никого не нашлось.</li>
        )}
      </ul>

      {totalPages > 1 && (
        <nav aria-label="Страницы" className="mt-4 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={`/admin/users?q=${encodeURIComponent(query)}&page=${page - 1}`} className="focus-ring rounded-xl border border-stone-200 p-2 hover:bg-stone-50" aria-label="Предыдущая">
              <ChevronRight size={17} className="rotate-180" />
            </Link>
          )}
          <span className="text-sm text-stone-600">{page} / {totalPages}</span>
          {page < totalPages && (
            <Link href={`/admin/users?q=${encodeURIComponent(query)}&page=${page + 1}`} className="focus-ring rounded-xl border border-stone-200 p-2 hover:bg-stone-50" aria-label="Следующая">
              <ChevronRight size={17} />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
