import { Crown, ShieldCheck, User } from "lucide-react";

import { cn, isPremiumActive } from "@/lib/utils";
import type { Role } from "@/generated/prisma/enums";

/** Компактный бейдж роли/статуса: Администратор / Модератор / Премиум / Пользователь. */
export function RoleBadge({
  role,
  premiumUntil,
  className,
}: {
  role: Role;
  premiumUntil?: Date | string | null;
  className?: string;
}) {
  const premium = isPremiumActive({ premiumUntil });

  if (role === "ADMIN") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700 ring-1 ring-red-200",
          className,
        )}
      >
        <ShieldCheck size={10} aria-hidden /> Админ
      </span>
    );
  }
  if (role === "MODERATOR") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700 ring-1 ring-sky-200",
          className,
        )}
      >
        <ShieldCheck size={10} aria-hidden /> Модер
      </span>
    );
  }
  if (premium) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 ring-1 ring-amber-300",
          className,
        )}
      >
        <Crown size={10} aria-hidden /> Премиум
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-600",
        className,
      )}
    >
      <User size={10} aria-hidden /> Игрок
    </span>
  );
}
