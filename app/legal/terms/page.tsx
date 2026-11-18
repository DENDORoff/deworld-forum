import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, LegalSection } from "@/components/legal-page";
import { MINECRAFT_HOST, DISCORD_INVITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Условия использования",
  description: "Правила использования сайта, форума и сервера DEWORLD: аккаунт, контент, поведение, ответственность.",
  alternates: { canonical: "/legal/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Условия использования" updated="19 ноября 2026">
      <LegalSection title="1. Что это за документ">
        <p>
          Условия использования регулируют доступ и работу с сайтом de-world.net, форумом, чатом и
          Minecraft-сервером {MINECRAFT_HOST} (далее — «Сервис»). Регистрируясь или пользуясь
          Сервисом, вы принимаете эти Условия. Если не согласны — пожалуйста, не используйте Сервис.
        </p>
      </LegalSection>

      <LegalSection title="2. Аккаунт">
        <ul className="list-disc space-y-1.5 pl-6">
          <li>Один человек — один аккаунт. Мультиаккаунты для накрутки, обхода банов и премов запрещены.</li>
          <li>Вы отвечаете за сохранность пароля. Рекомендуем включить 2FA в настройках.</li>
          <li>Минимальный возраст пользователя — 14 лет; младше — с согласия родителей.</li>
          <li>Доступ может быть ограничен при нарушении правил (см. раздел 4).</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Контент">
        <ul className="list-disc space-y-1.5 pl-6">
          <li>Вы сохраняете права на свой контент и предоставляете нам простую лицензию на его показ в рамках Сервиса.</li>
          <li>Запрещены: пиратство, вредоносные ссылки, персональные данные третьих лиц без согласия, призывы к насилию, экстремизм, иной незаконный контент.</li>
          <li>Администрация вправе редактировать/скрывать/удалять контент, нарушающий правила, без возмещения.</li>
          <li>Модераторские решения можно обжаловать через тикет — решение принимает старший состав.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Правила сообщества">
        <p>
          Правила поведения — на странице{" "}
          <Link className="text-orange-800 underline underline-offset-2" href="/forum/rules">
            /forum/rules
          </Link>
          . Они — часть этих Условий. Нарушение: предупреждение → временное ограничение → бан.
        </p>
      </LegalSection>

      <LegalSection title="5. Премиум и оплата">
        <ul className="list-disc space-y-1.5 pl-6">
          <li>Премиум — добровольная подписка, расширяющая возможности; игровая валюта, предметы и преимущества покупки описаны на странице /premium.</li>
          <li>Цены и состав подписки могут меняться; оплаченная подписка действует до конца оплаченного периода.</li>
          <li>Возврат средств — по{" "}
            <Link className="text-orange-800 underline underline-offset-2" href="/legal/refund">
              Политике возврата
            </Link>
            .
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Доступность и ответственность">
        <ul className="list-disc space-y-1.5 pl-6">
          <li>Сервис предоставляется «как есть». Мы стремимся к 99% аптайма, но не гарантируем бесперебойность.</li>
          <li>Мы не отвечаем за контент третьих лиц (ссылки, файлы, моды) и за ущерб от использования Сервиса сверх разумного.</li>
          <li>Резервные копии БД форума — на усмотрение оператора; важные свои данные сохраняйте сами.</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Интеллектуальная собственность">
        <p>
          Оформление, логотип DEWORLD, тексты администрации — интеллектуальная собственность
          Оператора. «Minecraft» — товарный знак Mojang Studios; проект не связан с Mojang или
          Microsoft. Ваш контент остаётся вашим на условиях раздела 3.
        </p>
      </LegalSection>

      <LegalSection title="8. Изменение Условий">
        <p>
          Актуальная версия — на этой странице. О существенных изменениях — анонс в{" "}
          <a href={DISCORD_INVITE} className="text-orange-800 underline underline-offset-2">
            Discord
          </a>{" "}
          и на форуме не позднее чем за 14 дней. Продолжение использования = согласие с новой редакцией.
        </p>
      </LegalSection>

      <LegalSection title="9. Применимое право и контакты">
        <p>
          Применяется право Российской Федерации. Споры — в порядке, установленном для потребителей;
          иные — в суде по месту нахождения Оператора. Контакты:{" "}
          <a className="text-orange-800 underline underline-offset-2" href="mailto:legal@de-world.net">
            legal@de-world.net
          </a>
          . Реквизиты — на{" "}
          <Link className="text-orange-800 underline underline-offset-2" href="/legal/requisites">
            /legal/requisites
          </Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
