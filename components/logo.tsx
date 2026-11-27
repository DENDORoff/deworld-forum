import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

/** Логотип DEWORLD: фирменное «DW» в тёмном скруглённом плитке + словесный знак. */
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="DEWORLD — на главную"
      className={cn("focus-ring group flex items-center gap-2.5", className)}
    >
      <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-espresso ring-1 ring-black/10 transition-transform duration-200 group-hover:scale-[1.03]">
        <Image
          src="/brand/dw-wordmark.webp"
          alt="DEWORLD"
          width={40}
          height={40}
          className="h-9 w-9 object-contain"
          priority
        />
      </span>
      {!compact && (
        <span className="font-display text-[1.35rem] leading-none tracking-wide text-stone-900">
          DEWORLD
        </span>
      )}
    </Link>
  );
}
