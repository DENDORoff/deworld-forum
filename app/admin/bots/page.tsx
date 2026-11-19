import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Settings2 } from "lucide-react";

import { auth } from "@/auth";
import { getBotsConfig } from "@/lib/bot-logger";
import { BotsForm } from "@/components/admin/bots-form";

export default function AdminBotsPage() {
  return (
    <Suspense fallback={<div className="skeleton h-96 rounded-2xl" />}>
      <AdminBotsContent />
    </Suspense>
  );
}

async function AdminBotsContent() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "MODERATOR")) redirect("/");

  const config = await getBotsConfig();

  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
        <Settings2 size={14} aria-hidden /> Интеграции
      </p>
      <h1 className="mt-1 font-display text-2xl text-stone-900">Боты для логов</h1>
      <p className="mt-1 max-w-2xl text-sm text-stone-600">
        Discord (текстовые и форум-каналы) и Telegram (группы с топиками). Каждое событие —
        свой шаблон с плейсхолдерами; у Discord — форматирование embed, у Telegram — HTML.
      </p>
      <div className="mt-6">
        <BotsForm config={config} />
      </div>
    </div>
  );
}
