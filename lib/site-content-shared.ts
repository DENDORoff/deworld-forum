/**
 * Чистые типы и парсеры для редактируемого контента (навигация, футер, реквизиты).
 * Без серверных зависимостей — безопасно импортировать в клиентские компоненты.
 */
export const SITE_CONTENT_TAG = "settings";

export interface NavItem {
  href: string;
  label: string;
}

export interface FooterColumn {
  title: string;
  links: NavItem[];
}

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Главная" },
  { href: "/forum", label: "Форум" },
  { href: "/forum/rules", label: "Правила" },
  { href: "/premium", label: "Премиум" },
];

export const DEFAULT_FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Проект",
    links: [
      { href: "/", label: "Главная" },
      { href: "/forum", label: "Форум" },
      { href: "/forum/rules", label: "Правила форума" },
      { href: "/premium", label: "Премиум" },
    ],
  },
  {
    title: "Документы",
    links: [
      { href: "/legal/privacy", label: "Политика конфиденциальности" },
      { href: "/legal/terms", label: "Условия использования" },
      { href: "/legal/refund", label: "Политика возврата средств" },
      { href: "/legal/cookies", label: "Политика использования Cookie" },
      { href: "/legal/consent", label: "Согласие на обработку ПДн" },
      { href: "/legal/requisites", label: "Реквизиты и данные оператора" },
    ],
  },
  {
    title: "Данные и права",
    links: [
      { href: "/legal/privacy#delete-request", label: "Запросить удаление данных" },
      { href: "/legal/privacy#access-request", label: "Запросить копию своих данных" },
    ],
  },
];

export interface OperatorRequisites {
  name: string;
  status: string;
  inn: string;
  ogrn: string;
  address: string;
  emailPrivacy: string;
  emailLegal: string;
  emailSecurity: string;
  rknRegistry: string;
}

export const DEFAULT_REQUISITES: OperatorRequisites = {
  name: "DENDOR (проект DEWORLD)",
  status: "Индивидуальный предприниматель / самозанятый (уточняется)",
  inn: "Заполняется перед публичным запуском",
  ogrn: "Заполняется перед публичным запуском",
  address: "Заполняется перед публичным запуском",
  emailPrivacy: "privacy@de-world.net",
  emailLegal: "legal@de-world.net",
  emailSecurity: "security@de-world.net",
  rknRegistry: "Заполняется перед публичным запуском",
};

function sanitizeNavItems(raw: unknown): NavItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const { href, label } = item as Record<string, unknown>;
      if (typeof href !== "string" || typeof label !== "string") return null;
      const h = href.trim();
      const l = label.trim();
      const valid =
        l.length > 0 &&
        l.length <= 60 &&
        (h.startsWith("/") || /^https:\/\//.test(h));
      return valid ? { href: h, label: l } : null;
    })
    .filter((x): x is NavItem => x !== null)
    .slice(0, 12);
}

function sanitizeFooterColumns(raw: unknown): FooterColumn[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((col) => {
      if (!col || typeof col !== "object") return null;
      const { title, links } = col as Record<string, unknown>;
      if (typeof title !== "string") return null;
      const cleanLinks = sanitizeNavItems(links).slice(0, 8);
      if (!cleanLinks.length) return null;
      return { title: title.trim().slice(0, 48), links: cleanLinks };
    })
    .filter((x): x is FooterColumn => x !== null)
    .slice(0, 6);
}

export function sanitizeNavItemsExport(raw: unknown): NavItem[] {
  return sanitizeNavItems(raw);
}

export function sanitizeFooterColumnsExport(raw: unknown): FooterColumn[] {
  return sanitizeFooterColumns(raw);
}

export function requisitesToLines(value: OperatorRequisites): string {
  return [
    `name=${value.name}`,
    `status=${value.status}`,
    `inn=${value.inn}`,
    `ogrn=${value.ogrn}`,
    `address=${value.address}`,
    `emailPrivacy=${value.emailPrivacy}`,
    `emailLegal=${value.emailLegal}`,
    `emailSecurity=${value.emailSecurity}`,
    `rknRegistry=${value.rknRegistry}`,
  ].join("\n");
}

export function linesToRequisites(text: string): OperatorRequisites {
  const map = new Map<string, string>();
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    map.set(line.slice(0, eq).trim(), line.slice(eq + 1).trim().slice(0, 300));
  }
  const get = (key: keyof OperatorRequisites) =>
    map.get(key) || DEFAULT_REQUISITES[key];
  return {
    name: get("name"),
    status: get("status"),
    inn: get("inn"),
    ogrn: get("ogrn"),
    address: get("address"),
    emailPrivacy: get("emailPrivacy"),
    emailLegal: get("emailLegal"),
    emailSecurity: get("emailSecurity"),
    rknRegistry: get("rknRegistry"),
  };
}

export function parseSimpleList(text: string): NavItem[] {
  const items: NavItem[] = [];
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const sep = line.lastIndexOf("|");
    if (sep <= 0) continue;
    const label = line.slice(0, sep).trim().slice(0, 60);
    const href = line.slice(sep + 1).trim().slice(0, 512);
    if (!label || !href) continue;
    items.push({ href, label });
  }
  return items;
}

export function formatSimpleList(items: NavItem[]): string {
  return items.map((i) => `${i.label}|${i.href}`).join("\n");
}

export function parseFooterColumns(text: string): FooterColumn[] {
  const columns: FooterColumn[] = [];
  let current: FooterColumn | null = null;
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("##")) {
      const title = line.replace(/^##+\s*/, "").trim().slice(0, 48);
      if (title) {
        current = { title, links: [] };
        columns.push(current);
      }
      continue;
    }
    if (line.startsWith("#")) continue;
    if (!current) continue;
    const sep = line.lastIndexOf("|");
    if (sep <= 0) continue;
    const label = line.slice(0, sep).trim().slice(0, 60);
    const href = line.slice(sep + 1).trim().slice(0, 512);
    if (label && href) current.links.push({ href, label });
  }
  return columns.filter((c) => c.links.length > 0).slice(0, 6);
}

export function formatFooterColumns(columns: FooterColumn[]): string {
  return columns
    .map((col) => `## ${col.title}\n${col.links.map((l) => `${l.label}|${l.href}`).join("\n")}`)
    .join("\n\n");
}
