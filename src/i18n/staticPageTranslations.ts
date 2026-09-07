import { locales, type Locale } from "@/i18n/config";

export const staticPaths = ["/", "/studio", "/faq", "/contact", "/privacy", "/terms", "/blog"] as const;
export type StaticPath = (typeof staticPaths)[number];

const fullyTranslatedStaticPaths = new Set<StaticPath>(["/", "/studio"]);

export function isStaticPageTranslated(locale: Locale, path: StaticPath): boolean {
  return locale === "en" || fullyTranslatedStaticPaths.has(path);
}

export function getStaticPageCanonicalLocale(locale: Locale, path: StaticPath): Locale {
  return isStaticPageTranslated(locale, path) ? locale : "en";
}

export function getStaticPageAlternateLocales(path: StaticPath): Locale[] {
  return locales.filter((locale) => isStaticPageTranslated(locale, path));
}
