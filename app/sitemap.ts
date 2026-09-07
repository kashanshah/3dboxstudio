import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/content/blogPosts";
import { locales, type Locale } from "@/i18n/config";
import { getSiteOrigin } from "@/lib/siteOrigin";

function localizedPath(path: string, locale: Locale): string {
  if (locale === "en") return path;
  if (path === "/") return `/${locale}`;
  return `/${locale}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteOrigin();
  const lastModified = new Date();

  const paths = ["/", "/studio", "/faq", "/contact", "/privacy", "/terms", "/blog"];
  const staticRoutes: MetadataRoute.Sitemap = paths.flatMap((path) => {
    const alternates = Object.fromEntries(
      locales.map((locale) => [locale, `${origin}${localizedPath(path, locale)}`]),
    );

    return locales.map((locale) => ({
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
      alternates: { languages: alternates },
    }));
  });

  const blogRoutes: MetadataRoute.Sitemap = BLOG_POSTS.flatMap((post) => {
    const modified = new Date(post.updated ?? post.published);
    const path = `/blog/${post.slug}`;
    const alternates = Object.fromEntries(
      locales.map((locale) => [locale, `${origin}${localizedPath(path, locale)}`]),
    );

    return locales.map((locale) => ({
      url: `${origin}${localizedPath(path, locale)}`,
      lastModified: modified,
      changeFrequency: "monthly" as const,
      priority: locale === "en" ? 0.8 : 0.7,
      alternates: { languages: alternates },
    }));
  });

  return [...staticRoutes, ...blogRoutes];
}
