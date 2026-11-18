"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import {
  BadgeCheck,
  Loader2,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Wand2,
} from "lucide-react";

import {
  totpConfirmAction,
  totpDisableAction,
  totpStartAction,
  type SettingsFormState,
} from "@/lib/actions/settings";
import { cn } from "@/lib/utils";

const initialState: SettingsFormState = { status: "idle" };

function FormMessage({ state }: { state: SettingsFormState }) {
  if (state.status === "idle" || !state.message) return null;
  return (
    <p
      role="alert"
      className={cn(
        "rounded-xl border px-4 py-2.5 text-sm",
        state.status === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800",
      )}
    >
      {state.message}
    </p>
  );
}

export function TotpSection({
  totpEnabled,
  qrDataUrl,
  manualSecret,
}: {
  totpEnabled: boolean;
  /** Заполнено, если пользователь начал подключение, но не подтвердил код */
  qrDataUrl: string | null;
  manualSecret: string | null;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [confirmState, confirmAction, isConfirming] = useActionState(totpConfirmAction, initialState);
  const [disableState, disableAction, isDisabling] = useActionState(totpDisableAction, initialState);

  if (totpEnabled) {
    return (
      <div>
        <p className="flex items-center gap-2 font-semibold text-emerald-800">
          <BadgeCheck size={18} aria-hidden /> 2FA включена
        </p>
        <p className="mt-1.5 text-sm text-stone-600">
          При входе с паролем сервер запросит код из вашего приложения-аутентификатора.
        </p>
        <form action={disableAction} className="mt-4 space-y-3 border-t border-stone-100 pt-4">
          <p className="text-sm font-semibold text-stone-800">Отключить 2FA</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Пароль"
              className="focus-ring rounded-xl border border-stone-200 px-4 py-2.5 text-base placeholder:text-stone-400"
            />
            <input
              name="token"
              type="text"
              required
              inputMode="numeric"
              pattern="[0-9 ]{6,7}"
              placeholder="Код из приложения"
              className="focus-ring rounded-xl border border-stone-200 px-4 py-2.5 text-base tracking-[0.2em] placeholder:text-stone-400"
            />
          </div>
          <FormMessage state={disableState} />
          <button
            type="submit"
            disabled={isDisabling}
            className="focus-ring inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60"
          >
            {isDisabling ? <Loader2 size={16} className="animate-spin" /> : <ShieldOff size={16} />}
            Отключить 2FA
          </button>
        </form>
      </div>
    );
  }

  if (qrDataUrl && manualSecret) {
    return (
      <div>
        <p className="flex items-center gap-2 font-semibold text-stone-900">
          <Smartphone size={18} className="text-orange-500" aria-hidden /> Отсканируйте QR-код
        </p>
        <p className="mt-1.5 text-sm text-stone-600">
          Google Authenticator, Aegis, 1Password — любое TOTP-приложение. Если камера недоступна,
          введите ключ вручную.
        </p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Image
            src={qrDataUrl}
            alt="QR-код для подключения двухфакторной аутентификации"
            width={180}
            height={180}
            className="rounded-xl border border-stone-200"
            unoptimized
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
              Ключ вручную
            </p>
            <code className="mt-1 block select-all break-all rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-800">
              {manualSecret}
            </code>
          </div>
        </div>

        <form action={confirmAction} className="mt-4 space-y-3">
          <label htmlFor="totp-token" className="text-sm font-semibold text-stone-800">
            Введите 6-значный код из приложения
          </label>
          <input
            id="totp-token"
            name="token"
            type="text"
            required
            inputMode="numeric"
            pattern="[0-9 ]{6,7}"
            autoComplete="one-time-code"
            placeholder="123456"
            className="focus-ring w-full max-w-48 rounded-xl border border-stone-200 px-4 py-2.5 text-base tracking-[0.3em]"
          />
          <FormMessage state={confirmState} />
          <button
            type="submit"
            disabled={isConfirming}
            className="focus-ring inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
          >
            {isConfirming ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            Подтвердить и включить
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-stone-600">
        Двухфакторная аутентификация защищает аккаунт даже при утечке пароля: вход потребует
        одноразовый код из приложения на вашем телефоне.
      </p>
      <form action={totpStartAction} className="mt-4">
        <button
          type="submit"
          onClick={() => setIsGenerating(true)}
          disabled={isGenerating}
          className="focus-ring inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-amber-300 transition-colors hover:bg-stone-800 disabled:opacity-60"
        >
          {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
          Подключить 2FA
        </button>
      </form>
    </div>
  );
}
