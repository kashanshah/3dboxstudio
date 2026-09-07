import ContentPageShell from "@/components/ContentPageShell";
import BlogExplorer from "@/components/BlogExplorer";
import { BLOG_POSTS } from "@/content/blogPosts";
import LandingStudioCta from "@/components/LandingStudioCta";
import { useTranslations } from "next-intl";

export default function BlogIndexPage() {
  const t = useTranslations("blog.index");

  return (
    <ContentPageShell activeNav="blog">
      <section className="landing-section content-page-hero gradient-section">
        <div className="landing-container">
          <p className="landing-eyebrow landing-eyebrow--section">{t("eyebrow")}</p>
          <h1 className="landing-display content-page-title">{t("title")}</h1>
          <p className="landing-section-intro content-page-intro">{t("intro", { count: BLOG_POSTS.length })}</p>
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
