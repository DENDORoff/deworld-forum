"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // В production ошибку следует отправлять в Sentry/логи — сейчас просто в консоль
    console.error("[deworld] unexpected error", error);
  }, [error]);

  return (
    <section className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6" role="alert">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
        <AlertTriangle size={30} aria-hidden />
      </span>
      <h1 className="mt-5 font-display text-2xl text-stone-900">Что-то сломалось</h1>
      <p className="mt-2 text-stone-600">
        Мы уже знаем об ошибке. Попробуйте обновить страницу — обычно помогает. Если нет —
        напишите в{" "}
        <Link href="/forum/support" className="font-semibold text-orange-800 hover:underline">
          «Поддержке»
        </Link>
        .
      </p>
      {error.digest && (
        <p className="mt-3 text-xs text-stone-400">
          Код ошибки: <code className="rounded bg-stone-100 px-2 py-0.5">{error.digest}</code>
        </p>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="focus-ring inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
        >
          <RotateCcw size={17} aria-hidden />
          Попробовать снова
        </button>
        <Link
          href="/"
          className="focus-ring inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3 font-semibold text-stone-700 transition-colors hover:border-orange-300 hover:text-orange-800"
        >
          <Home size={17} aria-hidden />
          На главную
        </Link>
      </div>
    </section>
  );
}
