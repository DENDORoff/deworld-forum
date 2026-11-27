"use client";

import { useActionState } from "react";
import { Link2, Link2Off, Loader2, RefreshCw, Sword } from "lucide-react";

import {
  linkMinecraftAction,
  refreshMinecraftSkinAvatarAction,
  unlinkMinecraftAction,
  type SettingsFormState,
} from "@/lib/actions/settings";
import { cn } from "@/lib/utils";

const initialState: SettingsFormState = { status: "idle" };

function StatusMessage({ state }: { state: SettingsFormState }) {
  if (state.status === "idle" || !state.message) return null;
  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
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

export function MinecraftSection({
  enabled,
  minecraftUsername,
}: {
  enabled: boolean;
  minecraftUsername: string | null;
}) {
  const [linkState, linkFormAction, isLinkPending] = useActionState(
    linkMinecraftAction,
    initialState,
  );
  const [avatarState, avatarFormAction, isAvatarPending] = useActionState(
    refreshMinecraftSkinAvatarAction,
    initialState,
  );

  if (minecraftUsername) {
    return (
      <div>
        <p className="flex items-center gap-2 font-semibold text-stone-900">
          <Sword size={18} className="text-orange-500" aria-hidden />
          Привязан ник <span className="text-orange-800">{minecraftUsername}</span>
        </p>
        <p className="mt-1.5 text-sm text-stone-600">
          По этому нику вы можете входить на форум паролем LimboAuth; статистика и достижения
          привязываются к нику. Аватар автоматически станет головой вашего скина, если не задано
          собственное изображение.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <form action={avatarFormAction}>
            <button
              type="submit"
              disabled={isAvatarPending}
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-amber-300 transition-colors hover:bg-stone-800 disabled:opacity-60"
            >
              {isAvatarPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              Обновить аватар по скину
            </button>
          </form>
          <form action={unlinkMinecraftAction}>
            <button
              type="submit"
              className="focus-ring inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:border-red-300 hover:text-red-700"
            >
              <Link2Off size={16} aria-hidden />
              Отвязать ник
            </button>
          </form>
        </div>
        <div className="mt-3">
          <StatusMessage state={avatarState} />
        </div>
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
    <form action={linkFormAction} className="space-y-3">
      <p className="text-sm text-stone-600">
        Введите ник и пароль от LimboAuth — те же, что при входе на сервер. Пароль не
        сохраняется, сверяется только хэш. После привязки аватар автоматически станет головой
        скина, если у вас нет собственного изображения.
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
      <StatusMessage state={linkState} />
      <button
        type="submit"
        disabled={isLinkPending}
        className="focus-ring inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-amber-300 transition-colors hover:bg-stone-800 disabled:opacity-60"
      >
        {isLinkPending ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
        Привязать аккаунт
      </button>
    </form>
  );
}
