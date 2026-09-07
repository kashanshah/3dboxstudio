import type { Locale } from "@/i18n/config";
import type { BlogPost } from "@/content/blogPosts";
import { getBlogPostBySlug } from "@/content/blogPosts";
import { FR_BLOG_POSTS } from "./fr";
import type { BlogLocaleCatalog, BlogPostTranslation } from "./types";

const CATALOGS: Partial<Record<Locale, BlogLocaleCatalog>> = {
  fr: FR_BLOG_POSTS,
};

export function getBlogTranslation(
  locale: Locale,
  slug: string
): BlogPostTranslation | undefined {
  return CATALOGS[locale]?.[slug];
}

export function hasBlogTranslation(locale: Locale, slug: string): boolean {
  return Boolean(getBlogTranslation(locale, slug));
}

/** English source post with localized title/description/sections when available. */
export function getLocalizedBlogPost(
  slug: string,
  locale: Locale
): BlogPost | undefined {
  const base = getBlogPostBySlug(slug);
  if (!base) return undefined;

  const translation = getBlogTranslation(locale, slug);
  if (!translation) return base;

  return {
    ...base,
    title: translation.title,
    description: translation.description,
    sections: translation.sections,
    keywords: translation.keywords ?? base.keywords,
    ...(translation.seoTitle !== undefined
      ? { seoTitle: translation.seoTitle }
      : {}),
    ...(translation.imageAlt ? { imageAlt: translation.imageAlt } : {}),
    ...(translation.faqs ? { faqs: translation.faqs } : {}),
  };
}

export function listTranslatedBlogSlugs(locale: Locale): string[] {
  return Object.keys(CATALOGS[locale] ?? {});
}
