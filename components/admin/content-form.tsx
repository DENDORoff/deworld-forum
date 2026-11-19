"use client";

import { useActionState } from "react";
import { LayoutList, Loader2, Save, Type } from "lucide-react";

import {
  updateFooterAction,
  updateNavAction,
  updateRequisitesAction,
  type ContentFormState,
} from "@/lib/actions/content";
import {
  formatSimpleList,
  formatFooterColumns,
  requisitesToLines,
  type FooterColumn,
  type NavItem,
  type OperatorRequisites,
} from "@/lib/site-content-shared";
import { cn } from "@/lib/utils";

const initialState: ContentFormState = { status: "idle" };

const textareaClass =
  "focus-ring mt-2 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 font-mono text-sm leading-relaxed text-stone-800 placeholder:text-stone-400";
const inputClass =
  "focus-ring mt-1.5 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-base placeholder:text-stone-400";

function StatusMessage({ state }: { state: ContentFormState }) {
  if (state.status === "idle" || !state.message) return null;
  return (
    <p
      role="alert"
      className={cn(
        "mt-3 rounded-xl border px-4 py-2.5 text-sm",
        state.status === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800",
      )}
    >
      {state.message}
    </p>
  );
}

function SubmitButton({ isPending, label }: { isPending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="focus-ring inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
    >
      {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
      {label}
    </button>
  );
}

export function NavForm({ navItems }: { navItems: NavItem[] }) {
  const [state, formAction, isPending] = useActionState(updateNavAction, initialState);
  return (
    <form action={formAction} className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 font-semibold text-stone-900">
        <LayoutList size={17} className="text-orange-500" aria-hidden />
        Навигация в шапке
      </h2>
      <p className="mt-1 text-xs text-stone-500">
        Одна строка на пункт: «Название|/url» или «Название|https://…». Строки с «#» игнорируются.
      </p>
      <textarea
        name="nav_items"
        rows={6}
        defaultValue={formatSimpleList(navItems)}
        className={textareaClass}
        aria-label="Пункты навигации"
      />
      <StatusMessage state={state} />
      <div className="mt-3">
        <SubmitButton isPending={isPending} label="Сохранить навигацию" />
      </div>
    </form>
  );
}

export function FooterForm({
  columns,
  tagline,
}: {
  columns: FooterColumn[];
  tagline: string;
}) {
  const [state, formAction, isPending] = useActionState(updateFooterAction, initialState);
  return (
    <form action={formAction} className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-stone-900">Подвал (футер)</h2>
      <p className="mt-1 text-xs text-stone-500">
        Колонки: «## Название раздела», затем пункты «Название|/url». Не более 6 колонок по 8 пунктов.
      </p>
      <textarea
        name="footer_columns"
        rows={12}
        defaultValue={formatFooterColumns(columns)}
        className={textareaClass}
        aria-label="Колонки подвала"
      />
      <label htmlFor="footer_tagline" className="mt-4 block text-sm font-semibold text-stone-800">
        Слоган под логотипом
      </label>
      <input
        id="footer_tagline"
        name="footer_tagline"
        type="text"
        maxLength={200}
        defaultValue={tagline}
        className={inputClass}
      />
      <StatusMessage state={state} />
      <div className="mt-3">
        <SubmitButton isPending={isPending} label="Сохранить подвал" />
      </div>
    </form>
  );
}

export function RequisitesForm({ requisites }: { requisites: OperatorRequisites }) {
  const [state, formAction, isPending] = useActionState(updateRequisitesAction, initialState);
  return (
    <form action={formAction} className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 font-semibold text-stone-900">
        <Type size={17} className="text-orange-500" aria-hidden />
        Реквизиты оператора (152-ФЗ)
      </h2>
      <p className="mt-1 text-xs text-stone-500">
        Формат «ключ=значение», по одному в строке. Ключи: name, status, inn, ogrn, address, emailPrivacy, emailLegal, emailSecurity, rknRegistry.
        Показывается на /legal/requisites, в футере и в политике конфиденциальности.
      </p>
      <textarea
        name="requisites"
        rows={10}
        defaultValue={requisitesToLines(requisites)}
        className={textareaClass}
        aria-label="Реквизиты оператора"
      />
      <StatusMessage state={state} />
      <div className="mt-3">
        <SubmitButton isPending={isPending} label="Сохранить реквизиты" />
      </div>
    </form>
  );
}
