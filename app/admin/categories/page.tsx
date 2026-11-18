import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/server-auth";
import { prisma } from "@/lib/db";
import { CategoryRow, CreateCategoryForm } from "@/components/admin/category-forms";

export default function AdminCategoriesPage() {
  return (
    <Suspense fallback={<div className="skeleton h-96 rounded-2xl" />}>
      <AdminCategoriesContent />
    </Suspense>
  );
}

async function AdminCategoriesContent() {
  const session = await getServerSession();
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "MODERATOR")) redirect("/");

  const categories = await prisma.category.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { topics: true } } },
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-stone-900">Разделы форума</h1>
      <p className="mt-1 text-sm text-stone-500">
        Создание, переименование, порядок и премиум-доступ. Slug — это адрес: /forum/&lt;slug&gt;.
        Удаление возможно только для пустых разделов.
      </p>

      <div className="mt-6">
        <CreateCategoryForm />
      </div>

      <ul className="mt-6 space-y-3">
        {categories.map((category) => (
          <CategoryRow
            key={category.id}
            category={{
              id: category.id,
              slug: category.slug,
              name: category.name,
              description: category.description,
              icon: category.icon,
              position: category.position,
              premiumOnly: category.premiumOnly,
              topicCount: category._count.topics,
            }}
          />
        ))}
      </ul>
    </div>
  );
}
