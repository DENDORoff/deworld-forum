/** Хранимая пользователем предпочтительная тема оформления. */

export const THEME_STORAGE_KEY = "dw-theme";

export const THEME_CHOICES = ["system", "light", "dark"] as const;
export type ThemeChoice = (typeof THEME_CHOICES)[number];

export const THEME_LABELS: Record<ThemeChoice, string> = {
  system: "Системная",
  light: "Светлая",
  dark: "Тёмная",
};

/**
 * Выполняется до отрисовки страницы: без мигания светлой темой у тех,
 * кто выбрал тёмную или системную тему с тёмной схемой ОС.
 */
export const themeInitScript = `(function(){try{var c=localStorage.getItem('${THEME_STORAGE_KEY}')||'system';var d=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.themeChoice=c;document.documentElement.dataset.theme=c==='system'?(d?'dark':'light'):c;}catch(e){document.documentElement.dataset.theme='light';}})();`;
