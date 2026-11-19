"use client";

import { useActionState, useState } from "react";
import { Flag, X } from "lucide-react";

import { createReportAction, type ReportFormState } from "@/lib/actions/reports";

const initialState: ReportFormState = { status: "idle" };

/** Кнопка «Пожаловаться» с модалкой. Работает для темы и ответа. */
export function ReportButton({
  targetType,
  targetId,
  targetLabel,
}: {
  targetType: "TOPIC" | "POST" | "USER";
  targetId: string;
  targetLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createReportAction, initialState);

  if (state.status === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
        <Flag size={13} aria-hidden />
        Отправлено
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Пожаловаться"
        aria-label="Пожаловаться"
        className="focus-ring inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-stone-400 transition-colors hover:bg-orange-50 hover:text-orange-700"
      >
        <Flag size={13} aria-hidden />
        <span className="hidden sm:inline">Жалоба</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="presentation"
        >
          <button
            type="button"
            aria-label="Закрыть"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-stone-950/50 backdrop-blur-[2px]"
          />
          <form
            action={formAction}
            role="dialog"
            aria-modal="true"
            aria-label="Отправить жалобу"
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-stone-900">Пожаловаться</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Закрыть"
                className="focus-ring rounded-lg p-1 text-stone-400 hover:bg-stone-100"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-1 text-xs text-stone-500">
              {targetLabel}. Опишите, что не так — модераторы рассмотрят.
            </p>
            <input type="hidden" name="targetType" value={targetType} />
            <input type="hidden" name="targetId" value={targetId} />
            <label htmlFor={`reason-${targetId}`} className="mt-3 block text-sm font-semibold text-stone-800">
              Причина
            </label>
            <textarea
              id={`reason-${targetId}`}
              name="reason"
              required
              minLength={10}
              maxLength={2000}
              rows={4}
              placeholder="Оскорбления, спам, реклама, неверная информация…"
              className="focus-ring mt-1.5 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm"
            />
            {state.status === "error" && state.message && (
              <p role="alert" className="mt-2 text-xs text-red-600">{state.message}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="focus-ring rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="focus-ring rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
              >
                {isPending ? "Отправляем…" : "Отправить"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
