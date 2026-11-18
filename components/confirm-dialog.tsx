"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Промис-based диалог подтверждения вместо window.confirm.
 * Использование: const ok = await confirm("Заголовок", "Описание");
 * Требует <ConfirmDialog /> в дереве (подключён в корневом layout).
 */

interface ConfirmRequest {
  title: string;
  message: string;
  resolve: (value: boolean) => void;
}

export function confirm(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    window.dispatchEvent(
      new CustomEvent<ConfirmRequest>("dw:confirm", {
        detail: { title, message, resolve },
      }),
    );
    // Страховка от потерянного resolve
    window.setTimeout(() => resolve(false), 60_000);
  });
}

export function ConfirmDialog() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as ConfirmRequest;
      setRequest(detail);
    };
    window.addEventListener("dw:confirm", handler);
    return () => window.removeEventListener("dw:confirm", handler);
  }, []);

  useEffect(() => {
    if (!request) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        request.resolve(false);
        setRequest(null);
      }
      if (event.key === "Enter") {
        request.resolve(true);
        setRequest(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [request]);

  if (!request) return null;

  const close = (value: boolean) => {
    request.resolve(value);
    setRequest(null);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Закрыть"
        onClick={() => close(false)}
        className="absolute inset-0 bg-stone-950/50 backdrop-blur-[2px]"
      />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-label={request.title}
        aria-describedby="confirm-message"
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertTriangle size={20} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="font-semibold text-stone-900">{request.title}</h2>
            <p id="confirm-message" className="mt-1 text-sm leading-relaxed text-stone-600">
              {request.message}
            </p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => close(false)}
            className="focus-ring rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Отмена
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => close(true)}
            className="focus-ring rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}
