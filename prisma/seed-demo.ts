/**
 * Разовые демо-данные для локальной разработки и скриншотов:
 * несколько тем и ответов от администратора. Идемпотентно (по slug).
 */
import "dotenv/config";

import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL не задан");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const DEMO_TOPICS: Array<{ category: string; title: string; slug: string; content: string; replies: string[] }> = [
  {
    category: "news",
    title: "Сезон 3 на DEWORLD: что ждёт выживание",
    slug: "sezon-3-na-deworld-chto-zhdyot-vyzhivanie",
    content:
      "Всем привет! 22 ноября открываем сезон 3.\n\n- Реновация привата и защита территорий\n- Новые события раз в две недели\n- Увеличенный лимит на торговые стойки\n\nВопросы и предложения — в комментариях.",
    replies: [
      "Ждали этого обновления! Когда открытие?",
      "Очень вовремя. Приват станет удобнее.",
    ],
  },
  {
    category: "general",
    title: "Показывайте свои постройки — общий тред",
    slug: "pokazyvayte-svoi-postrojki-obshchij-tred",
    content:
      "Место, где делимся скриншотами баз, порталов и деревень.\n\n- Один скриншот — одно сообщение\n- Указывайте координаты (по желанию)\n- Без чужого контента",
    replies: [
      "Моё кузнечное подземелье: координаты X 128, Z -512.",
    ],
  },
  {
    category: "support",
    title: "Не приходит письмо для сброса пароля",
    slug: "ne-prihodit-pismo-dlya-sbrosa-parolya",
    content:
      "Почта привязана, но письма нет ни в папке «Входящие», ни в «Спам».\n\nЧто уже пробовал:\n- проверил спам\n- попробовал другую почту @gmail\n\nПодскажите, что делать?",
    replies: [
      "Попробуйте резервный канал в Discord — там администрация отвечает быстрее всего.",
      "Ответил в тикете #12 — проверьте, пожалуйста.",
    ],
  },
];

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) throw new Error("Сначала выполните seed (нет админа)");

  for (const demo of DEMO_TOPICS) {
    const exists = await prisma.topic.findUnique({ where: { slug: demo.slug } });
    if (exists) continue;

    const category = await prisma.category.findUnique({ where: { slug: demo.category } });
    if (!category) continue;

    const topic = await prisma.topic.create({
      data: {
        categoryId: category.id,
        authorId: admin.id,
        title: demo.title,
        slug: demo.slug,
        content: demo.content,
        replyCount: demo.replies.length,
        lastPostAt: new Date(),
      },
    });

    for (const reply of demo.replies) {
      await prisma.post.create({
        data: { topicId: topic.id, authorId: admin.id, content: reply },
      });
    }
    console.log("создана тема:", demo.slug);
  }
  console.log("✓ Демо-данные готовы");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
