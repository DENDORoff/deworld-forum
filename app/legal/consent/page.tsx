import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Согласие на обработку персональных данных",
  description: "Текст согласия на обработку персональных данных при регистрации на DEWORLD (152-ФЗ).",
  alternates: { canonical: "/legal/consent" },
};

export default function ConsentPage() {
  return (
    <LegalPage title="Согласие на обработку персональных данных" updated="19 ноября 2026">
      <LegalSection title="Кого касается">
        <p>
          Это согласие даёт пользователь, регистрирующий аккаунт на de-world.net, включая форум и
          Minecraft-сервер {`mc.de-world.net`}.
        </p>
      </LegalSection>

      <LegalSection title="Текст согласия">
        <p>
          Я, субъект персональных данных, свободно, своей волей и в своём интересе даю согласие
          Оператору DEWORLD (DENDOR, далее — «Оператор») на обработку моих персональных данных в
          соответствии с Политикой конфиденциальности (/legal/privacy) на условиях, изложенных ниже.
        </p>
        <p className="font-semibold text-stone-900">Состав данных:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>логин и email, указанные при регистрации;</li>
          <li>имя/никнейм и ссылка на аватар — при их указании;</li>
          <li>Minecraft-ник и идентификатор LimboAuth — при привязке игрового аккаунта;</li>
          <li>технические журналы: IP-адрес, время входа, действия на форуме (посты, темы, лайки);</li>
          <li>сведения об изменениях аккаунта (смена пароля, включение/отключение 2FA).</li>
        </ul>
        <p className="font-semibold text-stone-900">Цели обработки:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>создание и обслуживание аккаунта;</li>
          <li>обеспечение безопасности (защита от подбора паролей и мошенничества);</li>
          <li>работа форума, чата, достижений и статистики;</li>
          <li>исполнение требований законодательства РФ.</li>
        </ul>
        <p className="font-semibold text-stone-900">Способы обработки:</p>
        <p>
          сбор, запись, систематизация, накопление, хранение, уточнение, извлечение, использование,
          передача (предоставление), обезличивание, удаление. Автоматизированная обработка с
          использованием средств вычислительной техники.
        </p>
        <p className="font-semibold text-stone-900">Срок действия согласия:</p>
        <p>
          До достижения целей обработки или до отзыва согласия (удаление аккаунта либо письмо на{" "}
          <a className="text-orange-800 underline underline-offset-2" href="mailto:privacy@de-world.net">
            privacy@de-world.net
          </a>
          ). Отзыв вступает в силу в течение 30 дней и не влияет на законность обработки до отзыва.
        </p>
      </LegalSection>

      <LegalSection title="Возраст">
        <p>
          Сайт рассчитан на пользователей от 14 лет. Лица моложе 18 лет, но старше 14, дают согласие
          самостоятельно с согласия родителей или законных представителей, от которых мы обрабатываем
          персональные данные в этом случае на тех же условиях.
        </p>
      </LegalSection>

      <LegalSection title="Отзыв согласия">
        <p>
          Отзыв выполняется: удалением аккаунта в{" "}
          <Link className="text-orange-800 underline underline-offset-2" href="/settings#danger">
            настройках
          </Link>{" "}
          либо письмом на{" "}
          <a className="text-orange-800 underline underline-offset-2" href="mailto:privacy@de-world.net">
            privacy@de-world.net
          </a>{" "}
          с темой «Отзыв согласия на обработку ПДн» с указанием никнейма и email аккаунта.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
