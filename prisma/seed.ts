/**
 * Начальное заполнение БД: разделы форума, каталог достижений, настройки,
 * администратор. Идемпотентно (upsert), безопасно запускать повторно.
 *
 *   npx prisma db seed
 *
 * Переменные окружения:
 *   ADMIN_EMAIL    — email администратора (по умолчанию admin@de-world.net)
 *   ADMIN_PASSWORD — пароль администратора. Если не задан, генерируется
 *                    случайный и печатается один раз в консоль.
 */
import "dotenv/config";

import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL не задан. Скопируйте .env.example в .env");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const CATEGORIES: Array<{
  slug: string;
  name: string;
  description: string;
  icon: string;
  position: number;
  premiumOnly?: boolean;
}> = [
  {
    slug: "news",
    name: "Новости",
    description: "Официальные новости сервера, обновления и события",
    icon: "Megaphone",
    position: 10,
  },
  {
    slug: "general",
    name: "Общее обсуждение",
    description: "Обо всём на свете: билды, истории, советы и знакомства",
    icon: "MessagesSquare",
    position: 20,
  },
  {
    slug: "support",
    name: "Поддержка",
    description: "Помощь по входу, привязке аккаунта и работе сервера",
    icon: "LifeBuoy",
    position: 30,
  },
  {
    slug: "creative",
    name: "Творчество",
    description: "Фан-арт, скриншоты, видео и другие творческие работы",
    icon: "Palette",
    position: 40,
  },
  {
    slug: "bugs-and-suggestions",
    name: "Баг-репорты и предложения",
    description: "Сообщайте об ошибках и предлагайте улучшения сервера",
    icon: "Bug",
    position: 50,
  },
  {
    slug: "premium",
    name: "Премиум-клуб",
    description: "Скрытый раздел для участников с активной подпиской",
    icon: "Crown",
    position: 60,
    premiumOnly: true,
  },
];

const ACHIEVEMENTS = [
  { key: "forum_first_post", title: "Первый голос", description: "Опубликовать первый ответ на форуме", icon: "PenLine", threshold: 1 },
  { key: "forum_posts_10", title: "Активный участник", description: "10 ответов на форуме", icon: "MessagesSquare", threshold: 10 },
  { key: "forum_posts_100", title: "Ветеран форума", description: "100 ответов на форуме", icon: "Medal", threshold: 100 },
  { key: "forum_posts_1000", title: "Легенда DEWORLD", description: "1000 ответов на форуме", icon: "Crown", threshold: 1000 },
  { key: "forum_topics_5", title: "Создатель тем", description: "Открыть 5 тем на форуме", icon: "Lightbulb", threshold: 5 },
  { key: "forum_topics_25", title: "Генератор обсуждений", description: "Открыть 25 тем на форуме", icon: "Flame", threshold: 25 },
  { key: "forum_solution", title: "Ответ принят", description: "Ваш ответ отмечен как решение обсуждения", icon: "CheckCircle2", threshold: null },
  { key: "forum_year_1", title: "Год с нами", description: "Один год на форуме DEWORLD", icon: "Cake", threshold: 365 },
  { key: "forum_year_2", title: "Два года с нами", description: "Два года на форуме DEWORLD", icon: "Cake", threshold: 730 },
] as const;

const DEFAULT_SETTINGS: Record<string, string> = {
  site_announcement: "",
  youtube_video_ids: "[]",
  premium_perks: JSON.stringify([
    "Увеличенные лимиты в чате и на форуме",
    "Скрытый раздел «Премиум-клуб»",
    "Звание и значок Премиум в профиле и игре",
    "Приоритетная поддержка по тикетам",
    "Поддержка развития проекта",
  ]),
  premium_price_label: "Стоимость и условия уточняйте в Discord",
  server_online_goal: "500",
};

async function main() {
  console.log("→ Разделы форума…");
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: category,
      update: category,
    });
  }

  console.log("→ Каталог достижений…");
  for (const achievement of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      create: { ...achievement, scope: "FORUM" },
      update: {
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        threshold: achievement.threshold,
      },
    });
  }

  console.log("→ Настройки по умолчанию…");
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.setting.upsert({
      where: { key },
      create: { key, value },
      update: {}, // не затираем значения, изменённые в админке
    });
  }

  console.log("→ Администратор…");
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@de-world.net";
  let generatedPassword: string | null = null;
  const password = process.env.ADMIN_PASSWORD ?? (generatedPassword = randomBytes(9).toString("base64url"));
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: "DENDOR",
      username: "dendor",
      passwordHash,
      role: "ADMIN",
      emailVerified: new Date(),
    },
    update: { role: "ADMIN" },
  });

  if (generatedPassword) {
    console.log("");
    console.log("======================================================");
    console.log("СГЕНЕРИРОВАН ПАРОЛЬ АДМИНИСТРАТОРА (сохраните его!):");
    console.log(`  email:    ${adminEmail}`);
    console.log(`  пароль:   ${generatedPassword}`);
    console.log("После входа сразу смените пароль в /settings.");
    console.log("======================================================");
    console.log("");
  }

  console.log("✓ Seed завершён");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
