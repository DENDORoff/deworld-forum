import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, ShieldCheck } from "lucide-react";

import { DISCORD_INVITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Правила форума",
  description: "Правила поведения на форуме DEWORLD: что можно, что нельзя и как модераторы решают споры.",
  alternates: { canonical: "/forum/rules" },
};

const RULES: Array<{ title: string; items: string[] }> = [
  {
    title: "1. Общие принципы",
    items: [
      "Уважительное отношение: без оскорблений, унижения и перехода на личности.",
      "Один вопрос — одна тема. Дубликаты закрываются.",
      "Пишите по-русски или английски — иначе тему могут перенести.",
      "Спойлеры и шок-контент прячьте под предупреждение.",
    ],
  },
  {
    title: "2. Темы и ответы",
    items: [
      "Заголовок отражает суть: «Не работает привязка» лучше, чем «Хелп!!!».",
      "В «Поддержке» сначала поиск, потом тема — половина вопросов уже решена.",
      "Отмечайте решением один ответ — это помогает другим и даёт автору значок.",
      "Не поднимайте старые темы без повода («+1»).",
    ],
  },
  {
    title: "3. Что запрещено",
    items: [
      "Пиратство, читерство, продажа игровых ценностей за реальные деньги.",
      "Спам, реклама чужого сервера и фишинг.",
      "Публикация чужих персональных данных без согласия.",
      "Контент, нарушающий законодательство РФ.",
      "Попытки обойти модерацию и мультиаккаунты для накрутки.",
    ],
  },
  {
    title: "4. Модерация",
    items: [
      "Замечание → предупреждение → временный бан → перманентный бан.",
      "Жалобы подаются через кнопку «Пожаловаться» под постом или темой.",
      "Решение модератора можно обжаловать в тикете — разбирается старшим составом.",
      "Модераторы тоже люди: ошибки исправляем, но грубость не терпим.",
    ],
  },
];

export default function ForumRulesPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <nav aria-label="Хлебные крошки" className="flex items-center gap-1.5 text-sm text-stone-500">
        <Link href="/forum" className="hover:text-orange-800">
          Форум
        </Link>
        <ChevronRight size={14} aria-hidden />
        <span aria-current="page" className="text-stone-800">
          Правила
        </span>
      </nav>

      <p className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
        <ShieldCheck size={14} aria-hidden /> Правила сообщества
      </p>
      <h1 className="mt-2 font-display text-3xl text-stone-900">Правила форума DEWORLD</h1>
      <p className="mt-2 max-w-2xl text-stone-600">
        Короткие и честные: уважение, польза, порядок. Это единственное, что держит
        сообщество живым.
      </p>

      <div className="mt-8 space-y-8">
        {RULES.map((section) => (
          <section key={section.title} aria-labelledby={`rules-${section.title.slice(0, 1)}`}>
            <h2
              id={`rules-${section.title.slice(0, 1)}`}
              className="font-display text-lg text-stone-900"
            >
              {section.title}
            </h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-6 text-stone-700">
              {section.items.map((item) => (
                <li key={item} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-10 rounded-2xl border border-orange-100 bg-orange-50/50 px-5 py-4 text-sm text-stone-700">
        Правила действуют на форуме, в общем чате и в Discord. Спорные вопросы —
        в{" "}
        <Link href="/forum/support" className="font-semibold text-orange-700 hover:underline">
          «Поддержке»
        </Link>{" "}
        или в{" "}
        <a href={DISCORD_INVITE} className="font-semibold text-orange-700 hover:underline">
          Discord
        </a>
        .
      </p>
    </section>
  );
}
