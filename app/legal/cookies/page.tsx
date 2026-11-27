import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Политика использования Cookie",
  description: "Какие Cookie использует DEWORLD, зачем и как вы можете их отключить.",
  alternates: { canonical: "/legal/cookies" },
};

export default function CookiesPage() {
  return (
    <LegalPage title="Политика использования Cookie" updated="19 ноября 2026">
      <LegalSection title="1. Что такое Cookie">
        <p>
          Cookie — небольшие текстовые файлы, которые сайт сохраняет в вашем браузере. Они нужны
          для работы авторизации, безопасности и (только с вашего согласия) — для анонимной
          статистики.
        </p>
      </LegalSection>

      <LegalSection title="2. Какие Cookie мы используем">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-stone-500">
              <tr className="border-b border-stone-100">
                <th className="py-2 pr-4 font-semibold">Cookie</th>
                <th className="py-2 pr-4 font-semibold">Назначение</th>
                <th className="py-2 font-semibold">Срок</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              <tr>
                <td className="py-2.5 pr-4 font-mono text-xs">authjs.session-token</td>
                <td className="py-2.5 pr-4">Сессия входа (httpOnly, SameSite=Lax, подписана AUTH_SECRET)</td>
                <td className="py-2.5">30 дней</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-mono text-xs">authjs.csrf-token</td>
                <td className="py-2.5 pr-4">Защита форм от CSRF</td>
                <td className="py-2.5">Сессия</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-mono text-xs">dw_cookie_consent_v1</td>
                <td className="py-2.5 pr-4">Ваш выбор в баннере Cookie (хранится в localStorage браузера)</td>
                <td className="py-2.5">12 месяцев</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-mono text-xs">dw_vid</td>
                <td className="py-2.5 pr-4">Анонимный идентификатор для статистики онлайна и уникальных посетителей дня (httpOnly, SameSite=Lax). Не содержит IP, email или имени; ставится только после согласия на аналитические Cookie</td>
                <td className="py-2.5">12 месяцев</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-mono text-xs">__Secure-authjs.session-token</td>
                <td className="py-2.5 pr-4">То же в production (Secure)</td>
                <td className="py-2.5">30 дней</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-stone-500">
          Аналитические и маркетинговые Cookie подключаются только после вашего согласия в баннере
          и отключаются так же — через «Настройки Cookie» в футере.
        </p>
      </LegalSection>

      <LegalSection title="3. Как управлять">
        <ul className="list-disc space-y-1.5 pl-6">
          <li>Нажмите «Настройки Cookie» в футере сайта — выбор можно изменить в любой момент.</li>
          <li>Полное отключение Cookie в браузере сделает вход на сайт невозможным (нужна сессия).</li>
          <li>localStorage очищается через настройки сайта/браузера: удаление dw_cookie_consent_v1 покажет баннер снова.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Третьи стороны">
        <p>
          Видео загружаются только через youtube-nocookie.com (без трекинга до нажатия «Play»).
          Виджет Discord показывает данные только при включённом вами согласии на маркетинговые
          Cookie. Других сторонних трекеров на сайте нет.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
