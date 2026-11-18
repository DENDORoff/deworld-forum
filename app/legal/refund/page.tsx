import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Политика возврата средств",
  description: "Условия и сроки возврата средств за премиум-подписку DEWORLD.",
  alternates: { canonical: "/legal/refund" },
};

export default function RefundPage() {
  return (
    <LegalPage title="Политика возврата средств" updated="19 ноября 2026">
      <LegalSection title="1. Общий принцип">
        <p>
          Мы зарабатываем на честном продукте: если премиум вам не подошёл — верните деньги.
          Ниже — условия, при которых возврат возможен.
        </p>
      </LegalSection>

      <LegalSection title="2. Когда возврат возможен">
        <ul className="list-disc space-y-1.5 pl-6">
          <li>
            В течение <strong>7 календарных дней</strong> с момента оплаты, если подписка
            фактически не использовалась (не активировался донат-статус в игре и/или на форуме).
          </li>
          <li>
            Если по техническим причинам подписка не была активирована в течение 72 часов после оплаты
            — полный возврат по вашему запросу.
          </li>
          <li>Двойное списание — возвращаем разницу в полном объёме.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Когда возврат не производится">
        <ul className="list-disc space-y-1.5 pl-6">
          <li>По истечении 7 дней с оплаты.</li>
          <li>Если премиумом уже пользовались (статусы в игре/на форуме активированы).</li>
          <li>
            При блокировке аккаунта за нарушение{" "}
            <Link className="text-orange-800 underline underline-offset-2" href="/forum/rules">
              правил
            </Link>{" "}
            — возврат не производится, как при нарушении любого договора возмездного оказания услуг.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Как запросить">
        <ol className="list-decimal space-y-1.5 pl-6">
          <li>
            Откройте{" "}
            <Link className="text-orange-800 underline underline-offset-2" href="/forum/new?category=support">
              тему в разделе «Поддержка»
            </Link>{" "}
            или тикет с темой «Возврат средств».
          </li>
          <li>Укажите: ник/логин, дату и сумму оплаты, способ оплаты, причину возврата.</li>
          <li>Решение принимается в течение 5 рабочих дней. Деньги возвращаются тем же способом, которым была произведена оплата, в сроки платёжной системы (обычно до 30 дней).</li>
        </ol>
      </LegalSection>

      <LegalSection title="5. Спорные ситуации">
        <p>
          Если вы считаете решение необоснованным, напишите на{" "}
          <a className="text-orange-800 underline underline-offset-2" href="mailto:legal@de-world.net">
            legal@de-world.net
          </a>
          . Вы также вправе обратиться в Роспотребнадзор и суд в порядке, установленном
          законодательством РФ о защите прав потребителей.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
