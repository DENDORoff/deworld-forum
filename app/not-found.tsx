import Link from "next/link";
import { Home, MessageSquare } from "lucide-react";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <p
        aria-hidden
        className="font-display select-none text-8xl leading-none text-orange-200"
      >
        404
      </p>
      <h1 className="mt-4 font-display text-2xl text-stone-900">Такого блока в мире нет</h1>
      <p className="mt-2 text-stone-600">
        Страница не найдена или была перемещена. Возможно, ссылка устарела.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="focus-ring inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
        >
          <Home size={17} aria-hidden />
          На главную
        </Link>
        <Link
          href="/forum"
          className="focus-ring inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3 font-semibold text-stone-700 transition-colors hover:border-orange-300 hover:text-orange-800"
        >
          <MessageSquare size={17} aria-hidden />
          Форум
        </Link>
      </div>
    </section>
  );
}
