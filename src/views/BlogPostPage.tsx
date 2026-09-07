import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import StudioLink from "@/components/StudioLink";
import ContentPageShell from "@/components/ContentPageShell";
import BlogEnglishOnlyNote from "@/components/BlogEnglishOnlyNote";
import type { BlogSection } from "@/content/blogPosts";
import {
  BLOG_POSTS,
  getBlogPostImageAlt,
  getBlogPostImagePath,
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

function renderSection(section: BlogSection, index: number) {
  switch (section.type) {
    case "h2":
      return (
        <h2 key={index} className="blog-post-h2">
          {section.text}
        </h2>
      );
    case "h3":
      return (
        <h3 key={index} className="blog-post-h3">
          {section.text}
        </h3>
      );
    case "ul":
      return (
        <ul key={index} className="blog-post-ul">
          {section.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    default:
      return (
        <p key={index} className="blog-post-p">
          {section.text}
        </p>
      );
  }
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

  const related = BLOG_POSTS.filter((item) => item.slug !== post.slug).slice(0, 3);

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

        <div className="landing-section">
          <div className="landing-container blog-post-body">
            {post.sections.map((section, index) => renderSection(section, index))}
            <div className="blog-post-cta">
              <StudioLink
                href="/studio"
                className="btn btn-primary"
                trackCta
                ctaLocation="article_bottom"
                sourcePageType="guide"
                pageSlug={post.slug}
              >
                {t("openStudioCta")}
              </StudioLink>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <aside className="landing-section blog-related">
            <div className="landing-container">
              <h2 className="blog-related-heading">{t("moreGuides")}</h2>
              <ul className="blog-index-list blog-index-list--compact">
                {related.map((item) => {
                  const localizedRelated = getLocalizedBlogPost(item.slug, locale) ?? item;
                  return (
                    <li key={item.slug} className="blog-index-card">
                      <Link
                        href={`/blog/${item.slug}`}
                        className="blog-index-thumb-link"
                      >
                        <img
                          className="blog-index-thumb"
                          src={getBlogPostImagePath(item.slug)}
                          alt={getBlogPostImageAlt(localizedRelated)}
                          width={1200}
                          height={800}
                          loading="lazy"
                          decoding="async"
                        />
                      </Link>
                      <h3 className="blog-index-title">
                        <Link href={`/blog/${item.slug}`}>{localizedRelated.title}</Link>
                      </h3>
                      <p className="blog-index-desc">{localizedRelated.description}</p>
                      <Link href={`/blog/${item.slug}`} className="blog-index-link">
                        {t("readArticle")}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        )}

        <section className="landing-section">
          <div className="landing-container">
            <LandingStudioCta />
          </div>
        </section>
      </article>
    </ContentPageShell>
  );
}
