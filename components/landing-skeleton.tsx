/** Скелетон главной страницы: вместо спинера показываем структуру контента. */
export function LandingSkeleton() {
  return (
    <div aria-hidden>
      {/* Hero */}
      <div className="bg-gradient-to-b from-orange-50/80 via-white to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:py-20">
          <div className="min-w-0 lg:col-span-6">
            <div className="skeleton h-7 w-48 rounded-full" />
            <div className="skeleton mt-5 h-16 w-full sm:h-20" />
            <div className="skeleton mt-3 h-16 w-4/5 sm:h-20" />
            <div className="skeleton mt-5 h-6 w-full max-w-md" />
            <div className="skeleton mt-2 h-6 w-3/4 max-w-sm" />
            <div className="mt-7 flex gap-3">
              <div className="skeleton h-14 w-44" />
              <div className="skeleton h-14 w-32" />
            </div>
          </div>
          <div className="min-w-0 lg:col-span-6">
            <div className="skeleton aspect-square w-full rounded-3xl" />
          </div>
        </div>
      </div>

      {/* Сервер */}
      <div className="bg-[#201405] py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="skeleton h-8 w-64" />
          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            <div className="skeleton h-56 min-w-0 lg:col-span-7 rounded-2xl" />
            <div className="skeleton h-56 min-w-0 lg:col-span-5 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
