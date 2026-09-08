import { statSync } from "node:fs";
import { resolve } from "node:path";
import { BLOG_POSTS } from "@/content/blogPosts";
import { hasBlogTranslation } from "@/content/blogLocales";
import { locales, type Locale } from "@/i18n/config";
import { isIndexableLocale, localizePath } from "@/i18n/localePaths";
import { getIndexableAlternateLocales } from "@/i18n/seoPolicy";
import { staticPaths } from "@/i18n/staticPageTranslations";
import { getSiteOrigin } from "@/lib/siteOrigin";

export type SitemapEntry = {
  url: string;
  /** Only set when we have a real content modification date. */
  lastModified?: string;
  alternates?: Record<string, string>;
};

function absoluteUrl(origin: string, path: string, locale: Locale): string {
  const localized = localizePath(path, locale);
  const base = origin.replace(/\/$/, "");
  return localized === "/" ? `${base}/` : `${base}${localized}`;
}

function withXDefault(alternates: Record<string, string>, englishUrl: string): Record<string, string> {
  return { ...alternates, "x-default": englishUrl };
}

const STATIC_ROUTE_LASTMOD_SOURCES: Partial<Record<string, string[]>> = {
  "/": [
    "src/views/LandingPage.tsx",
    "src/seo/localePageMeta.ts",
    "src/lib/seo/metadata.tsx",
    "messages/en.json",
    "messages/fr.generated.json",
    "messages/es.generated.json",
    "messages/zh.generated.json",
    "messages/zh.manual.json",
  ],
  "/studio": [
    "src/views/StudioPage.tsx",
    "src/BoxDesigner.tsx",
    "src/seo/localePageMeta.ts",
    "src/lib/seo/metadata.tsx",
    "messages/en.json",
    "messages/fr.generated.json",
    "messages/es.generated.json",
    "messages/zh.generated.json",
    "messages/zh.manual.json",
  ],
  "/faq": [
    "src/views/FaqPage.tsx",
    "src/content/faq.ts",
    "src/lib/seo/metadata.tsx",
  ],
  "/blog": [
    "src/views/BlogIndexPage.tsx",
    "src/components/BlogExplorer.tsx",
    "src/content/blogPosts.ts",
    "src/lib/seo/metadata.tsx",
  ],
};

function readLatestModified(paths: readonly string[]): string | undefined {
  let latest = 0;
  for (const relativePath of paths) {
    try {
      const mtimeMs = statSync(resolve(process.cwd(), relativePath)).mtimeMs;
      if (Number.isFinite(mtimeMs) && mtimeMs > latest) {
        latest = mtimeMs;
      }
    } catch {
      /* ignore missing files */
    }
  }
  return latest > 0 ? new Date(latest).toISOString() : undefined;
}

function staticRouteLastModified(path: string): string | undefined {
  const sources = STATIC_ROUTE_LASTMOD_SOURCES[path];
  return sources?.length ? readLatestModified(sources) : undefined;
}

export function buildSitemapEntries(): SitemapEntry[] {
  const origin = getSiteOrigin();
  const sitemapStaticPaths = staticPaths.filter((path) => path !== "/privacy" && path !== "/terms");

  const staticRoutes: SitemapEntry[] = sitemapStaticPaths.flatMap((path) => {
    const pageLocales = getIndexableAlternateLocales(path);
    const englishUrl = absoluteUrl(origin, path, "en");
    const lastModified = staticRouteLastModified(path);
    const alternates = withXDefault(
      Object.fromEntries(pageLocales.map((locale) => [locale, absoluteUrl(origin, path, locale)])),
      englishUrl,
    );

    return pageLocales.map((locale) => ({
      url: absoluteUrl(origin, path, locale),
      ...(lastModified ? { lastModified } : {}),
      alternates,
    }));
  });

  const blogRoutes: SitemapEntry[] = BLOG_POSTS.flatMap((post) => {
    const modified = new Date(post.updated ?? post.published).toISOString();
    const path = `/blog/${post.slug}`;
    const articleLocales = locales.filter(
      (locale) =>
        isIndexableLocale(locale) && (locale === "en" || hasBlogTranslation(locale, post.slug)),
    );
    const englishUrl = absoluteUrl(origin, path, "en");
    const alternates = withXDefault(
      Object.fromEntries(articleLocales.map((locale) => [locale, absoluteUrl(origin, path, locale)])),
      englishUrl,
    );

    return articleLocales.map((locale) => ({
      url: absoluteUrl(origin, path, locale),
      lastModified: modified,
      alternates,
    }));
  });

  return [...staticRoutes, ...blogRoutes];
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildSitemapXml(entries = buildSitemapEntries()): string {
  const body = entries
    .map((entry) => {
      const alternateLinks = Object.entries(entry.alternates ?? {})
        .map(
          ([hreflang, href]) =>
            `<xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(href)}" />`,
        )
        .join("");

      const parts = [
        "<url>",
        `<loc>${escapeXml(entry.url)}</loc>`,
      ];
      if (entry.lastModified) {
        parts.push(`<lastmod>${escapeXml(entry.lastModified)}</lastmod>`);
      }
      parts.push(alternateLinks, "</url>");
      return parts.join("");
    })
    .join("");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    body,
    "</urlset>",
  ].join("");
}
