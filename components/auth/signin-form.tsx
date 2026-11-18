"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Eye, EyeOff, Loader2, LogIn } from "lucide-react";

import { signInAction, type AuthFormState } from "@/lib/actions/auth";

const initialState: AuthFormState = { status: "idle" };

/** Форма входа по email + пароль + (опционально) код 2FA. */
export function SignInForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showTotp, setShowTotp] = useState(false);
  // Контролируемые поля: сохраняем введённые данные после неудачного сабмита
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");

  // Раскрываем поле 2FA сразу, если сервер попросил код (корректировка во время рендера)
  const [totpPromptShown, setTotpPromptShown] = useState(false);
  if (state.totpRequired && !totpPromptShown) {
    setTotpPromptShown(true);
    setShowTotp(true);
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div>
        <label htmlFor="email" className="text-sm font-semibold text-stone-800">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="focus-ring mt-1.5 w-full rounded-xl border border-stone-200 px-4 py-3 text-base placeholder:text-stone-400"
        />
      </div>

      <div>
        <label htmlFor="password" className="text-sm font-semibold text-stone-800">
          Пароль
        </label>
        <div className="relative mt-1.5">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="Ваш пароль"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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
      </div>

      {showTotp ? (
        <div>
          <label htmlFor="totp" className="text-sm font-semibold text-stone-800">
            Код из приложения-аутентификатора
          </label>
          <input
            id="totp"
            name="totp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]{6,7}"
            maxLength={7}
            placeholder="123456"
            value={totp}
            onChange={(event) => setTotp(event.target.value)}
            className="focus-ring mt-1.5 w-full rounded-xl border border-orange-300 bg-orange-50/40 px-4 py-3 text-base tracking-[0.3em] placeholder:text-stone-400"
          />
          <p className="mt-1 text-xs text-stone-500">
            Откройте Google Authenticator / Aegis и введите 6-значный код.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowTotp(true)}
          className="focus-ring text-xs font-medium text-stone-500 underline underline-offset-2 hover:text-orange-700"
        >
          У меня включена двухфакторная аутентификация
        </button>
      )}

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
          <LogIn size={18} aria-hidden />
        )}
        Войти
      </button>
    </form>
  );
}
