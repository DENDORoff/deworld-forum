"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

import { resetPasswordAction, type ResetFormState } from "@/lib/actions/password-reset";
import { cn } from "@/lib/utils";

const initialState: ResetFormState = { status: "idle" };

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(resetPasswordAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const checks = [
    { ok: password.length >= 8, label: "минимум 8 символов" },
    { ok: /[a-zA-Zа-яА-ЯёЁ]/.test(password), label: "хотя бы одна буква" },
    { ok: /[0-9]/.test(password), label: "хотя бы одна цифра" },
  ];

  if (state.status === "success") {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <ShieldCheck size={28} aria-hidden />
        </span>
        <h2 className="mt-4 font-semibold text-stone-900">Пароль обновлён</h2>
        <p className="mt-1.5 text-sm text-stone-600">{state.message}</p>
        <button
          type="button"
          onClick={() => router.push("/signin")}
          className="focus-ring mt-6 rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600"
        >
          Войти с новым паролем
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />

      <div>
        <label htmlFor="new-password" className="text-sm font-semibold text-stone-800">
          Новый пароль
        </label>
        <div className="relative mt-1.5">
          <input
            id="new-password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="focus-ring w-full rounded-xl border border-stone-200 px-4 py-3 pr-12 text-base"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-stone-400 hover:text-stone-700"
          >
            {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>
        <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1" aria-live="polite">
          {checks.map((check) => (
            <li
              key={check.label}
              className={cn(
                "flex items-center gap-1 text-xs",
                check.ok ? "text-emerald-700" : "text-stone-400",
              )}
            >
              <ShieldCheck size={12} aria-hidden />
              {check.label}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <label htmlFor="confirm-password" className="text-sm font-semibold text-stone-800">
          Повторите пароль
        </label>
        <input
          id="confirm-password"
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          required
          autoComplete="new-password"
          className="focus-ring mt-1.5 w-full rounded-xl border border-stone-200 px-4 py-3 text-base"
        />
      </div>

      {state.status === "error" && state.message && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
      >
        {isPending ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} aria-hidden />}
        Сохранить новый пароль
      </button>

      <p className="text-center text-xs text-stone-500">
        <Link href="/signin" className="underline underline-offset-2 hover:text-orange-800">
          Вспомнил пароль — войти
        </Link>
      </p>
    </form>
  );
}
