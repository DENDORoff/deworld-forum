import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/** Обёртка для юридических страниц: единая сетка, дата обновления, возврат. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/"
        className="focus-ring inline-flex items-center gap-1 text-sm text-stone-500 hover:text-orange-800"
      >
        <ChevronLeft size={15} aria-hidden />
        На главную
      </Link>
      <h1 className="mt-4 font-display text-3xl text-stone-900">{title}</h1>
      <p className="mt-1 text-xs uppercase tracking-wide text-stone-400">
        Последнее обновление: {updated}
      </p>
      <div className="prose-legal mt-6 space-y-6 text-[15px] leading-relaxed text-stone-700">
        {children}
      </div>
    </section>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-lg text-stone-900">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
