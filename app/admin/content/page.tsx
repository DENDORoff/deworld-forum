import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LayoutList } from "lucide-react";

import { auth } from "@/auth";
import {
  getFooterColumns,
  getFooterTagline,
  getNavItems,
  getOperatorRequisites,
} from "@/lib/site-content";
import { FooterForm, NavForm, RequisitesForm } from "@/components/admin/content-form";

export default function AdminContentPage() {
  return (
    <Suspense fallback={<div className="skeleton h-96 rounded-2xl" />}>
      <AdminContent />
    </Suspense>
  );
}

async function AdminContent() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "MODERATOR")) redirect("/");

  const [navItems, columns, tagline, requisites] = await Promise.all([
    getNavItems(),
    getFooterColumns(),
    getFooterTagline(),
    getOperatorRequisites(),
  ]);

  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
        <LayoutList size={14} aria-hidden /> Контент сайта
      </p>
      <h1 className="mt-1 font-display text-2xl text-stone-900">Шапка, подвал и реквизиты</h1>
      <p className="mt-1 max-w-2xl text-sm text-stone-600">
        Всё это редактируется прямо здесь — без правок кода. Сохранение мгновенно обновляет сайт.
      </p>

      <div className="mt-6 space-y-6">
        <NavForm navItems={navItems} />
        <FooterForm columns={columns} tagline={tagline} />
        <RequisitesForm requisites={requisites} />
      </div>
    </div>
  );
}
