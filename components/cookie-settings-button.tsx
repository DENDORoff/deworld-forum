"use client";

/** Кнопка в футере: открывает баннер согласия на Cookie повторно. */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() =>
        window.dispatchEvent(new CustomEvent("dw:open-cookie-settings"))
      }
    >
      Настройки Cookie
    </button>
  );
}
