"use client";

import { useActionState } from "react";
import { Loader2, Save } from "lucide-react";

import {
  updateProfileAction,
  updateUsernameAction,
  updatePasswordAction,
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

export function ProfileForm({
  defaultName,
  defaultImage,
}: {
  defaultName: string;
  defaultImage: string;
}) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="profile-name" className="text-sm font-semibold text-stone-800">
          Отображаемое имя
        </label>
        <input
          id="profile-name"
          name="name"
          type="text"
          required
          maxLength={80}
          defaultValue={defaultName}
          className="focus-ring mt-1.5 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-base"
        />
      </div>
      <div>
        <label htmlFor="profile-image" className="text-sm font-semibold text-stone-800">
          Ссылка на аватар <span className="font-normal text-stone-400">(необязательно)</span>
        </label>
        <input
          id="profile-image"
          name="image"
          type="url"
          maxLength={512}
          defaultValue={defaultImage}
          placeholder="https://…"
          className="focus-ring mt-1.5 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-base placeholder:text-stone-400"
        />
        <p className="mt-1 text-xs text-stone-400">
          Только https. Пустое поле — аватар из инициалов.
        </p>
      </div>
      <FormMessage state={state} />
      <button
        type="submit"
        disabled={isPending}
        className="focus-ring inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
      >
        {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Сохранить
      </button>
    </form>
  );
}

export function UsernameForm({ defaultUsername }: { defaultUsername: string }) {
  const [state, formAction, isPending] = useActionState(updateUsernameAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="username" className="text-sm font-semibold text-stone-800">
          Логин на форуме
        </label>
        <div className="mt-1.5 flex">
          <span className="inline-flex items-center rounded-l-xl border border-r-0 border-stone-200 bg-stone-50 px-4 text-stone-400">
            @
          </span>
          <input
            id="username"
            name="username"
            type="text"
            required
            pattern="[A-Za-z0-9_]{3,24}"
            defaultValue={defaultUsername}
            className="focus-ring w-full rounded-r-xl border border-stone-200 px-4 py-2.5 text-base"
          />
        </div>
        <p className="mt-1 text-xs text-stone-400">
          Логин фигурирует в ссылках на профиль. Меняйте осознанно.
        </p>
      </div>
      <FormMessage state={state} />
      <button
        type="submit"
        disabled={isPending}
        className="focus-ring inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:border-orange-300 hover:text-orange-800 disabled:opacity-60"
      >
        {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Обновить логин
      </button>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction, isPending] = useActionState(updatePasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-4" autoComplete="off">
      <div>
        <label htmlFor="current-password" className="text-sm font-semibold text-stone-800">
          Текущий пароль
        </label>
        <input
          id="current-password"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="focus-ring mt-1.5 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-base"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="new-password" className="text-sm font-semibold text-stone-800">
            Новый пароль
          </label>
          <input
            id="new-password"
            name="newPassword"
            type="password"
            required
            autoComplete="new-password"
            className="focus-ring mt-1.5 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-base"
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className="text-sm font-semibold text-stone-800">
            Повторите
          </label>
          <input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            className="focus-ring mt-1.5 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-base"
          />
        </div>
      </div>
      <FormMessage state={state} />
      <button
        type="submit"
        disabled={isPending}
        className="focus-ring inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-amber-300 transition-colors hover:bg-stone-800 disabled:opacity-60"
      >
        {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Изменить пароль
      </button>
    </form>
  );
}
