/**
 * Правила видимости премиум-контента форума.
 * Премиум-темы и темы в премиум-разделах видит только персонал и подписчики.
 */
import "server-only";

import { isPremiumActive } from "@/lib/utils";
import type { Role } from "@/generated/prisma/enums";

export interface ViewerContext {
  role: Role;
  premiumUntil: Date | string | null;
}

export function canSeePremium(viewer: ViewerContext | null): boolean {
  if (!viewer) return false;
  if (viewer.role !== "USER") return true;
  return isPremiumActive({ premiumUntil: viewer.premiumUntil });
}

/** Prisma-фильтр «только то, что видит зритель» для вопросов/тем. */
export function topicVisibilityWhere(viewer: ViewerContext | null) {
  if (canSeePremium(viewer)) return {};
  return {
    premiumOnly: false,
    category: { premiumOnly: false },
  };
}
