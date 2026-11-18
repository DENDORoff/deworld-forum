/**
 * Транслитерация кириллицы в латиницу (для человекочитаемых URL-слагов)
 * и нормализация произвольного заголовка к безопасному slug.
 */

const CYRILLIC_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c",
  ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e",
  ю: "yu", я: "ya",
};

export function transliterate(input: string): string {
  return input
    .toLowerCase()
    .split("")
    .map((ch) => CYRILLIC_MAP[ch] ?? ch)
    .join("");
}

const MAX_SLUG_LENGTH = 80;

/**
 * Приводит заголовок к URL-слагу:
 * транслитерация → только a-z0-9 и дефисы → обрезка до 80 символов.
 */
export function slugify(input: string): string {
  const transliterated = transliterate(input);
  const slug = transliterated
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // диакритика
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");
  return slug;
}

/** Базовый слаг с гарантированно непустым результатом. */
export function slugifyOrFallback(input: string, fallback = "item"): string {
  return slugify(input) || fallback;
}
