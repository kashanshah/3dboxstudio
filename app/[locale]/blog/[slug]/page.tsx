import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import {
  BlogPostJsonLd,
  createBlogPostMetadata,
} from "@/lib/seo/metadata";
import { BLOG_POSTS } from "@/content/blogPosts";
import { getLocalizedBlogPost, hasBlogTranslation } from "@/content/blogLocales";
import { locales, type Locale } from "@/i18n/config";
import BlogPostPage from "@/views/BlogPostPage";

type PageProps = {
  params: Promise<{ slug: string; locale: string }>;
};

/** Only emit locale×slug combos that have real content (no thin translated shells). */
export function generateStaticParams() {
  return locales.flatMap((locale) =>
    BLOG_POSTS.filter((post) => locale === "en" || hasBlogTranslation(locale, post.slug)).map(
      (post) => ({ locale, slug: post.slug }),
    ),
  );
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps) {
  const { slug, locale: localeParam } = await params;
  const locale = (localeParam || (await getLocale())) as Locale;
  if (locale !== "en" && !hasBlogTranslation(locale, slug)) {
    return {};
  }
  const post = getLocalizedBlogPost(slug, locale);
  if (!post) return {};
  return createBlogPostMetadata(post, locale);
}

export default async function BlogPostRoute({ params }: PageProps) {
  const { slug, locale: localeParam } = await params;
  const locale = (localeParam || (await getLocale())) as Locale;

  if (locale !== "en" && !hasBlogTranslation(locale, slug)) {
    notFound();
  }

  const post = getLocalizedBlogPost(slug, locale);
  if (!post) notFound();

  return (
    <>
      <BlogPostJsonLd post={post} locale={locale} />
      <BlogPostPage slug={slug} />
    </>
  );
}
