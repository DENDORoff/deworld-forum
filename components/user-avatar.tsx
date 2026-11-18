import Image from "next/image";

import { cn } from "@/lib/utils";

/** Аватар пользователя: OAuth image, иначе инициалы на тёплом градиенте. */
export function UserAvatar({
  name,
  username,
  image,
  size = 40,
  className,
}: {
  name?: string | null;
  username?: string | null;
  image?: string | null;
  size?: number;
  className?: string;
}) {
  const label = (name ?? username ?? "?").trim();
  const initials = label
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (image) {
    return (
      <Image
        src={image}
        alt={`Аватар ${label}`}
        width={size}
        height={size}
        className={cn("rounded-xl object-cover ring-1 ring-orange-100", className)}
      />
    );
  }

  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.max(11, size / 2.6) }}
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 font-bold text-white ring-1 ring-orange-300",
        className,
      )}
    >
      {initials || "?"}
    </span>
  );
}
