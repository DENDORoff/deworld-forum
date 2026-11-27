"use client";

import { useEffect, useState } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";

import {
  THEME_CHOICES,
  THEME_LABELS,
  THEME_STORAGE_KEY,
  type ThemeChoice,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

const ICONS = { system: Monitor, light: Sun, dark: Moon } as const;

function applyTheme(choice: ThemeChoice) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const effective = choice === "system" ? (prefersDark ? "dark" : "light") : choice;
  document.documentElement.dataset.themeChoice = choice;
  document.documentElement.dataset.theme = effective;
}

/** Переключатель темы: системная / светлая / тёмная. */
export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>("system");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "system" || stored === "light" || stored === "dark") {
      applyTheme(stored);
      queueMicrotask(() => setChoice(stored));
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const current = (window.localStorage.getItem(THEME_STORAGE_KEY) ?? "system") as ThemeChoice;
      if (current === "system") applyTheme("system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const choose = (next: ThemeChoice) => {
    setChoice(next);
    applyTheme(next);
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <fieldset>
        <legend className="text-sm font-semibold text-stone-800">
          Оформление
        </legend>
        <p className="mt-1 text-sm text-stone-500">
          «Системная» следует настройкам вашего устройства и меняется автоматически.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {THEME_CHOICES.map((value) => {
            const Icon = ICONS[value];
            const active = choice === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => choose(value)}
                aria-pressed={active}
                className={cn(
                  "focus-ring flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-colors",
                  active
                    ? "border-orange-400 bg-orange-50 text-orange-900 ring-2 ring-orange-200"
                    : "border-stone-200 bg-white text-stone-600 hover:border-orange-300 hover:text-orange-800",
                )}
              >
                <Icon size={17} aria-hidden />
                {THEME_LABELS[value]}
                {active && <Check size={14} aria-hidden />}
              </button>
            );
          })}
        </div>
      </fieldset>
      {saved && (
        <p role="status" className="mt-2 text-sm text-emerald-700">
          Тема сохранена на этом устройстве.
        </p>
      )}
    </div>
  );
}
