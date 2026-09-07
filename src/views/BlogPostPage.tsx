import Link from "next/link";
import ContentPageShell from "@/components/ContentPageShell";
import BlogPostBody from "@/components/BlogPostBody";
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
