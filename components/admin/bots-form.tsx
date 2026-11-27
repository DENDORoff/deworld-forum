"use client";

import { useActionState, useState } from "react";
import { Bot, Loader2, Save, Send, Webhook } from "lucide-react";

import {
  testBotsAction,
  updateBotsConfigAction,
  type BotsFormState,
} from "@/lib/actions/bots";
import type { BotsConfig, BotEvent } from "@/lib/bot-logger";
import { BOT_TEMPLATE_PLACEHOLDERS } from "@/lib/bot-template";
import { cn } from "@/lib/utils";

const initialState: BotsFormState = { status: "idle" };

const inputClass =
  "focus-ring w-full rounded-lg border border-stone-200 px-3 py-2 text-sm placeholder:text-stone-400";

const SAMPLE_CTX: Record<string, string> = {
  user: "Дядя Фёдор",
  user_url: "https://de-world.net/profile/fedor",
  target: "Ищу напарника на Эндер-дракона",
  target_url: "https://de-world.net/forum/topic/ishchu-naparnika",
  site: "https://de-world.net",
  date: "19 ноября в 22:14",
};

function renderPreview(template: string): string {
  return Object.entries(SAMPLE_CTX).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

const EVENT_LABELS: Record<BotEvent, string> = {
  topic_created: "Создана тема на форуме",
  post_created: "Написан ответ",
  user_registered: "Регистрация нового участника",
  report_created: "Создана жалоба",
  role_changed: "Изменена роль пользователя",
  settings_changed: "Изменены настройки сайта",
};

const DISCORD_LAST4 = (url: string) => (url ? `…${url.slice(-4)}` : "не задан");
const TG_LAST4 = (token: string) => (token ? `…${token.slice(-4)}` : "не задан");

export function BotsForm({ config }: { config: BotsConfig }) {
  const [state, formAction, isPending] = useActionState(updateBotsConfigAction, initialState);
  const [testState, testAction, isTesting] = useActionState(testBotsAction, initialState);
  const [previewEnabled, setPreviewEnabled] = useState<Record<string, boolean>>({});

  return (
    <form action={formAction} className="space-y-6">
      {/* Включить ботов */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-orange-200/70 bg-orange-50/40 p-5">
        <div>
          <p className="flex items-center gap-2 font-semibold text-stone-900">
            <Bot size={18} className="text-orange-500" aria-hidden />
            Боты для логов
          </p>
          <p className="mt-0.5 text-xs text-stone-600">
            События с сайта уходят в Discord и Telegram. Секреты хранятся в базе, показываются только последние 4 символа.
          </p>
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm font-semibold text-stone-800">
          <input
            name="enabled"
            type="checkbox"
            defaultChecked={config.enabled}
            className="h-5 w-5 accent-orange-500"
          />
          Включить
        </label>
      </div>

      {/* Discord */}
      <section className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm" aria-labelledby="dc-heading">
        <h2 id="dc-heading" className="flex items-center gap-2 font-display text-lg text-stone-900">
          <Webhook size={18} className="text-[#5865F2]" aria-hidden />
          Discord
        </h2>
        <p className="mt-1 text-xs text-stone-500">
          Канал для вебхука: Сервер → Настройки → Интеграции → Вебхуки → Новый вебхук → Копировать URL.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="min-w-0 lg:col-span-2">
            <label htmlFor="discord_webhookUrl" className="text-sm font-semibold text-stone-800">
              Webhook URL <span className="font-normal text-stone-400">(сохранено: {DISCORD_LAST4(config.discord.webhookUrl)})</span>
            </label>
            <input
              id="discord_webhookUrl"
              name="discord_webhookUrl"
              type="password"
              autoComplete="off"
              placeholder={config.discord.webhookUrl ? "Оставьте пустым, чтобы не менять" : "https://discord.com/api/webhooks/…"}
              className={cn(inputClass, "mt-1.5 font-mono")}
            />
          </div>
          <div>
            <label htmlFor="discord_targetType" className="text-sm font-semibold text-stone-800">
              Куда отправлять
            </label>
            <select
              id="discord_targetType"
              name="discord_targetType"
              defaultValue={config.discord.targetType}
              className={cn(inputClass, "mt-1.5")}
            >
              <option value="channel">Обычный текстовый канал</option>
              <option value="forum">Форум-канал (треды)</option>
            </select>
          </div>
          <div className="flex flex-col justify-end gap-3">
            <label className="flex cursor-pointer items-center gap-3 text-sm text-stone-700">
              <input
                name="discord_perEventThread"
                type="checkbox"
                defaultChecked={config.discord.perEventThread}
                className="h-4 w-4 accent-orange-500"
              />
              Форум: создавать тред на каждое событие
            </label>
            <div>
              <label htmlFor="discord_threadId" className="text-xs font-medium text-stone-600">
                ID существующего треда (если заполнен — сообщения идут в тред)
              </label>
              <input
                id="discord_threadId"
                name="discord_threadId"
                type="text"
                inputMode="numeric"
                defaultValue={config.discord.threadId}
                placeholder="1234567890123456789"
                className={cn(inputClass, "mt-1 font-mono")}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Telegram */}
      <section className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm" aria-labelledby="tg-heading">
        <h2 id="tg-heading" className="font-display text-lg text-stone-900">Telegram</h2>
        <p className="mt-1 text-xs text-stone-500">
          Создайте бота у <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="font-semibold text-orange-700 hover:underline">@BotFather</a> → /newbot → скопируйте токен.
          Для топиков в супергруппе: включите «Темы», добавьте бота администратором, укажите id топика.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <label htmlFor="telegram_botToken" className="text-sm font-semibold text-stone-800">
              Bot Token <span className="font-normal text-stone-400">(сохранено: {TG_LAST4(config.telegram.botToken)})</span>
            </label>
            <input
              id="telegram_botToken"
              name="telegram_botToken"
              type="password"
              autoComplete="off"
              placeholder={config.telegram.botToken ? "Оставьте пустым, чтобы не менять" : "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"}
              className={cn(inputClass, "mt-1.5 font-mono")}
            />
          </div>
          <div>
            <label htmlFor="telegram_chatId" className="text-sm font-semibold text-stone-800">
              Chat ID (канал/группа)
            </label>
            <input
              id="telegram_chatId"
              name="telegram_chatId"
              type="text"
              inputMode="numeric"
              defaultValue={config.telegram.chatId}
              placeholder="-1001234567890"
              className={cn(inputClass, "mt-1.5 font-mono")}
            />
            <p className="mt-1 text-[11px] text-stone-400">ID канала начинается с -100… Узнать: @getmyid_bot или переслав пост из канала боту @getidsbot.</p>
          </div>
          <div>
            <label htmlFor="telegram_threadId" className="text-sm font-semibold text-stone-800">
              Топик (message_thread_id)
            </label>
            <input
              id="telegram_threadId"
              name="telegram_threadId"
              type="text"
              inputMode="numeric"
              defaultValue={config.telegram.threadId}
              placeholder="42 — если пусто, пишем в общий чат"
              className={cn(inputClass, "mt-1.5 font-mono")}
            />
          </div>
          <div>
            <label htmlFor="telegram_parseMode" className="text-sm font-semibold text-stone-800">
              Разметка текста
            </label>
            <select
              id="telegram_parseMode"
              name="telegram_parseMode"
              defaultValue={config.telegram.parseMode}
              className={cn(inputClass, "mt-1.5")}
            >
              <option value="HTML">HTML (рекомендуется)</option>
              <option value="MarkdownV2">MarkdownV2</option>
            </select>
          </div>
        </div>
      </section>

      {/* События и шаблоны */}
      <section aria-labelledby="events-heading">
        <h2 id="events-heading" className="font-display text-lg text-stone-900">
          События и шаблоны сообщений
        </h2>
        <p className="mt-1 text-xs text-stone-500">
          Плейсхолдеры:{" "}
          {BOT_TEMPLATE_PLACEHOLDERS.map((p) => (
            <code key={p.token} className="mx-1 rounded bg-stone-100 px-1.5 py-0.5 text-[10px]" title={p.hint}>
              {p.token}
            </code>
          ))}
          . В Discord: <code className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px]">**жирный**</code>, ссылки — просто URL. В Telegram: <code className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px]">&lt;b&gt;жирный&lt;/b&gt;</code>, <code className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px]">&lt;a href=&quot;…&quot;&gt;</code>.
        </p>

        <ul className="mt-4 space-y-4">
          {(Object.keys(EVENT_LABELS) as BotEvent[]).map((event) => {
            const ev = config.events[event];
            return (
              <li key={event} className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex cursor-pointer items-center gap-2 font-semibold text-stone-900">
                    <input
                      name={`event_${event}_enabled`}
                      type="checkbox"
                      defaultChecked={ev?.enabled}
                      className="h-4 w-4 accent-orange-500"
                    />
                    {EVENT_LABELS[event]}
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewEnabled((s) => ({ ...s, [event]: !s[event] }))
                    }
                    className="focus-ring text-xs font-semibold text-orange-700 hover:underline"
                  >
                    {previewEnabled[event] ? "Скрыть превью" : "Превью"}
                  </button>
                </div>
                <div className="mt-3 grid gap-3 lg:grid-cols-12">
                  <input
                    name={`event_${event}_title`}
                    defaultValue={ev?.title}
                    maxLength={120}
                    placeholder="Заголовок сообщения"
                    aria-label="Заголовок события"
                    className={cn(inputClass, "min-w-0 lg:col-span-8")}
                  />
                  <div className="flex min-w-0 items-center gap-2 lg:col-span-4">
                    <label htmlFor={`event_${event}_color`} className="text-xs text-stone-500">Цвет</label>
                    <input
                      id={`event_${event}_color`}
                      name={`event_${event}_color`}
                      type="color"
                      defaultValue={ev?.color ?? "#f97316"}
                      className="h-9 w-16 cursor-pointer rounded-lg border border-stone-200 bg-white p-1"
                    />
                  </div>
                  <textarea
                    name={`event_${event}_message`}
                    defaultValue={ev?.message}
                    maxLength={1500}
                    rows={2}
                    placeholder="Текст сообщения с плейсхолдерами…"
                    aria-label="Текст события"
                    className={cn(inputClass, "min-w-0 lg:col-span-12")}
                  />
                </div>
                {previewEnabled[event] && (
                  <div className="mt-2 rounded-xl bg-[#201405] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">Превью</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-amber-100">
                      {renderPreview(ev?.title ?? "")}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-snug text-orange-100/90">
                      {renderPreview(ev?.message ?? "")}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Действия */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <form action={testAction}>
            <button
              type="submit"
              disabled={isTesting}
              className="focus-ring inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:border-orange-300 hover:text-orange-800 disabled:opacity-50"
            >
              {isTesting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Отправить тест
            </button>
          </form>
          {testState.status !== "idle" && testState.message && (
            <p role="status" className="text-xs font-medium text-stone-600">{testState.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="focus-ring inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
        >
          {isPending ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
          Сохранить настройки
        </button>
      </div>

      {state.status !== "idle" && state.message && (
        <p
          role="alert"
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800",
          )}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
