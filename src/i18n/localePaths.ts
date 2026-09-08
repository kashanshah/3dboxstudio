import { type Locale } from "@/i18n/config";

/** Locales allowed to be indexed in the initial SEO rollout. */
export const indexableLocales = ["en", "es", "fr", "de"] as const satisfies readonly Locale[];

export type IndexableLocale = (typeof indexableLocales)[number];

export function isIndexableLocale(locale: string): locale is IndexableLocale {
  return (indexableLocales as readonly string[]).includes(locale);
}

/** BCP 47 / Google-supported language codes for html[lang] and hreflang. */
export const localeHtmlLang: Record<Locale, string> = {
  en: "en",
  es: "es",
  fr: "fr",
  de: "de",
  zh: "zh",
};

/** Open Graph locale tags (underscore form). */
export const localeOgLocale: Record<Locale, string> = {
  en: "en_US",
  es: "es_ES",
  fr: "fr_FR",
  de: "de_DE",
  zh: "zh_CN",
};

export function localizePath(path: string, locale: string = "en"): string {
  if (locale === "en") return path === "" ? "/" : path;
  if (path === "/" || path === "") return `/${locale}`;
  return `/${locale}${path.startsWith("/") ? path : `/${path}`}`;
}

export function absoluteLocalizedUrl(origin: string, path: string, locale: string = "en"): string {
  const localized = localizePath(path, locale);
  const base = origin.replace(/\/$/, "");
  return localized === "/" ? `${base}/` : `${base}${localized}`;
}
