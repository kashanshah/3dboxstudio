import Link from "next/link";
import StudioLink from "@/components/StudioLink";
import BlogFaqAccordion from "@/components/BlogFaqAccordion";
import { renderInlineContent } from "@/components/BlogInlineContent";
import type { BlogFaq, BlogSection } from "@/content/blogPosts";
import { isStudioHref } from "@/lib/blogLinks";

export { renderInlineContent } from "@/components/BlogInlineContent";

type BlogSectionRendererProps = {
  section: BlogSection;
  index: number;
  pageSlug: string;
  /** Used when `section.type === "faq"` — single source with FAQPage JSON-LD. */
  faqs?: BlogFaq[];
  /** Anchor id for H2 headings (table of contents). */
  headingId?: string;
};

export default function BlogSectionRenderer({
  section,
  index,
  pageSlug,
  faqs,
  headingId,
}: BlogSectionRendererProps) {
  switch (section.type) {
    case "h2":
      return (
        <h2 key={index} id={headingId} className="blog-post-h2">
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
            <li key={item}>{renderInlineContent(item)}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol key={index} className="blog-post-ol">
          {section.items.map((item) => (
            <li key={item}>{renderInlineContent(item)}</li>
          ))}
        </ol>
      );
    case "cta": {
      const href = section.href ?? "/studio";
      const className = "btn btn-primary";
      return (
        <p key={index} className="blog-post-inline-cta">
          {isStudioHref(href) ? (
            <StudioLink
              href={href}
              className={className}
              trackCta
              ctaLocation="inline"
              sourcePageType="guide"
              pageSlug={pageSlug}
            >
              {section.label}
            </StudioLink>
          ) : (
            <Link href={href} className={className}>
              {section.label}
            </Link>
          )}
        </p>
      );
    }
    case "callout":
      return (
        <aside key={index} className="blog-post-callout" role="note">
          {renderInlineContent(section.text)}
        </aside>
      );
    case "faq":
      if (!faqs?.length) return null;
      return <BlogFaqAccordion key={index} faqs={faqs} />;
    default:
      return (
        <p key={index} className="blog-post-p">
          {renderInlineContent(section.text)}
        </p>
      );
  }
}
