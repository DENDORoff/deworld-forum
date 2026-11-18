"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
}

/** Бургер-меню для узких экранов. */
export function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Закрываем меню при переходе (корректировка состояния во время рендера) и по Escape
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-xl text-stone-700 hover:bg-orange-50"
        aria-expanded={open}
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full border-b border-orange-100 bg-white/95 shadow-lg shadow-orange-100/40 backdrop-blur">
          <nav aria-label="Мобильная навигация" className="mx-auto max-w-6xl px-4 py-3">
            <ul className="flex flex-col">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="focus-ring block rounded-lg px-3 py-3 text-base font-medium text-stone-800 hover:bg-orange-50"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
