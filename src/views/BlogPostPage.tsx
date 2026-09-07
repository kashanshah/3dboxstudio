import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import ContentPageShell from "@/components/ContentPageShell";
import BlogPostBody from "@/components/BlogPostBody";
import BlogEnglishOnlyNote from "@/components/BlogEnglishOnlyNote";
import {
  BLOG_POSTS,
  getBlogPostBySlug,
  getBlogPostImageAlt,
  getBlogPostImagePath,
  type BlogPost,
} from "@/content/blogPosts";
import { getLocalizedBlogPost } from "@/content/blogLocales";
import type { Locale } from "@/i18n/config";
import LandingStudioCta from "@/components/LandingStudioCta";

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function relatedPostsFor(post: BlogPost): BlogPost[] {
  if (post.relatedSlugs?.length) {
    const found: BlogPost[] = [];
    for (const relatedSlug of post.relatedSlugs) {
      const item = getBlogPostBySlug(relatedSlug);
      if (item && item.slug !== post.slug) found.push(item);
    }
    // Related grid is 3 columns; keep a single row so the section stays compact.
    if (found.length > 0) return found.slice(0, 3);
  }
  return BLOG_POSTS.filter((item) => item.slug !== post.slug).slice(0, 3);
}

type BlogPostPageProps = {
  slug: string;
};

export default async function BlogPostPage({ slug }: BlogPostPageProps) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("blog");
  const post = getLocalizedBlogPost(slug, locale);

  if (!post) {
    return (
      <ContentPageShell activeNav="blog">
        <section className="landing-section content-page-hero">
          <div className="landing-container">
            <h1 className="landing-display content-page-title">{t("notFoundTitle")}</h1>
            <p className="content-page-intro">
              <Link href="/blog">{t("backToBlog")}</Link>
            </p>
          </div>
        </section>
      </ContentPageShell>
    );
  }

  const related = relatedPostsFor(post).map(
    (item) => getLocalizedBlogPost(item.slug, locale) ?? item,
  );

  return (
    <ContentPageShell activeNav="blog">
      <article className="blog-post">
        <header className="landing-section content-page-hero gradient-section">
          <div className="landing-container blog-post-header">
            <p className="landing-eyebrow landing-eyebrow--section">
              <Link href="/blog">{t("label")}</Link>
            </p>
            <h1 className="landing-display content-page-title">{post.title}</h1>
            <p className="blog-post-meta">
              <time dateTime={post.published}>{formatDate(post.published, locale)}</time>
              {post.updated ? (
                <>
                  <span aria-hidden> · </span>
                  <span>
                    {t("updated")}{" "}
                    <time dateTime={post.updated}>{formatDate(post.updated, locale)}</time>
                  </span>
                </>
              ) : null}
              <span aria-hidden> · </span>
              {t("readMinutes", { minutes: post.readMinutes })}
            </p>
            <p className="landing-section-intro content-page-intro">{post.description}</p>
            <BlogEnglishOnlyNote slug={post.slug} />
            <figure className="blog-post-hero-figure">
              <img
                className="blog-post-hero-image"
                src={getBlogPostImagePath(post.slug)}
                alt={getBlogPostImageAlt(post)}
                width={1200}
                height={800}
                decoding="async"
                fetchPriority="high"
              />
            </figure>
          </div>
        </header>

        <BlogPostBody post={post} related={related} />

        <section className="landing-section">
          <div className="landing-container">
            <LandingStudioCta />
          </div>
        </section>
      </article>
    </ContentPageShell>
  );
}
