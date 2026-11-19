"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";

import { forgotPasswordAction, type ResetFormState } from "@/lib/actions/password-reset";
import { Turnstile } from "@/components/turnstile";

const initialState: ResetFormState = { status: "idle" };

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, initialState);

  if (state.status === "success") {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={28} aria-hidden />
        </span>
        <h2 className="mt-4 font-semibold text-stone-900">Письмо отправлено</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div>
        <label htmlFor="email" className="text-sm font-semibold text-stone-800">
          Email, привязанный к аккаунту
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="focus-ring mt-1.5 w-full rounded-xl border border-stone-200 px-4 py-3 text-base placeholder:text-stone-400"
        />
      </div>

      {state.status === "error" && state.message && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
          {state.message}
        </p>
      )}

      <Turnstile />

      <button
        type="submit"
        disabled={isPending}
        className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
      >
        {isPending ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} aria-hidden />}
        Выслать ссылку для сброса
      </button>
    </form>
  );
}
