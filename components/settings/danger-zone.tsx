"use client";

import { useActionState, useState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

import {
  deleteAccountAction,
  type SettingsFormState,
} from "@/lib/actions/settings";

const initialState: SettingsFormState = { status: "idle" };

/** Постоянное удаление аккаунта: пароль + слово «УДАЛИТЬ». Необратимо. */
export function DangerZone() {
  const [state, formAction, isPending] = useActionState(deleteAccountAction, initialState);
  const [confirmText, setConfirmText] = useState("");
  const armed = confirmText === "УДАЛИТЬ";

  return (
    <form action={formAction} className="space-y-3">
      <p className="flex items-start gap-2 text-sm text-red-800">
        <AlertTriangle size={17} className="mt-0.5 shrink-0" aria-hidden />
        Удаление аккаунта безвозвратно: профиль, посты и сообщения будут стёрты. Отменить
        операцию будет нельзя.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Ваш пароль"
          className="focus-ring rounded-xl border border-red-200 bg-white px-4 py-2.5 text-base placeholder:text-stone-400"
        />
        <input
          name="confirmText"
          type="text"
          required
          value={confirmText}
          onChange={(event) => setConfirmText(event.target.value)}
          placeholder="Напишите «УДАЛИТЬ»"
          aria-label="Подтвердите словом УДАЛИТЬ"
          className="focus-ring rounded-xl border border-red-200 bg-white px-4 py-2.5 text-base placeholder:text-stone-400"
        />
      </div>
      {state.status === "error" && state.message && (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-800">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={!armed || isPending}
        className="focus-ring inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        Удалить аккаунт
      </button>
    </form>
  );
}
