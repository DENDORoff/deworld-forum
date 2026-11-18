"use client";

import { useState, type ReactNode } from "react";
import { Mail, Sword } from "lucide-react";

import { cn } from "@/lib/utils";

/** Вкладки способа входа: email / Minecraft. Показываем только доступные. */
export function SignInTabs({
  minecraftEnabled,
  emailForm,
  minecraftForm,
}: {
  minecraftEnabled: boolean;
  emailForm: ReactNode;
  minecraftForm: ReactNode;
}) {
  const [tab, setTab] = useState<"email" | "minecraft">("email");

  if (!minecraftEnabled) {
    return <div>{emailForm}</div>;
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Способ входа"
        className="grid grid-cols-2 gap-1 rounded-xl bg-orange-50 p-1"
      >
        {(
          [
            { id: "email", label: "По email", icon: Mail },
            { id: "minecraft", label: "Minecraft", icon: Sword },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "focus-ring flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors",
              tab === id
                ? "bg-white text-orange-800 shadow-sm ring-1 ring-orange-200"
                : "text-stone-500 hover:text-stone-800",
            )}
          >
            <Icon size={16} aria-hidden />
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="mt-5">
        {tab === "email" ? emailForm : minecraftForm}
      </div>
    </div>
  );
}
