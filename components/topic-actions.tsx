"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Check,
  Lock,
  LockOpen,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react";

import {
  deletePostAction,
  deleteTopicAction,
  markSolutionAction,
  toggleTopicLockAction,
  toggleTopicPinAction,
} from "@/lib/actions/forum";
import { confirm } from "@/components/confirm-dialog";
import { cn } from "@/lib/utils";

function useActionButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (action: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "Не удалось выполнить действие");
      router.refresh();
    });
  };

  return { isPending, error, run };
}

/** Действия администратора/модератора/автора над темой. */
export function TopicActions({
  topicId,
  locked,
  pinned,
  isStaff,
  canDelete,
}: {
  topicId: string;
  locked: boolean;
  pinned: boolean;
  isStaff: boolean;
  canDelete: boolean;
}) {
  const { isPending, error, run } = useActionButton();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => run(() => toggleTopicLockAction(topicId))}
        title={locked ? "Открыть тему" : "Закрыть тему"}
        aria-label={locked ? "Открыть тему" : "Закрыть тему"}
        className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg border border-stone-200 px-3 text-xs font-medium text-stone-600 transition-colors hover:border-orange-300 hover:text-orange-800 disabled:opacity-60"
      >
        {locked ? <LockOpen size={14} aria-hidden /> : <Lock size={14} aria-hidden />}
        <span className="hidden sm:inline">{locked ? "Открыть" : "Закрыть"}</span>
      </button>

      {isStaff && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => toggleTopicPinAction(topicId))}
          title={pinned ? "Открепить" : "Закрепить"}
          aria-label={pinned ? "Открепить тему" : "Закрепить тему"}
          className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg border border-stone-200 px-3 text-xs font-medium text-stone-600 transition-colors hover:border-orange-300 hover:text-orange-800 disabled:opacity-60"
        >
          {pinned ? <PinOff size={14} aria-hidden /> : <Pin size={14} aria-hidden />}
          <span className="hidden sm:inline">{pinned ? "Открепить" : "Закрепить"}</span>
        </button>
      )}

      {canDelete && (
        <button
          type="button"
          disabled={isPending}
          onClick={async () => {
            const ok = await confirm(
              "Удалить тему?",
              "Тема и все ответы будут удалены безвозвратно.",
            );
            if (ok) run(() => deleteTopicAction(topicId));
          }}
          title="Удалить тему"
          aria-label="Удалить тему"
          className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
        >
          <Trash2 size={14} aria-hidden />
          <span className="hidden sm:inline">Удалить</span>
        </button>
      )}

      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

/** Удаление отдельного сообщения. */
export function PostDeleteButton({ postId }: { postId: string }) {
  const { isPending, run } = useActionButton();
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={async () => {
        const ok = await confirm("Удалить сообщение?", "Ответ будет удалён безвозвратно.");
        if (ok) run(() => deletePostAction(postId));
      }}
      title="Удалить сообщение"
      aria-label="Удалить сообщение"
      className={cn(
        "focus-ring inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60",
      )}
    >
      <Trash2 size={14} aria-hidden />
    </button>
  );
}

/** Отметить сообщение как решение обсуждения (только автор темы / персонал). */
export function SolutionToggleButton({
  topicId,
  postId,
  isSolution,
}: {
  topicId: string;
  postId: string;
  isSolution: boolean;
}) {
  const { isPending, error, run } = useActionButton();
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => run(() => markSolutionAction(topicId, postId))}
        aria-pressed={isSolution}
        title={isSolution ? "Это отмечено как ответ" : "Отметить как ответ"}
        className={cn(
          "focus-ring inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold transition-colors disabled:opacity-60",
          isSolution
            ? "bg-emerald-100 text-emerald-800"
            : "text-stone-400 hover:bg-emerald-50 hover:text-emerald-700",
        )}
      >
        {isSolution ? (
          <>
            <BadgeCheck size={14} aria-hidden /> Ответ
          </>
        ) : (
          <>
            <Check size={14} aria-hidden /> Ответом
          </>
        )}
      </button>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    </span>
  );
}
