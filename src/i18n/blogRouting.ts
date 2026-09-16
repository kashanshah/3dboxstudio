import { getBlogPostBySlug } from "@/content/blogPosts";
import { hasBlogTranslation } from "@/content/blogLocales";
import { locales, type Locale } from "./config";

/** Only known articles can fall back; invalid URLs must remain 404s. */
export function needsEnglishBlogFallback(path: string, locale: string): boolean {
  const match = /^\/blog\/([^/?#]+)\/?(?:[?#].*)?$/.exec(path);
  return Boolean(
    match && locale !== "en" &&
    (locales as readonly string[]).includes(locale) &&
    getBlogPostBySlug(match[1]) &&
    !hasBlogTranslation(locale as Locale, match[1]),
  );
}

/** Run before next-intl/static route matching, which otherwise returns a 404. */
export function getEnglishBlogRedirect(pathname: string): string | undefined {
  const match = /^\/([^/]+)(\/blog\/[^/]+)\/?$/.exec(pathname);
  if (match && needsEnglishBlogFallback(match[2], match[1])) return match[2];
  return undefined;
}
