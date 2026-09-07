import { describe, expect, it } from "vitest";
import {
  getBlogPostBySlug,
  plainBlogInlineText,
} from "@/content/blogPosts";
import { pathnameToSourcePageType } from "@/lib/analytics/mappers";
import { isStudioHref } from "@/lib/blogLinks";

describe("blog pillar cleanup", () => {
  const post = getBlogPostBySlug("how-to-create-3d-product-box-mockup-online");

  it("keeps FAQ content only in post.faqs with a faq section marker", () => {
    expect(post).toBeTruthy();
    expect(post!.faqs?.length).toBeGreaterThan(0);
    expect(post!.sections.some((s) => s.type === "faq")).toBe(true);

    const faqHeadingDupes = post!.sections.filter(
      (s) => s.type === "h3" && post!.faqs!.some((f) => f.question === s.text),
    );
    expect(faqHeadingDupes).toHaveLength(0);
  });

  it("uses evergreen free FAQ wording without paywall lists", () => {
    const free = post!.faqs!.find((f) =>
      f.question.toLowerCase().includes("for free"),
    );
    expect(free?.answer).toMatch(/free way to create/i);
    expect(free?.answer).not.toMatch(/paywall|email verification/i);
  });

  it("strips inline markdown links for FAQPage plain text", () => {
    expect(
      plainBlogInlineText(
        "See also [packaging mockups without Photoshop](/blog/packaging-mockup-without-photoshop).",
      ),
    ).toBe("See also packaging mockups without Photoshop.");
  });

  it("classifies blog article paths as guide for analytics", () => {
    expect(pathnameToSourcePageType("/blog/how-to-create-3d-product-box-mockup-online")).toBe(
      "guide",
    );
  });

  it("routes only Studio hrefs through StudioLink tracking", () => {
    expect(isStudioHref("/studio")).toBe(true);
    expect(isStudioHref("/studio?from=blog")).toBe(true);
    expect(isStudioHref("/blog/free-3d-box-maker-online")).toBe(false);
    expect(isStudioHref("/faq")).toBe(false);
  });
});
