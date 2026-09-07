import type { BlogPost } from "@/content/blogPosts";
import { allocateTocId, type TocItem } from "@/lib/toc";

export type BlogTocPlan = {
  tocItems: TocItem[];
  /** Heading id keyed by section index (h2 sections only). */
  sectionHeadingIds: Record<number, string>;
  /** Id for auto-appended FAQ heading when no inline `{ type: "faq" }` section. */
  autoFaqId: string | null;
};

/** Build TOC entries from H2s (and auto FAQ when applicable). Works for any post. */
export function buildBlogTocPlan(post: BlogPost): BlogTocPlan {
  const tocItems: TocItem[] = [];
  const used = new Set<string>();
  const sectionHeadingIds: Record<number, string> = {};

  post.sections.forEach((section, index) => {
    if (section.type !== "h2") return;
    const id = allocateTocId(section.text, used);
    sectionHeadingIds[index] = id;
    tocItems.push({ id, label: section.text });
  });

  const hasInlineFaq = post.sections.some((section) => section.type === "faq");
  let autoFaqId: string | null = null;
  if (post.faqs?.length && !hasInlineFaq) {
    autoFaqId = allocateTocId("FAQ", used);
    tocItems.push({ id: autoFaqId, label: "FAQ" });
  }

  return { tocItems, sectionHeadingIds, autoFaqId };
}
