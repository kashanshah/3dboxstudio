import type { Metadata } from "next";
import { hasBlogTranslation } from "@/content/blogLocales";
import { locales, type Locale } from "@/i18n/config";
import {
  absoluteLocalizedUrl,
  indexableLocales,
  isIndexableLocale,
  localizePath,
  type IndexableLocale,
} from "@/i18n/localePaths";
import { getSiteOrigin } from "@/lib/siteOrigin";
import {
  getStaticPageAlternateLocales,
  isStaticPageTranslated,
  type StaticPath,
  staticPaths,
} from "@/i18n/staticPageTranslations";

export function parseLocale(value: string | undefined | null): Locale {
  if (value && (locales as readonly string[]).includes(value)) {
    return value as Locale;
  }
  return "en";
}

/** Locales that should appear in hreflang/sitemap for a static path. */
export function getIndexableAlternateLocales(path: StaticPath): IndexableLocale[] {
  return getStaticPageAlternateLocales(path).filter(isIndexableLocale);
}

/**
 * Build Next.js `alternates.languages` including reciprocal locales and `x-default`
 * (always the English URL for that path).
 */
export function buildLanguageAlternates(
  path: string,
  supportedLocales: readonly Locale[],
): NonNullable<Metadata["alternates"]>["languages"] {
  const origin = getSiteOrigin();
  const languages: Record<string, string> = {};
  for (const locale of supportedLocales) {
    languages[locale] = absoluteLocalizedUrl(origin, path, locale);
  }
  languages["x-default"] = absoluteLocalizedUrl(origin, path, "en");
  return languages;
}

export function buildBlogLanguageAlternates(
  slug: string,
): NonNullable<Metadata["alternates"]>["languages"] {
  const path = `/blog/${slug}`;
  const supported = locales.filter(
    (locale) =>
      (locale === "en" || hasBlogTranslation(locale, slug)) && isIndexableLocale(locale),
  );
  return buildLanguageAlternates(path, supported);
}

export function robotsForLocale(locale: Locale, opts?: { forceNoIndex?: boolean }): Metadata["robots"] {
  if (opts?.forceNoIndex || !isIndexableLocale(locale)) {
    return { index: false, follow: true, googleBot: { index: false, follow: true } };
  }
  return { index: true, follow: true };
}

/** Thin / incomplete locale pages should not be indexed. */
export function robotsForStaticPage(locale: Locale, path: StaticPath): Metadata["robots"] {
  if (!isStaticPageTranslated(locale, path)) {
    return { index: false, follow: true, googleBot: { index: false, follow: true } };
  }
  return robotsForLocale(locale);
}

export function robotsForBlogPost(locale: Locale, slug: string): Metadata["robots"] {
  if (locale !== "en" && !hasBlogTranslation(locale, slug)) {
    return { index: false, follow: true, googleBot: { index: false, follow: true } };
  }
  return robotsForLocale(locale);
}

/**
 * Resolve the path the language switcher should navigate to.
 * Prefer keeping the user on the equivalent page; if that translation does not
 * exist, fall back to the locale homepage (never invent thin blog routes).
 */
export function resolveLanguageSwitcherPath(
  pathnameWithoutLocale: string,
  targetLocale: Locale,
): string {
  const path = pathnameWithoutLocale.split("?")[0] || "/";

  if (path.startsWith("/blog/") && path !== "/blog/") {
    const slug = path.slice("/blog/".length).split("/")[0] ?? "";
    if (slug && targetLocale !== "en" && !hasBlogTranslation(targetLocale, slug)) {
      return "/";
    }
    return `/blog/${slug}`;
  }

  if ((staticPaths as readonly string[]).includes(path)) {
    const staticPath = path as StaticPath;
    if (!isStaticPageTranslated(targetLocale, staticPath)) {
      return "/";
    }
  }

  return path || "/";
}

export { indexableLocales, isIndexableLocale, localizePath };
