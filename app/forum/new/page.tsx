import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ChevronRight } from "lucide-react";

import { getServerSession } from "@/lib/server-auth";
import { prisma } from "@/lib/db";
import { isPremiumActive } from "@/lib/utils";
import { NewTopicForm } from "@/components/new-topic-form";

export const metadata: Metadata = {
  title: "Новая тема",
  description: "Создайте новую тему на форуме DEWORLD.",
  robots: { index: false, follow: false },
};

export default function NewTopicPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  return (
    <Suspense fallback={<NewTopicSkeleton />}>
      <NewTopicContent searchParams={searchParams} />
    </Suspense>
  );
}

async function NewTopicContent({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: selectedSlug } = await searchParams;
  const session = await getServerSession();
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(`/forum/new${selectedSlug ? `?category=${selectedSlug}` : ""}`)}`);
  }

  const viewer = { role: session.user.role, premiumUntil: session.user.premiumUntil };
  const isStaff = viewer.role !== "USER";
  const premium = isStaff || isPremiumActive({ premiumUntil: viewer.premiumUntil });

  const categories = await prisma.category.findMany({
    orderBy: { position: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      premiumOnly: true,
    },
  });

  const available = categories.filter((c) => !c.premiumOnly || premium);

  // Если указан конкретный раздел — показываем форму сразу
  if (selectedSlug) {
    const category = categories.find((c) => c.slug === selectedSlug);
    if (!category) notFound();
    if (category.premiumOnly && !premium) redirect("/premium");
    return (
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Breadcrumbs category={category.name} />
        <h1 className="mt-4 font-display text-2xl text-stone-900 sm:text-3xl">
          Новая тема в «{category.name}»
        </h1>
        <div className="mt-6 rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
          <NewTopicForm categoryId={category.id} premiumAllowed={premium} />
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Breadcrumbs />
      <h1 className="mt-4 font-display text-2xl text-stone-900 sm:text-3xl">Новая тема</h1>
      <p className="mt-2 text-stone-600">Сначала выберите подходящий раздел.</p>

      <ul className="mt-6 divide-y divide-stone-100 border-y border-stone-100">
        {available.map((category) => (
          <li key={category.id}>
            <Link
              href={`/forum/new?category=${category.slug}`}
              className="focus-ring group flex items-center justify-between gap-4 py-4 transition-colors hover:bg-orange-50/60"
            >
              <span>
                <span className="font-semibold text-stone-900">{category.name}</span>
                <span className="mt-0.5 block text-sm text-stone-500">{category.description}</span>
              </span>
              <ChevronRight
                size={18}
                aria-hidden
                className="shrink-0 text-stone-300 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-500"
              />
            </Link>
          </li>
        ))}
      </ul>

      {!premium && (
        <p className="mt-4 text-sm text-stone-500">
          Раздел «Премиум-клуб» доступен{" "}
          <Link href="/premium" className="font-semibold text-orange-700 hover:underline">
            по подписке
          </Link>
          .
        </p>
      )}
    </section>
  );
}

function Breadcrumbs({ category }: { category?: string }) {
  return (
    <nav aria-label="Хлебные крошки" className="flex items-center gap-1.5 text-sm text-stone-500">
      <Link href="/forum" className="hover:text-orange-800">
        Форум
      </Link>
      <ChevronRight size={14} aria-hidden />
      <span aria-current="page" className="text-stone-800">
        {category ? `Новая тема в «${category}»` : "Новая тема"}
      </span>
    </nav>
  );
}

function NewTopicSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6" aria-hidden>
      <div className="skeleton h-4 w-40" />
      <div className="skeleton mt-4 h-9 w-64" />
      <div className="skeleton mt-6 h-96 w-full rounded-2xl" />
    </div>
  );
}
