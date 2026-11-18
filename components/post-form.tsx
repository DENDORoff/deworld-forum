"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Send } from "lucide-react";

import { createPostAction } from "@/lib/actions/forum";

const MAX_CONTENT = 10000;
const MIN_CONTENT = 2;

/** Форма ответа в теме. */
export function PostForm({ topicId }: { topicId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canSubmit = content.trim().length >= MIN_CONTENT && !isPending;

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await createPostAction(topicId, { content });
      if (!result.ok) {
        setError(result.error ?? "Не удалось отправить ответ");
        return;
      }
      setContent("");
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) submit();
      }}
      className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm"
    >
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor="post-content" className="text-sm font-semibold text-stone-800">
          Ваш ответ
        </label>
        <span
          className={`text-xs tabular-nums ${content.length > MAX_CONTENT ? "text-red-600" : "text-stone-400"}`}
        >
          {content.length}/{MAX_CONTENT}
        </span>
      </div>
      <textarea
        id="post-content"
        value={content}
        maxLength={MAX_CONTENT}
        rows={4}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Напишите ответ…"
        className="focus-ring mt-2 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 leading-relaxed text-stone-900 placeholder:text-stone-400"
        required
      />
      {error && (
        <p role="alert" className="mt-2 flex items-start gap-2 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit}
          className="focus-ring inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
              Отправляем…
            </>
          ) : (
            <>
              <Send size={15} aria-hidden />
              Ответить
            </>
          )}
        </button>
      </div>
    </form>
  );
}
