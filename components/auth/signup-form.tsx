"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, Loader2, ShieldCheck, UserPlus } from "lucide-react";

import { registerAction, type AuthFormState } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

const initialState: AuthFormState = { status: "idle" };

function passwordChecks(password: string) {
  return [
    { ok: password.length >= 8, label: "минимум 8 символов" },
    { ok: /[a-zA-Zа-яА-ЯёЁ]/.test(password), label: "хотя бы одна буква" },
    { ok: /[0-9]/.test(password), label: "хотя бы одна цифра" },
  ];
}

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const checks = passwordChecks(password);
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div>
        <label htmlFor="username" className="text-sm font-semibold text-stone-800">
          Логин на форуме
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          autoComplete="username"
          pattern="[A-Za-z0-9_]{3,24}"
          placeholder="Steve_2026"
          aria-invalid={Boolean(fieldErrors.username)}
          aria-describedby={fieldErrors.username ? "username-error" : undefined}
          className="focus-ring mt-1.5 w-full rounded-xl border border-stone-200 px-4 py-3 text-base placeholder:text-stone-400"
        />
        {fieldErrors.username ? (
          <p id="username-error" role="alert" className="mt-1 text-xs text-red-600">
            {fieldErrors.username}
          </p>
        ) : (
          <p className="mt-1 text-xs text-stone-400">Латиница, цифры и «_», 3–24 символа</p>
        )}
      </div>

      <div>
        <label htmlFor="reg-email" className="text-sm font-semibold text-stone-800">
          Email
        </label>
        <input
          id="reg-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
          className="focus-ring mt-1.5 w-full rounded-xl border border-stone-200 px-4 py-3 text-base placeholder:text-stone-400"
        />
        {fieldErrors.email && (
          <p id="email-error" role="alert" className="mt-1 text-xs text-red-600">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="reg-password" className="text-sm font-semibold text-stone-800">
          Пароль
        </label>
        <div className="relative mt-1.5">
          <input
            id="reg-password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            placeholder="Придумайте надёжный пароль"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            className="focus-ring w-full rounded-xl border border-stone-200 px-4 py-3 pr-12 text-base placeholder:text-stone-400"
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
        {fieldErrors.password && (
          <p role="alert" className="mt-1 text-xs text-red-600">
            {fieldErrors.password}
          </p>
        )}
      </div>

      <fieldset className="space-y-2 rounded-xl border border-stone-100 bg-stone-50/60 p-4">
        <legend className="sr-only">Согласия</legend>
        <label htmlFor="consent" className="flex cursor-pointer items-start gap-3 text-sm text-stone-700">
          <input
            id="consent"
            name="consent"
            type="checkbox"
            required
            className="mt-0.5 h-4 w-4 shrink-0 accent-orange-500"
            aria-invalid={Boolean(fieldErrors.consent)}
          />
          <span>
            Я соглашаюсь с{" "}
            <Link href="/legal/terms" className="font-semibold text-orange-800 hover:underline" target="_blank">
              Условиями использования
            </Link>{" "}
            и{" "}
            <Link href="/legal/consent" className="font-semibold text-orange-800 hover:underline" target="_blank">
              политикой обработки персональных данных
            </Link>
            <span aria-hidden="true"> *</span>
          </span>
        </label>
        <label htmlFor="ageConsent" className="flex cursor-pointer items-start gap-3 text-sm text-stone-700">
          <input
            id="ageConsent"
            name="ageConsent"
            type="checkbox"
            required
            className="mt-0.5 h-4 w-4 shrink-0 accent-orange-500"
            aria-invalid={Boolean(fieldErrors.ageConsent)}
          />
          <span>
            Мне исполнилось <strong>14 лет</strong>, или я действую с согласия родителей
            <span aria-hidden="true"> *</span>
          </span>
        </label>
      </fieldset>

      {state.status === "error" && state.message && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 font-semibold text-white shadow-sm shadow-orange-500/30 transition-colors hover:bg-orange-600 disabled:opacity-60"
      >
        {isPending ? (
          <Loader2 size={18} className="animate-spin" aria-hidden />
        ) : (
          <UserPlus size={18} aria-hidden />
        )}
        Создать аккаунт
      </button>
    </form>
  );
}
