import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Check, Crown, MessagesSquare, ShieldCheck, Sparkles } from "lucide-react";

import { getSetting, getSettingJson } from "@/lib/settings";
import { DISCORD_INVITE, MINECRAFT_HOST } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Премиум",
  description:
    "DEWORLD Premium: больше лимитов, значок, скрытый раздел «Премиум-клуб» и приоритетная поддержка. Поддержите проект.",
  alternates: { canonical: "/premium" },
};

export default function PremiumPage() {
  return (
    <Suspense fallback={<PremiumSkeleton />}>
      <PremiumContent />
    </Suspense>
  );
}

async function PremiumContent() {
  const [perks, priceLabel, announcement] = await Promise.all([
    getSettingJson<string[]>("premium_perks", []),
    getSetting("premium_price_label"),
    getSetting("site_announcement"),
  ]);

  const perksList =
    perks.length > 0
      ? perks
      : [
          "Увеличенные лимиты в игре и на форуме",
          "Значок и звание Премиум в профиле и на сервере",
          "Доступ в скрытый раздел «Премиум-клуб»",
          "Приоритетная поддержка по тикетам",
          "Поддержка развития проекта",
        ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#201405] py-16 text-center sm:py-20">
        <div className="dot-grid-dark pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-4">
          <Crown size={52} strokeWidth={1.5} className="mx-auto text-amber-400" aria-hidden />
          <h1 className="mt-5 font-display text-4xl text-amber-50 sm:text-5xl">
            Поддержи проект —
            <br />
            получи <span className="text-amber-400">больше</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-orange-100/80">
            Премиум DEWORLD — честная поддержка сервера: железо, моды, призы для ивентов.
            А взамен — расширение возможностей в игре и на форуме.
          </p>
          <p className="mt-6 font-display text-xl text-amber-300">
            {priceLabel ?? "Стоимость и условия уточняйте в Discord"}
          </p>
        </div>
      </section>

      {/* Преимущества */}
      <section aria-labelledby="perks-heading" className="py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 id="perks-heading" className="font-display text-2xl text-stone-900 sm:text-3xl">
            Что даёт подписка
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {perksList.map((perk) => (
              <li
                key={perk}
                className="flex items-start gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/60 p-5"
              >
                <Check size={20} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden />
                <span className="leading-snug text-stone-800">{perk}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Как оформить */}
      <section aria-labelledby="buy-heading" className="border-t border-orange-100 bg-[#FFF7EC] py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 id="buy-heading" className="font-display text-2xl text-stone-900 sm:text-3xl">
            Как оформить
          </h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: MessagesSquare,
                step: "1",
                title: "Войдите в Discord проекта",
                text: "Канал с премиум-инструкцией закреплён в сообществе — там же актуальная стоимость.",
              },
              {
                icon: ShieldCheck,
                step: "2",
                title: "Оплатите удобным способом",
                text: "Реквизиты и ссылки публикует администрация. Автовыдача премиума включится после подключения платёжного шлюза.",
              },
              {
                icon: Sparkles,
                step: "3",
                title: "Получите значок и доступ",
                text: "Виджет премиума появится в профиле и на сервере, раздел «Премиум-клуб» откроется автоматически.",
              },
            ].map((item) => (
              <li key={item.step} className="rounded-2xl border border-amber-200/80 bg-white p-6 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <item.icon size={20} aria-hidden />
                </span>
                <p className="mt-3 text-xs font-bold uppercase tracking-wider text-amber-700">
                  Шаг {item.step}
                </p>
                <h3 className="mt-1 font-semibold text-stone-900">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{item.text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-col items-center gap-3">
            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-stone-900 px-8 py-4 text-base font-semibold text-amber-300 transition-colors hover:bg-stone-800"
            >
              Оформить в Discord
            </a>
            <p className="text-xs text-stone-500">
              Возврат в течение 7 дней, если подписка не использована —{" "}
              <Link href="/legal/refund" className="underline underline-offset-2 hover:text-orange-800">
                политика возврата
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Mini FAQ */}
      <section aria-labelledby="premium-faq" className="py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 id="premium-faq" className="font-display text-2xl text-stone-900">
            Короткие ответы
          </h2>
          <dl className="mt-6 divide-y divide-stone-100 border-y border-stone-100">
            {[
              {
                q: "Нужен ли премиум, чтобы играть?",
                a: "Нет. DEWORLD полностью бесплатен. Премиум — это поддержка проекта и расширенные возможности, а не обязательная покупка.",
              },
              {
                q: "Когда включится автоматическая покупка на сайте?",
                a: "После подключения платёжного провайдера (ЮKassa / CloudPayments): заказ, оплата и выдача — полностью автоматически, цена пересчитывается на сервере.",
              },
              {
                q: "Что будет с премиумом при отписке?",
                a: "Оставшееся оплаченное время премиум действует до конца периода. Раздел «Премиум-клуб» закрывается по истечении подписки, созданные вами темы остаются у вас.",
              },
              {
                q: "Можно ли передать премиум?",
                a: "Нет. Подписка привязывается к одному аккаунту и не передаётся третьим лицам.",
              },
            ].map((item) => (
              <div key={item.q} className="py-4">
                <dt className="font-semibold text-stone-900">{item.q}</dt>
                <dd className="mt-1 leading-relaxed text-stone-600">{item.a}</dd>
              </div>
            ))}
          </dl>
          {announcement && (
            <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
              <strong>Анонс:</strong> {announcement}
            </p>
          )}
          <p className="mt-6 text-center text-sm text-stone-500">
            Вопросы — в{" "}
            <Link href="/forum/support" className="font-semibold text-orange-800 hover:underline">
              разделе «Поддержка»
            </Link>{" "}
            или на сервере {MINECRAFT_HOST}.
          </p>
        </div>
      </section>
    </>
  );
}

function PremiumSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-hidden>
      <div className="skeleton mx-auto h-14 w-96" />
      <div className="skeleton mt-4 mx-auto h-6 w-72" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
