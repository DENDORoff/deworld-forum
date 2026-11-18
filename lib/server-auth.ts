/**
 * Обёртка над auth() для Server Components: connection() переводит сегмент
 * маршрута в режим рантайм-рендера до обращения к сессии (Cache Components).
 */
import "server-only";

import { cache } from "react";
import { connection } from "next/server";

import { auth } from "@/auth";

export const getServerSession = cache(async () => {
  await connection();
  return auth();
});
