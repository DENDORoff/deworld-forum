/**
 * Редактируемое содержимое шапки и подвала — хранится в Setting, кэшируется
 * как остальные настройки (тег «settings», инвалидация при сохранении).
 * Чистые типы/парсеры живут в lib/site-content-shared.ts (без серверных зависимостей).
 */
import "server-only";

import { getSettingJson, getSetting } from "@/lib/settings";
import {
  DEFAULT_FOOTER_COLUMNS,
  DEFAULT_NAV_ITEMS,
  DEFAULT_REQUISITES,
  sanitizeFooterColumnsExport,
  sanitizeNavItemsExport,
  type FooterColumn,
  type NavItem,
  type OperatorRequisites,
} from "@/lib/site-content-shared";

export {
  DEFAULT_FOOTER_COLUMNS,
  DEFAULT_NAV_ITEMS,
  DEFAULT_REQUISITES,
  formatFooterColumns,
  formatSimpleList,
  linesToRequisites,
  parseFooterColumns,
  parseSimpleList,
  requisitesToLines,
} from "@/lib/site-content-shared";
export type { FooterColumn, NavItem, OperatorRequisites } from "@/lib/site-content-shared";

export async function getNavItems(): Promise<NavItem[]> {
  const items = sanitizeNavItemsExport(await getSettingJson("nav.items", DEFAULT_NAV_ITEMS));
  return items.length ? items : DEFAULT_NAV_ITEMS;
}

export async function getFooterColumns(): Promise<FooterColumn[]> {
  const columns = sanitizeFooterColumnsExport(
    await getSettingJson("footer.columns", DEFAULT_FOOTER_COLUMNS),
  );
  return columns.length ? columns : DEFAULT_FOOTER_COLUMNS;
}

export async function getFooterTagline(): Promise<string> {
  return (await getSetting("footer.tagline"))?.trim() ||
    "Всё ещё Minecraft, просто лучше. Сообщество, форум и события проекта.";
}

export async function getOperatorRequisites(): Promise<OperatorRequisites> {
  const stored = await getSettingJson<Partial<OperatorRequisites>>(
    "operator.requisites",
    {},
  );
  return { ...DEFAULT_REQUISITES, ...stored };
}
