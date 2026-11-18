"use client";

import { useActionState } from "react";
import { Link2, Link2Off, Loader2, Sword } from "lucide-react";

import {
  linkMinecraftAction,
  unlinkMinecraftAction,
  type SettingsFormState,
} from "@/lib/actions/settings";
import { cn } from "@/lib/utils";

const initialState: SettingsFormState = { status: "idle" };

export function MinecraftSection({
  enabled,
  minecraftUsername,
}: {
  enabled: boolean;
  minecraftUsername: string | null;
}) {
  const [state, formAction, isPending] = useActionState(linkMinecraftAction, initialState);

  if (minecraftUsername) {
    return (
      <div>
        <p className="flex items-center gap-2 font-semibold text-stone-900">
          <Sword size={18} className="text-orange-500" aria-hidden />
          Привязан ник <span className="text-orange-800">{minecraftUsername}</span>
        </p>
        <p className="mt-1.5 text-sm text-stone-600">
          По этому нику вы можете входить на форум паролем LimboAuth; статистика и достижения
          привязываются к нику.
        </p>
        <form action={unlinkMinecraftAction} className="mt-4">
          <button
            type="submit"
            className="focus-ring inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:border-red-300 hover:text-red-700"
          >
            <Link2Off size={16} aria-hidden />
            Отвязать ник
          </button>
        </form>
      </div>
    );
  }

  if (!enabled) {
    return (
      <p className="text-sm text-stone-500">
        Привязка Minecraft-аккаунта скоро будет доступна: требуется подключение форума к базе
        LimboAuth (LIMBOAUTH_DATABASE_URL).
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <p className="text-sm text-stone-600">
        Введите ник и пароль от LimboAuth — те же, что при входе на сервер. Пароль не
        сохраняется, сверяется только хэш.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="nickname"
          type="text"
          required
          pattern="[A-Za-z0-9_]{3,16}"
          placeholder="Ник Minecraft"
          className="focus-ring rounded-xl border border-stone-200 px-4 py-2.5 text-base placeholder:text-stone-400"
        />
        <input
          name="password"
          type="password"
          required
          autoComplete="off"
          placeholder="Пароль LimboAuth"
          className="focus-ring rounded-xl border border-stone-200 px-4 py-2.5 text-base placeholder:text-stone-400"
        />
      </div>
      {state.status !== "idle" && state.message && (
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
      )}
      <button
        type="submit"
        disabled={isPending}
        className="focus-ring inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-amber-300 transition-colors hover:bg-stone-800 disabled:opacity-60"
      >
        {isPending ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
        Привязать аккаунт
      </button>
    </form>
  );
}
