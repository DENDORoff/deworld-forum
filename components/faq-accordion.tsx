"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const ITEMS = [
  {
    question: "Как зайти на сервер?",
    answer:
      "Откройте Minecraft: Java Edition версии сервера (актуальную версию видно в блоке статуса выше) и добавьте сервер mc.de-world.net. Дальше просто заходите в мир. Если игра совсем новая — включите официальный лаунчер и авторизуйтесь в своём аккаунте.",
  },
  {
    question: "Что входит в премиум-подписку?",
    answer:
      "Больше лимитов в игре и на форуме, значок и звание Премиум, доступ в скрытый раздел «Премиум-клуб», приоритетная поддержка и прямая поддержка развития проекта. Детали — на странице «Премиум».",
  },
  {
    question: "Как привязать Minecraft-аккаунт к форуму?",
    answer:
      "Войдите на форум, откройте «Настройки» → «Привязка Minecraft» и укажите ник и пароль от LimboAuth. После привязки вы сможете входить на форум ником и видеть игровую статистику в профиле.",
  },
  {
    question: "Куда писать, если что-то не работает?",
    answer:
      "Создайте тему в разделе «Поддержка» на форуме или тикет в системе тикетов. В Discord тоже быстро отвечают — но для сложных случаев лучше форум: остаётся история решения проблемы.",
  },
  {
    question: "Можно ли вернуть деньги за премиум?",
    answer:
      "Да: возврат доступен в течение 7 дней с момента оплаты, если подписка не была фактически использована. Порядок и условия — в разделе «Политика возврата средств».",
  },
] as const;

/** FAQ-аккордеон: не более одной открытой секции одновременно. */
export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-orange-100 border-y border-orange-100">
      {ITEMS.map((item, index) => {
        const open = openIndex === index;
        return (
          <div key={index}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : index)}
              aria-expanded={open}
              aria-controls={`faq-panel-${index}`}
              id={`faq-button-${index}`}
              className="focus-ring flex w-full items-center justify-between gap-4 py-4 text-left"
            >
              <span className="font-semibold text-stone-900">{item.question}</span>
              <ChevronDown
                size={18}
                aria-hidden
                className={`shrink-0 text-orange-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              />
            </button>
            {open && (
              <div
                id={`faq-panel-${index}`}
                role="region"
                aria-labelledby={`faq-button-${index}`}
                className="pb-4 pr-8 text-sm leading-relaxed text-stone-600"
              >
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
