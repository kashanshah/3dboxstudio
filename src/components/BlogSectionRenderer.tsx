import Link from "next/link";
import type { ReactNode } from "react";
import StudioLink from "@/components/StudioLink";
import type { BlogFaq, BlogSection } from "@/content/blogPosts";
import { isStudioHref } from "@/lib/blogLinks";

/** Parse light markdown-style links: [label](/path) — only same-site absolute paths. */
export function renderInlineContent(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const label = match[1];
    const href = match[2];
    if (isStudioHref(href)) {
      nodes.push(
        <StudioLink key={`lnk-${key++}`} href={href} className="blog-inline-link">
          {label}
        </StudioLink>,
      );
    } else {
      nodes.push(
        <Link key={`lnk-${key++}`} href={href} className="blog-inline-link">
          {label}
        </Link>,
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

type BlogSectionRendererProps = {
  section: BlogSection;
  index: number;
  pageSlug: string;
  /** Used when `section.type === "faq"` — single source with FAQPage JSON-LD. */
  faqs?: BlogFaq[];
};

export default function BlogSectionRenderer({
  section,
  index,
  pageSlug,
  faqs,
}: BlogSectionRendererProps) {
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
    case "faq": {
      if (!faqs?.length) return null;
      return (
        <div key={index} className="blog-post-faq">
          {faqs.map((faq) => (
            <div key={faq.question} className="blog-post-faq-item">
              <h3 className="blog-post-h3">{faq.question}</h3>
              <p className="blog-post-p">{renderInlineContent(faq.answer)}</p>
            </div>
          ))}
        </div>
      );
    }
    default:
      return (
        <p key={index} className="blog-post-p">
          {renderInlineContent(section.text)}
        </p>
      );
  }
}
