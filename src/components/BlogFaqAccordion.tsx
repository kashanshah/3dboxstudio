import type { BlogFaq } from "@/content/blogPosts";
import { renderInlineContent } from "@/components/BlogInlineContent";

function faqAnchorId(question: string, index: number): string {
  const slug = question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return `faq-${slug || index}`;
}

type BlogFaqAccordionProps = {
  faqs: BlogFaq[];
  /** Open the first item by default (useful for short FAQ lists). */
  openFirst?: boolean;
};

/**
 * Accordion FAQ list for blog posts. Driven by `post.faqs` so any article can
 * opt in by adding FAQs (and optionally a `{ type: "faq" }` section marker).
 */
export default function BlogFaqAccordion({
  faqs,
  openFirst = false,
}: BlogFaqAccordionProps) {
  if (faqs.length === 0) return null;

  return (
    <div className="landing-faq blog-post-faq">
      {faqs.map((faq, index) => (
        <details
          key={faq.question}
          id={faqAnchorId(faq.question, index)}
          open={openFirst && index === 0}
        >
          <summary>
            <h3 className="blog-post-faq-question">{faq.question}</h3>
          </summary>
          <p>{renderInlineContent(faq.answer)}</p>
        </details>
      ))}
    </div>
  );
}
