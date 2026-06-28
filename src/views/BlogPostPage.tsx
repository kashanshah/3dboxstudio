import Link from "next/link";
import ContentPageShell from "@/components/ContentPageShell";
import type { BlogSection } from "@/content/blogPosts";
import { BLOG_POSTS, getBlogPostBySlug } from "@/content/blogPosts";
import LandingStudioCta from "@/components/LandingStudioCta";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
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

  const related = BLOG_POSTS.filter((item) => item.slug !== post.slug).slice(
    0,
    3,
  );

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
              <span aria-hidden> · </span>
              {post.readMinutes} min read
            </p>
            <p className="landing-section-intro content-page-intro">
              {post.description}
            </p>
          </div>
        </header>

        <div className="landing-section">
          <div className="landing-container blog-post-body">
            {post.sections.map((section, index) =>
              renderSection(section, index),
            )}
            <div className="blog-post-cta">
              <Link href="/studio" className="btn btn-primary">
                Open the free 3D box maker
              </Link>
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
