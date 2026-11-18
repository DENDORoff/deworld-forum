"use client";

import { useActionState, useState } from "react";
import { Check, Crown, Loader2, ShieldCheck } from "lucide-react";

import {
  grantPremiumAction,
  setUserRoleAction,
  type AdminFormState,
} from "@/lib/actions/admin";
import type { Role } from "@/generated/prisma/enums";

const initialState: AdminFormState = { status: "idle" };

export function RoleSelect({
  userId,
  currentRole,
  isSelf,
}: {
  userId: string;
  currentRole: Role;
  isSelf: boolean;
}) {
  const [state, formAction, isPending] = useActionState(setUserRoleAction, initialState);
  const [role, setRole] = useState<Role>(currentRole);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <label className="sr-only" htmlFor={`role-${userId}`}>
        Роль пользователя
      </label>
      <select
        id={`role-${userId}`}
        name="role"
        value={role}
        onChange={(event) => setRole(event.target.value as Role)}
        disabled={isSelf || isPending}
        className="focus-ring rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs font-medium text-stone-800 disabled:opacity-50"
      >
        <option value="USER">Пользователь</option>
        <option value="MODERATOR">Модератор</option>
        <option value="ADMIN">Администратор</option>
      </select>
      <button
        type="submit"
        disabled={isSelf || isPending || role === currentRole}
        title={isSelf ? "Нельзя сменить свою роль" : "Сохранить роль"}
        aria-label="Сохранить роль"
        className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-500 transition-colors hover:border-orange-300 hover:text-orange-800 disabled:opacity-40"
      >
        {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
      </button>
      {state.status === "error" && state.message && (
        <span role="alert" className="text-xs text-red-600">{state.message}</span>
      )}
    </form>
  );
}

export function PremiumControls({
  userId,
  activeUntil,
}: {
  userId: string;
  activeUntil: Date | string | null;
}) {
  const [state, formAction, isPending] = useActionState(grantPremiumAction, initialState);
  const active = activeUntil && new Date(activeUntil) > new Date();

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      {active ? (
        <>
          <input type="hidden" name="days" value="0" />
          <button
            type="submit"
            disabled={isPending}
            title="Отозвать премиум"
            className="focus-ring inline-flex h-8 items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-50"
          >
            {isPending ? <Loader2 size={13} className="animate-spin" /> : <Crown size={13} />}
            Премиум
          </button>
        </>
      ) : (
        <>
          <input type="hidden" name="days" value="30" />
          <button
            type="submit"
            disabled={isPending}
            title="Выдать премиум на 30 дней"
            className="focus-ring inline-flex h-8 items-center gap-1 rounded-lg border border-stone-200 px-2 text-xs font-semibold text-stone-600 transition-colors hover:border-amber-300 hover:text-amber-800 disabled:opacity-50"
          >
            {isPending ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
            +30 дней
          </button>
        </>
      )}
      {state.status !== "idle" && state.message && (
        <span role="status" className="hidden text-xs text-stone-500 xl:inline">{state.message}</span>
      )}
    </form>
  );
}
