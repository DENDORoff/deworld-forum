import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, LegalSection } from "@/components/legal-page";
import { DISCORD_INVITE, SITE_NAME } from "@/lib/constants";
import { getOperatorRequisites } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description: "Какие персональные данные обрабатывает DEWORLD, зачем, на каком основании и как их удалить.",
  alternates: { canonical: "/legal/privacy" },
};

export default async function PrivacyPage() {
  const operator = await getOperatorRequisites();

  return (
    <LegalPage title="Политика конфиденциальности" updated="19 ноября 2026">
      <LegalSection title="1. Оператор персональных данных">
        <p>
          Оператором персональных данных является {operator.name} — администратор проекта {SITE_NAME}{" "}
          (далее — «Оператор»). Email для обращений:{" "}
          <a className="text-orange-800 underline underline-offset-2" href={`mailto:${operator.emailPrivacy}`}>
            {operator.emailPrivacy}
          </a>
          . Полные реквизиты указаны на{" "}
          <Link className="text-orange-800 underline underline-offset-2" href="/legal/requisites">
            странице реквизитов
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Какие данные мы собираем">
        <ul className="list-disc space-y-1.5 pl-6">
          <li>Регистрационные: логин, email, пароль (только в виде bcrypt-хэша).</li>
          <li>Профильные: отображаемое имя, аватар (ссылка), привязанный Minecraft-ник.</li>
          <li>Игровые и форумные: посты, темы, лайки, достижения, статистика.</li>
          <li>
            Технические: IP-адрес при входе и регистрации (для защиты от подбора паролей и
            накрутки), дата и время входа.
          </li>
          <li>Cookie — по{" "}
            <Link className="text-orange-800 underline underline-offset-2" href="/legal/cookies">
              Политике Cookie
            </Link>
            . Аналитика подключается только после вашего согласия.
          </li>
        </ul>
        <p>
          Мы <strong>не собираем</strong>: паспортные данные, платёжные реквизиты (их обрабатывает
          платёжный провайдер), геолокацию, адресную книгу, микрофон и камеру.
        </p>
      </LegalSection>

      <LegalSection title="3. Зачем мы обрабатываем данные">
        <ul className="list-disc space-y-1.5 pl-6">
          <li>Регистрация и аутентификация, работа форума и чата.</li>
          <li>Обеспечение безопасности: защита от подбора паролей, спама и злоупотреблений.</li>
          <li>Начисление достижений и отображение статистики.</li>
          <li>Обратная связь и поддержка (тикеты, обращения).</li>
          <li>Выполнение требований законодательства РФ.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Правовое основание">
        <p>
          Обработка ведётся на основании вашего согласия (ст. 6, ст. 9 Федерального закона № 152-ФЗ
          «О персональных данных»), которое вы даёте при регистрации, и для исполнения договора
          (оказания услуг проекта). Вы вправе отозвать согласие в любой момент — см. раздел 8.
        </p>
      </LegalSection>

      <LegalSection title="5. Где хранятся данные">
        <p>
          Сайт размещён на инфраструктуре Vercel Inc. (США), база данных — Neon Inc. (США).
          Minecraft-сервер и LimboAuth работают на инфраструктуре в России. Передача данных за
          пределы РФ осуществляется с соблюдением требований ст. 12 152-ФЗ (внесение сведений об
          операторе в реестр Роскомнадзора — см. раздел 10).
        </p>
      </LegalSection>

      <LegalSection title="6. Кому мы передаём данные">
        <ul className="list-disc space-y-1.5 pl-6">
          <li>Хостинг-провайдеры (Vercel, Neon) — как лицам, на оборудовании которых хранятся данные, на основании договора поручения обработки.</li>
          <li>Платёжный провайдер — при покупке премиума (данные карты нам не доступны).</li>
          <li>Discord — только то, что вы сами публикуете или подключаете в Discord (OAuth-обмен email/ником при входе через Discord).</li>
          <li>Иные лица — только по законному требованию уполномоченных органов РФ.</li>
        </ul>
        <p>Мы не продаём персональные данные и не используем их в рекламных сетях без вашего согласия.</p>
      </LegalSection>

      <LegalSection title="7. Сроки хранения">
        <ul className="list-disc space-y-1.5 pl-6">
          <li>Аккаунт и его содержимое — до удаления аккаунта вами или по вашей просьбе.</li>
          <li>Журналы безопасности (IP, входы) — 12 месяцев.</li>
          <li>Записи согласий (Cookie, 152-ФЗ) — 3 года с момента отзыва.</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Ваши права">
        <ul className="list-disc space-y-1.5 pl-6">
          <li>
            <strong id="access-request">Доступ и копия данных:</strong> напишите на{" "}
            <a className="text-orange-800 underline underline-offset-2" href={`mailto:${operator.emailPrivacy}`}>
              {operator.emailPrivacy}
            </a>{" "}
            — вышлем выгрузку ваших данных в течение 30 дней.
          </li>
          <li>
            <strong id="delete-request">Удаление данных:</strong> удалите аккаунт самостоятельно в{" "}
            <Link className="text-orange-800 underline underline-offset-2" href="/settings#danger">
              настройках
            </Link>{" "}
            — профиль, посты и сообщения будут стёрты. Либо направьте запрос на тот же email — удаление выполняется в течение 30 дней.
          </li>
          <li>Исправление неточных данных — в настройках профиля самостоятельно, либо по запросу.</li>
          <li>Отзыв согласия — через удаление аккаунта или письмом на {operator.emailPrivacy}.</li>
          <li>Жалоба в Роскомнадзор: rkn.gov.ru, если считаете, что ваши права нарушены.</li>
        </ul>
      </LegalSection>

      <LegalSection title="9. Безопасность">
        <p>
          Пароли — bcrypt (12 раундов). Сессии — httpOnly-cookie с SameSite=Lax и подписью JWT.
          Доступ к БД — только параметризованные запросы. Админ-раздел — по ролевой модели и
          журналируется. Сообщения об уязвимостях:{" "}
          <a className="text-orange-800 underline underline-offset-2" href={`mailto:${operator.emailSecurity}`}>
            {operator.emailSecurity}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="10. Уведомление РКН">
        <p>
          Оператор уведомил Роскомнадзор о намерении осуществлять обработку персональных данных
          (реестровая запись уточняется — см. страницу{" "}
          <Link className="text-orange-800 underline underline-offset-2" href="/legal/requisites">
            реквизитов
          </Link>
          ). Если вы обнаружили неточность — сообщите на {operator.emailPrivacy}.
        </p>
      </LegalSection>

      <LegalSection title="11. Изменения политики">
        <p>
          Актуальная версия всегда на этой странице. Существенные изменения анонсируются на{" "}
          <a href={DISCORD_INVITE} className="text-orange-800 underline underline-offset-2">
            Discord-сервере
          </a>{" "}
          и в разделе «Новости» на форуме не позднее чем за 14 дней до вступления в силу.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
