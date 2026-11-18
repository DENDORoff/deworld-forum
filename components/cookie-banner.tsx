"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "dw_cookie_consent_v1";

interface ConsentState {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  ts: number;
}

function readConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed && typeof parsed.analytics === "boolean") return parsed;
    return null;
  } catch {
    return null;
  }
}

/**
 * Баннер согласия на Cookie (152-ФЗ).
 * Не включённые согласия по умолчанию отключены — никаких тёмных паттернов.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    // Откладываем чтение localStorage, чтобы не вызывать setState синхронно в эффекте
    const initial = window.setTimeout(() => setVisible(readConsent() === null), 0);
    const openSettings = () => {
      const current = readConsent();
      setAnalytics(current?.analytics ?? false);
      setMarketing(current?.marketing ?? false);
      setSettingsOpen(true);
      setVisible(true);
    };
    window.addEventListener("dw:open-cookie-settings", openSettings);
    return () => {
      window.clearTimeout(initial);
      window.removeEventListener("dw:open-cookie-settings", openSettings);
    };
  }, []);

  const save = useCallback((state: Omit<ConsentState, "ts" | "necessary">) => {
    const payload: ConsentState = { necessary: true, ...state, ts: Date.now() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Приватный режим — просто скрыть баннер на эту сессию
    }
    setVisible(false);
    setSettingsOpen(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Согласие на использование файлов Cookie"
      className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4"
    >
      <div className="mx-auto max-w-4xl rounded-2xl border border-orange-200/80 bg-white/97 p-4 shadow-2xl shadow-orange-900/10 backdrop-blur">
        {!settingsOpen ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <Cookie className="mt-0.5 shrink-0 text-orange-500" size={22} aria-hidden />
              <div className="text-sm leading-snug text-stone-700">
                <p className="font-semibold text-stone-900">Мы используем Cookie</p>
                <p className="mt-0.5">
                  Необходимые — для входа и безопасности. Аналитические и маркетинговые — только
                  с вашего согласия.{" "}
                  <Link href="/legal/cookies" className="underline underline-offset-2 hover:text-orange-700">
                    Подробнее
                  </Link>
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => save({ analytics: false, marketing: false })}
                className="focus-ring rounded-xl border border-stone-200 px-3.5 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
              >
                Только необходимые
              </button>
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="focus-ring rounded-xl border border-stone-200 px-3.5 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
              >
                Настроить
              </button>
              <button
                type="button"
                onClick={() => save({ analytics: true, marketing: true })}
                className="focus-ring rounded-xl bg-orange-500 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
              >
                Принять все
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-stone-700">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 font-semibold text-stone-900">
                <Cookie size={18} className="text-orange-500" aria-hidden /> Настройки Cookie
              </p>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                aria-label="Закрыть настройки"
                className="focus-ring rounded-lg p-1.5 text-stone-500 hover:bg-stone-100"
              >
                <X size={18} />
              </button>
            </div>

            <ul className="mt-3 divide-y divide-stone-100 rounded-xl border border-stone-100">
              <li className="flex items-center justify-between gap-4 p-3">
                <span>
                  <span className="block font-medium text-stone-900">Необходимые</span>
                  <span className="text-xs text-stone-500">Сессия входа, безопасность, работа сайта. Всегда включены.</span>
                </span>
                <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-800">
                  Всегда
                </span>
              </li>
              <li className="flex items-center justify-between gap-4 p-3">
                <span>
                  <span className="block font-medium text-stone-900">Аналитические</span>
                  <span className="text-xs text-stone-500">Обезличенная статистика посещений (только после согласия).</span>
                </span>
                <Toggle checked={analytics} onChange={setAnalytics} label="Аналитические Cookie" />
              </li>
              <li className="flex items-center justify-between gap-4 p-3">
                <span>
                  <span className="block font-medium text-stone-900">Маркетинговые</span>
                  <span className="text-xs text-stone-500">Оценка эффективности промо-материалов (только после согласия).</span>
                </span>
                <Toggle checked={marketing} onChange={setMarketing} label="Маркетинговые Cookie" />
              </li>
            </ul>

            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => save({ analytics: false, marketing: false })}
                className="focus-ring rounded-xl border border-stone-200 px-3.5 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Только необходимые
              </button>
              <button
                type="button"
                onClick={() => save({ analytics, marketing })}
                className="focus-ring rounded-xl bg-orange-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-orange-600"
              >
                Сохранить выбор
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`focus-ring relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        checked ? "bg-orange-500" : "bg-stone-200"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}
