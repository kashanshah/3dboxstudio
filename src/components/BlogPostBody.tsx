"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import StudioLink from "@/components/StudioLink";
import BlogFaqAccordion from "@/components/BlogFaqAccordion";
import BlogSectionRenderer from "@/components/BlogSectionRenderer";
import OnThisPageToc from "@/components/OnThisPageToc";
import {
  getBlogPostImageAlt,
  getBlogPostImagePath,
  type BlogPost,
} from "@/content/blogPosts";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { buildBlogTocPlan } from "@/lib/blogToc";

type BlogPostBodyProps = {
  post: BlogPost;
  related: BlogPost[];
};

export default function BlogPostBody({ post, related }: BlogPostBodyProps) {
  const t = useTranslations("blog");
  const { tocItems, sectionHeadingIds, autoFaqId } = buildBlogTocPlan(post);
  const activeId = useScrollSpy(tocItems.map((item) => item.id));
  const showAutoFaq = Boolean(autoFaqId && post.faqs?.length);
  const showToc = tocItems.length >= 2;

  return (
    <>
      <div className="landing-section">
        <div className="landing-container">
          {showToc ? (
            <OnThisPageToc items={tocItems} variant="mobile" activeId={activeId} />
          ) : null}

          <div className={showToc ? "blog-post-layout" : undefined}>
            <div className="blog-post-main">
              <div className="blog-post-body">
                {post.sections.map((section, index) => (
                  <BlogSectionRenderer
                    key={`${section.type}-${index}`}
                    section={section}
                    index={index}
                    pageSlug={post.slug}
                    faqs={post.faqs}
                    headingId={sectionHeadingIds[index]}
                  />
                ))}
                {showAutoFaq ? (
                  <>
                    <h2 id={autoFaqId!} className="blog-post-h2">
                      {t("faqHeading")}
                    </h2>
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
                    {t("openStudioCta")}
                  </StudioLink>
                </div>
              </div>
            </div>

            {showToc ? (
              <OnThisPageToc items={tocItems} variant="desktop" activeId={activeId} />
            ) : null}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <aside className="landing-section blog-related">
          <div className="landing-container">
            <h2 className="blog-related-heading">{t("moreGuides")}</h2>
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
                    {t("readArticle")}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}
    </>
  );
}
