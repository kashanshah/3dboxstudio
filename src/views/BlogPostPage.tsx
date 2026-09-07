import Link from "next/link";
import StudioLink from "@/components/StudioLink";
import ContentPageShell from "@/components/ContentPageShell";
import BlogFaqAccordion from "@/components/BlogFaqAccordion";
import BlogSectionRenderer from "@/components/BlogSectionRenderer";
import {
  BLOG_POSTS,
  getBlogPostBySlug,
  getBlogPostImageAlt,
  getBlogPostImagePath,
  type BlogPost,
} from "@/content/blogPosts";
import LandingStudioCta from "@/components/LandingStudioCta";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
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

export default function BlogPostPage({ slug }: BlogPostPageProps) {
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return (
      <ContentPageShell activeNav="blog">
        <section className="landing-section content-page-hero">
          <div className="landing-container">
            <h1 className="landing-display content-page-title">Article not found</h1>
            <p className="content-page-intro">
              <Link href="/blog">Back to the blog</Link>
            </p>
          </div>
        </section>
      </ContentPageShell>
    );
  }

  const related = relatedPostsFor(post);
  const hasInlineFaqSection = post.sections.some((section) => section.type === "faq");
  const showAutoFaq =
    Boolean(post.faqs?.length) && !hasInlineFaqSection;

  return (
    <ContentPageShell activeNav="blog">
      <article className="blog-post">
        <header className="landing-section content-page-hero gradient-section">
          <div className="landing-container blog-post-header">
            <p className="landing-eyebrow landing-eyebrow--section">
              <Link href="/blog">Blog</Link>
            </p>
            <h1 className="landing-display content-page-title">{post.title}</h1>
            <p className="blog-post-meta">
              <time dateTime={post.published}>{formatDate(post.published)}</time>
              {post.updated ? (
                <>
                  <span aria-hidden> · </span>
                  <span>
                    Updated{" "}
                    <time dateTime={post.updated}>{formatDate(post.updated)}</time>
                  </span>
                </>
              ) : null}
              <span aria-hidden> · </span>
              {post.readMinutes} min read
            </p>
            <p className="landing-section-intro content-page-intro">
              {post.description}
            </p>
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
            {post.sections.map((section, index) => (
              <BlogSectionRenderer
                key={`${section.type}-${index}`}
                section={section}
                index={index}
                pageSlug={post.slug}
                faqs={post.faqs}
              />
            ))}
            {showAutoFaq ? (
              <>
                <h2 className="blog-post-h2">FAQ</h2>
                <BlogFaqAccordion faqs={post.faqs!} />
              </>
            ) : null}
            <div className="blog-post-cta">
              <StudioLink
                href="/studio"
                className="btn btn-primary"
                trackCta
                ctaLocation="article_bottom"
                sourcePageType="guide"
                pageSlug={post.slug}
              >
                Open the free 3D box maker
              </StudioLink>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <aside className="landing-section blog-related">
            <div className="landing-container">
              <h2 className="blog-related-heading">More guides</h2>
              <ul className="blog-index-list blog-index-list--compact">
                {related.map((item) => (
                  <li key={item.slug} className="blog-index-card">
                    <Link
                      href={`/blog/${item.slug}`}
                      className="blog-index-thumb-link"
                    >
                      <img
                        className="blog-index-thumb"
                        src={getBlogPostImagePath(item.slug)}
                        alt={getBlogPostImageAlt(item)}
                        width={1200}
                        height={800}
                        loading="lazy"
                        decoding="async"
                      />
                    </Link>
                    <h3 className="blog-index-title">
                      <Link href={`/blog/${item.slug}`}>{item.title}</Link>
                    </h3>
                    <p className="blog-index-desc">{item.description}</p>
                    <Link href={`/blog/${item.slug}`} className="blog-index-link">
                      Read article →
                    </Link>
                  </li>
                ))}
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
