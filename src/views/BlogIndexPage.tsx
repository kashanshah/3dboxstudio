import ContentPageShell from "@/components/ContentPageShell";
import BlogExplorer from "@/components/BlogExplorer";
import { BLOG_POSTS } from "@/content/blogPosts";
import LandingStudioCta from "@/components/LandingStudioCta";

export default function BlogIndexPage() {
  return (
    <ContentPageShell activeNav="blog">
      <section className="landing-section content-page-hero gradient-section">
        <div className="landing-container">
          <p className="landing-eyebrow landing-eyebrow--section">Guides</p>
          <h1 className="landing-display content-page-title">
            Free 3D box design & packaging mockup guides
          </h1>
          <p className="landing-section-intro content-page-intro">
            {BLOG_POSTS.length} practical articles on free 3D box designers,
            online packaging mockup generators, folding carton and mailer
            previews, Pacdora alternatives, and browser-based box makers for
            designers, e-commerce sellers, and brand teams.
          </p>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-container">
          <BlogExplorer />
          <LandingStudioCta />
        </div>
      </section>
    </ContentPageShell>
  );
}
