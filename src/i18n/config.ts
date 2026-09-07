export const locales = ["en", "fr", "es", "zh"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  zh: "中文",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
