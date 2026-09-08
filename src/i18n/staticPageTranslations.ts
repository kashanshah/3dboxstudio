import { locales, type Locale } from "@/i18n/config";

export const staticPaths = ["/", "/studio", "/faq", "/contact", "/privacy", "/terms", "/blog"] as const;
export type StaticPath = (typeof staticPaths)[number];

const translatedStaticPageLocales: Record<StaticPath, readonly Locale[]> = {
  "/": ["en", "fr", "es", "de", "zh"],
  "/studio": ["en", "fr", "es", "de", "zh"],
  "/faq": ["en"],
  "/contact": ["en"],
  "/privacy": ["en"],
  "/terms": ["en"],
  "/blog": ["en"],
};

export function isStaticPageTranslated(locale: Locale, path: StaticPath): boolean {
  return translatedStaticPageLocales[path].includes(locale);
}

export function getStaticPageCanonicalLocale(locale: Locale, path: StaticPath): Locale {
  return isStaticPageTranslated(locale, path) ? locale : "en";
}

export function getStaticPageAlternateLocales(path: StaticPath): Locale[] {
  return locales.filter((locale) => translatedStaticPageLocales[path].includes(locale));
}
