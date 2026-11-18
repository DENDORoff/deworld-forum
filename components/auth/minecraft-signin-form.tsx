"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Eye, EyeOff, Loader2, Sword } from "lucide-react";

import { minecraftSignInAction, type AuthFormState } from "@/lib/actions/auth";

const initialState: AuthFormState = { status: "idle" };

/** Вход ником Minecraft + паролем LimboAuth. Виден, только если интеграция включена. */
export function MinecraftSignInForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, isPending] = useActionState(minecraftSignInAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div>
        <label htmlFor="mc-username" className="text-sm font-semibold text-stone-800">
          Ник в Minecraft
        </label>
        <input
          id="mc-username"
          name="username"
          type="text"
          required
          autoComplete="username"
          pattern="[A-Za-z0-9_]{3,16}"
          placeholder="Steve_2026"
          className="focus-ring mt-1.5 w-full rounded-xl border border-stone-200 px-4 py-3 text-base placeholder:text-stone-400"
        />
      </div>

      <div>
        <label htmlFor="mc-password" className="text-sm font-semibold text-stone-800">
          Пароль LimboAuth
        </label>
        <div className="relative mt-1.5">
          <input
            id="mc-password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="Пароль от входа на сервер"
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
        <p className="mt-1 text-xs text-stone-500">
          Это тот же пароль, что и при первом входе на сервер (LimboAuth). Мы не храним его —
          только сверяем хэш в базе LimboAuth.
        </p>
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
        className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-3.5 font-semibold text-amber-300 transition-colors hover:bg-stone-800 disabled:opacity-60"
      >
        {isPending ? (
          <Loader2 size={18} className="animate-spin" aria-hidden />
        ) : (
          <Sword size={18} aria-hidden />
        )}
        Войти в DEWORLD
      </button>
    </form>
  );
}
