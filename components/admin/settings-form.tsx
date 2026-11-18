"use client";

import { useActionState } from "react";
import { Loader2, Save } from "lucide-react";

import { updateSettingsAction, type AdminFormState } from "@/lib/actions/admin";

const initialState: AdminFormState = { status: "idle" };

export function SettingsForm({
  announcement,
  premiumPriceLabel,
  premiumPerks,
}: {
  announcement: string;
  premiumPriceLabel: string;
  premiumPerks: string[];
}) {
  const [state, formAction, isPending] = useActionState(updateSettingsAction, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-6">
      <div className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
        <label htmlFor="site_announcement" className="text-sm font-semibold text-stone-800">
          Объявление на сайте
        </label>
        <p className="mt-0.5 text-xs text-stone-500">
          Показывается полосой над hero на главной. Пустое поле — скрыто.
        </p>
        <input
          id="site_announcement"
          name="site_announcement"
          type="text"
          maxLength={300}
          defaultValue={announcement}
          placeholder="Например: 24 ноября — стрим по новому сезону!"
          className="focus-ring mt-2 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-base placeholder:text-stone-400"
        />
      </div>

      <div className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
        <label htmlFor="premium_price_label" className="text-sm font-semibold text-stone-800">
          Подпись о стоимости премиума
        </label>
        <input
          id="premium_price_label"
          name="premium_price_label"
          type="text"
          maxLength={120}
          defaultValue={premiumPriceLabel}
          placeholder="Например: 149 ₽ в месяц"
          className="focus-ring mt-2 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-base placeholder:text-stone-400"
        />

        <label htmlFor="premium_perks" className="mt-4 block text-sm font-semibold text-stone-800">
          Преимущества премиума
        </label>
        <p className="mt-0.5 text-xs text-stone-500">Каждое преимущество — с новой строки (до 12).</p>
        <textarea
          id="premium_perks"
          name="premium_perks"
          rows={6}
          defaultValue={premiumPerks.join("\n")}
          className="focus-ring mt-2 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-base leading-relaxed"
        />
      </div>

      {state.status !== "idle" && state.message && (
        <p
          role="alert"
          className={`rounded-xl border px-4 py-3 text-sm ${
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="focus-ring inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
      >
        {isPending ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
        Сохранить настройки
      </button>
    </form>
  );
}
