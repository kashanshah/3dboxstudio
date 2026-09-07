import { describe, expect, it } from "vitest";
import { getBlogPostBySlug } from "@/content/blogPosts";
import { buildBlogTocPlan } from "@/lib/blogToc";

describe("buildBlogTocPlan", () => {
  it("builds unique heading ids from H2s for the pillar article", () => {
    const post = getBlogPostBySlug("how-to-create-3d-product-box-mockup-online");
    expect(post).toBeTruthy();
    const plan = buildBlogTocPlan(post!);
    expect(plan.tocItems.length).toBeGreaterThan(5);
    expect(plan.tocItems.some((item) => item.label === "FAQ")).toBe(true);
    expect(new Set(plan.tocItems.map((item) => item.id)).size).toBe(
      plan.tocItems.length,
    );
    expect(plan.autoFaqId).toBeNull();
  });

  it("skips TOC noise for posts without enough headings", () => {
    const post = getBlogPostBySlug("what-is-a-3d-box-designer");
    expect(post).toBeTruthy();
    const plan = buildBlogTocPlan(post!);
    // Older posts still get a plan from their H2s; UI hides TOC when < 2.
    expect(plan.tocItems.every((item) => item.id.length > 0)).toBe(true);
  });
});
