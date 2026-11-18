import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Без исключения при отсутствии переменной: `prisma generate` должен
    // работать и в CI без БД. Команды migrate/deploy сами проверят url.
    url: process.env.DATABASE_URL,
  },
});
