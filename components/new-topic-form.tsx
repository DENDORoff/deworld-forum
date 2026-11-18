"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Crown, Send } from "lucide-react";

import { createTopicAction } from "@/lib/actions/forum";

const MAX_TITLE = 200;
const MAX_CONTENT = 20000;
const MIN_CONTENT = 20;

/** Форма создания темы: валидация на сервере, счётчики символов, доступные подсказки. */
export function NewTopicForm({
  categoryId,
  premiumAllowed,
}: {
  categoryId: string;
  premiumAllowed: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canSubmit =
    title.trim().length >= 5 && content.trim().length >= MIN_CONTENT && !isPending;

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await createTopicAction(categoryId, { title, content, premiumOnly });
      if (!result.ok) {
        setError(result.error ?? "Не удалось создать тему");
        return;
      }
      router.push(`/forum/topic/${result.slug}`);
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) submit();
      }}
      className="space-y-5"
    >
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="topic-title" className="text-sm font-semibold text-stone-800">
            Заголовок
          </label>
          <span
            className={`text-xs tabular-nums ${title.length > MAX_TITLE ? "text-red-600" : "text-stone-400"}`}
          >
            {title.length}/{MAX_TITLE}
          </span>
        </div>
        <input
          id="topic-title"
          type="text"
          value={title}
          maxLength={MAX_TITLE}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Например: Ищу напарника на Эндер-дракона"
          className="focus-ring mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-base text-stone-900 placeholder:text-stone-400"
          required
        />
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="topic-content" className="text-sm font-semibold text-stone-800">
            Текст темы
          </label>
          <span
            className={`text-xs tabular-nums ${content.length > MAX_CONTENT ? "text-red-600" : "text-stone-400"}`}
          >
            {content.length}/{MAX_CONTENT}
          </span>
        </div>
        <textarea
          id="topic-content"
          value={content}
          maxLength={MAX_CONTENT}
          onChange={(event) => setContent(event.target.value)}
          placeholder={"Опишите проблему или идею подробно:\n- что произошло / что хотите\n- что уже пробовали\n- версия, скриншоты, логи (по возможности)"}
          rows={12}
          className="focus-ring mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-base leading-relaxed text-stone-900 placeholder:text-stone-400"
          required
        />
        <p className="mt-1 text-xs text-stone-400">
          Минимум {MIN_CONTENT} символов. Переносы строк сохраняются, ссылки станут кликабельными.
        </p>
      </div>

      {premiumAllowed && (
        <label
          htmlFor="topic-premium"
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3"
        >
          <input
            id="topic-premium"
            type="checkbox"
            checked={premiumOnly}
            onChange={(event) => setPremiumOnly(event.target.checked)}
            className="h-4 w-4 accent-orange-500"
          />
          <span className="text-sm text-amber-900">
            <span className="flex items-center gap-1.5 font-semibold">
              <Crown size={14} aria-hidden /> Только для премиума
            </span>
            Тему увидят только участники с активной подпиской
          </span>
        </label>
      )}

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={!canSubmit}
          className="focus-ring inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white shadow-sm shadow-orange-500/30 transition-all hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
              Публикуем…
            </>
          ) : (
            <>
              <Send size={17} aria-hidden />
              Опубликовать тему
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="focus-ring rounded-xl px-4 py-3 text-sm font-medium text-stone-600 hover:bg-stone-50"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
