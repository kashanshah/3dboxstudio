import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import {
  BlogPostJsonLd,
  createBlogPostMetadata,
} from "@/lib/seo/metadata";
import { BLOG_POSTS } from "@/content/blogPosts";
import { getLocalizedBlogPost } from "@/content/blogLocales";
import type { Locale } from "@/i18n/config";
import BlogPostPage from "@/views/BlogPostPage";

type PageProps = {
  params: Promise<{ slug: string; locale: string }>;
};

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const post = getLocalizedBlogPost(slug, locale);
  if (!post) return {};
  return createBlogPostMetadata(post, locale);
}

export default async function BlogPostRoute({ params }: PageProps) {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const post = getLocalizedBlogPost(slug, locale);
  if (!post) notFound();

  return (
    <>
      <BlogPostJsonLd post={post} />
      <BlogPostPage slug={slug} />
    </>
  );
}
