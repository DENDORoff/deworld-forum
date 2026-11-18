import { Logo } from "@/components/logo";

/** Заглушка шапки на время потоковой загрузки сессии. */
export function SiteHeaderSkeleton() {
  return (
    <header
      aria-hidden
      className="sticky top-0 z-50 h-16 border-b border-orange-100/80 bg-white/85 backdrop-blur-md"
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <div className="skeleton h-9 w-40" />
      </div>
    </header>
  );
}
