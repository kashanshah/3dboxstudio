import Link from "next/link";
import ContentPageShell from "@/components/ContentPageShell";
import { BLOG_POSTS } from "@/content/blogPosts";
import LandingStudioCta from "@/components/LandingStudioCta";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogIndexPage() {
  return (
    <ContentPageShell activeNav="blog">
      <section className="landing-section content-page-hero gradient-section">
        <div className="landing-container">
          <p className="landing-eyebrow landing-eyebrow--section">Guides</p>
          <h1 className="landing-display content-page-title">
            3D box design & packaging blog
          </h1>
          <p className="landing-section-intro content-page-intro">
            Practical articles on 3D box designers, box makers, packaging
            simulation, and browser-based carton mockups for designers and brand
            teams.
          </p>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-container">
          <ul className="blog-index-list">
            {BLOG_POSTS.map((post) => (
              <li key={post.slug} className="blog-index-card">
                <p className="blog-index-meta">
                  <time dateTime={post.published}>{formatDate(post.published)}</time>
                  <span aria-hidden> · </span>
                  {post.readMinutes} min read
                </p>
                <h2 className="blog-index-title">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="blog-index-desc">{post.description}</p>
                <p className="blog-index-keywords">
                  {post.keywords.join(" · ")}
                </p>
                <Link href={`/blog/${post.slug}`} className="blog-index-link">
                  Read article →
                </Link>
              </li>
            ))}
          </ul>
          <LandingStudioCta />
        </div>
      </section>
    </ContentPageShell>
  );
}
