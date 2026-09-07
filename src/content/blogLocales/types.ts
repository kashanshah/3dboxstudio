import type { BlogSection } from "@/content/blogPosts";

/** Localized fields for a blog post. Metadata dates/slug stay from the English source. */
export type BlogPostTranslation = {
  title: string;
  description: string;
  imageAlt?: string;
  keywords?: string[];
  sections: BlogSection[];
};

export type BlogLocaleCatalog = Record<string, BlogPostTranslation>;
