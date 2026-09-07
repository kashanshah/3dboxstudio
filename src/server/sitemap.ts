import { BLOG_POSTS } from "@/content/blogPosts";
import { hasBlogTranslation } from "@/content/blogLocales";
import { locales, type Locale } from "@/i18n/config";
import { getStaticPageAlternateLocales, staticPaths } from "@/i18n/staticPageTranslations";
import { getSiteOrigin } from "@/lib/siteOrigin";

export type SitemapEntry = {
  url: string;
  lastModified: string;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
  alternates?: Record<string, string>;
};

function localizedPath(path: string, locale: Locale): string {
  if (locale === "en") return path;
  if (path === "/") return `/${locale}`;
  return `/${locale}${path}`;
}

export function buildSitemapEntries(): SitemapEntry[] {
  const origin = getSiteOrigin();
  const lastModified = new Date().toISOString();

  const staticRoutes: SitemapEntry[] = staticPaths.flatMap((path) => {
    const pageLocales = getStaticPageAlternateLocales(path);
    const alternates = Object.fromEntries(
      pageLocales.map((locale) => [locale, `${origin}${localizedPath(path, locale)}`]),
    );

    return pageLocales.map((locale) => ({
      url: `${origin}${localizedPath(path, locale)}`,
      lastModified,
      changeFrequency: path === "/" || path === "/blog" || path === "/studio" ? "weekly" : "monthly",
      priority:
        locale === "en"
          ? path === "/"
            ? 1
            : path === "/studio"
              ? 0.95
              : path === "/blog"
                ? 0.9
                : 0.75
          : path === "/"
            ? 0.9
            : path === "/studio"
              ? 0.85
              : 0.7,
      alternates,
    }));
  });

  const blogRoutes: SitemapEntry[] = BLOG_POSTS.flatMap((post) => {
    const modified = new Date(post.updated ?? post.published).toISOString();
    const path = `/blog/${post.slug}`;
    const articleLocales = locales.filter((locale) => locale === "en" || hasBlogTranslation(locale, post.slug));
    const alternates = Object.fromEntries(
      articleLocales.map((locale) => [locale, `${origin}${localizedPath(path, locale)}`]),
    );

    return articleLocales.map((locale) => ({
      url: `${origin}${localizedPath(path, locale)}`,
      lastModified: modified,
      changeFrequency: "monthly",
      priority: locale === "en" ? 0.8 : 0.7,
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

      return [
        "<url>",
        `<loc>${escapeXml(entry.url)}</loc>`,
        `<lastmod>${escapeXml(entry.lastModified)}</lastmod>`,
        `<changefreq>${escapeXml(entry.changeFrequency)}</changefreq>`,
        `<priority>${entry.priority.toFixed(2)}</priority>`,
        alternateLinks,
        "</url>",
      ].join("");
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
