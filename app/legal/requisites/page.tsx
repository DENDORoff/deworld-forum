import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@/components/legal-page";
import { getOperatorRequisites } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Реквизиты и данные оператора",
  description: "Реквизиты оператора персональных данных DEWORLD и контактные данные для обращений.",
  alternates: { canonical: "/legal/requisites" },
};

export default async function RequisitesPage() {
  const r = await getOperatorRequisites();

  const rows: Array<[string, string]> = [
    ["Наименование", r.name],
    ["Статус", r.status],
    ["ИНН", r.inn],
    ["ОГРН / ОГРНИП", r.ogrn],
    ["Юридический адрес", r.address],
    ["Email для обращений по данным", r.emailPrivacy],
    ["Email юридический", r.emailLegal],
    ["Email по безопасности", r.emailSecurity],
    ["Домен", "de-world.net"],
  ];

  return (
    <LegalPage title="Реквизиты и данные оператора" updated="19 ноября 2026">
      <LegalSection title="Оператор персональных данных">
        <dl className="divide-y divide-stone-100 rounded-2xl border border-stone-100">
          {rows.map(([label, value]) => (
            <div key={label} className="grid gap-1 px-5 py-3.5 sm:grid-cols-12">
              <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500 sm:col-span-4">
                {label}
              </dt>
              <dd className="text-sm text-stone-800 sm:col-span-8">{value}</dd>
            </div>
          ))}
        </dl>
      </LegalSection>

      <LegalSection title="Реестр Роскомнадзора">
        <p>
          Уведомление об обработке персональных данных подано в Роскомнадзор. Номер реестровой
          записи: <strong>{r.rknRegistry}</strong>.
        </p>
      </LegalSection>

      <LegalSection title="Правообладатели">
        <ul className="list-disc space-y-1.5 pl-6">
          <li>DEWORLD, логотип и оформление сайта — {r.name}.</li>
          <li>«Minecraft» — товарный знак Mojang Studios. Проект не связан с Mojang и Microsoft.</li>
          <li>
            Иконки — Lucide (ISC License). Шрифты — Rubik, Russo One (SIL Open Font License),
            загружаются с нашего сервера.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Претензии и документы">
        <ul className="list-disc space-y-1.5 pl-6">
          <li>
            Запросить удаление своих данных:{" "}
            <a className="text-orange-800 underline underline-offset-2" href="/legal/privacy#delete-request">
              /legal/privacy#delete-request
            </a>
          </li>
          <li>Политика конфиденциальности: /legal/privacy</li>
          <li>Условия использования: /legal/terms</li>
          <li>Политика возврата: /legal/refund</li>
          <li>Политика Cookie: /legal/cookies</li>
          <li>Согласие на обработку ПДн: /legal/consent</li>
        </ul>
      </LegalSection>
    </LegalPage>
  );
}
