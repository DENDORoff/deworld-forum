"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";

import { togglePostLikeAction } from "@/lib/actions/forum";
import { cn } from "@/lib/utils";

/** Кнопка «нравится» на пост: оптимистичное обновление + синхронизация. */
export function PostLikeButton({
  postId,
  initialLiked,
  initialCount,
  disabled = false,
}: {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
  disabled?: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    if (disabled || isPending) return;
    const prevLiked = liked;
    const prevCount = count;
    // Оптимистично: сначала UI, потом синхронизация с сервером
    setLiked(!prevLiked);
    setCount(prevCount + (prevLiked ? -1 : 1));
    startTransition(async () => {
      const result = await togglePostLikeAction(postId);
      if (result.ok) {
        setLiked(Boolean(result.liked));
        setCount(result.count ?? prevCount);
      } else {
        setLiked(prevLiked);
        setCount(prevCount);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled || isPending}
      aria-pressed={liked}
      aria-label={liked ? "Убрать лайк" : "Поставить лайк"}
      className={cn(
        "focus-ring inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold transition-colors disabled:opacity-60",
        liked
          ? "bg-orange-100 text-orange-700"
          : "text-stone-500 hover:bg-orange-50 hover:text-orange-700",
      )}
    >
      <Heart size={14} aria-hidden fill={liked ? "currentColor" : "none"} />
      {count}
    </button>
  );
}
