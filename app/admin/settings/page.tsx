import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/server-auth";
import { getDefaultSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<div className="skeleton h-96 rounded-2xl" />}>
      <AdminSettingsContent />
    </Suspense>
  );
}

async function AdminSettingsContent() {
  const session = await getServerSession();
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "MODERATOR")) redirect("/");

  const settings = await getDefaultSettings();
  const map = new Map(settings.map((s) => [s.key, s.value]));

  const parsePerks = (raw: string | null): string[] => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
    } catch {
      return [];
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl text-stone-900">Настройки сайта</h1>
      <p className="mt-1 text-sm text-stone-500">
        Тексты и преимущества, которые можно менять без релиза. Серверные параметры (IP сервера,
        OAuth-ключи, LimboAuth) настраиваются переменными окружения и описаны в README.
      </p>
      <SettingsForm
        announcement={map.get("site_announcement") ?? ""}
        premiumPriceLabel={map.get("premium_price_label") ?? ""}
        premiumPerks={parsePerks(map.get("premium_perks") ?? null)}
      />
    </div>
  );
}
