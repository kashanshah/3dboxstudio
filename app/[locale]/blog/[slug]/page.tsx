import { notFound } from "next/navigation";
import {
  BlogPostJsonLd,
  createBlogPostMetadata,
} from "@/lib/seo/metadata";
import { BLOG_POSTS, getBlogPostBySlug } from "@/content/blogPosts";
import BlogPostPage from "@/views/BlogPostPage";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return {};
  return createBlogPostMetadata(post);
}

export default async function BlogPostRoute({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <BlogPostJsonLd post={post} />
      <BlogPostPage slug={slug} />
    </>
  );
}
