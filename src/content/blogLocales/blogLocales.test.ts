import { describe, expect, it } from "vitest";
import {
  getLocalizedBlogPost,
  hasBlogTranslation,
} from "@/content/blogLocales";

const SLUG = "how-to-create-3d-product-box-mockup-online";

describe("blog localization", () => {
  it("returns French content for the translated guide", () => {
    expect(hasBlogTranslation("fr", SLUG)).toBe(true);

    const fr = getLocalizedBlogPost(SLUG, "fr");
    expect(fr?.title).toContain("mockup de boîte produit 3D");
    expect(fr?.sections.some((s) => s.type === "h2" && s.text.includes("Étape 1"))).toBe(
      true
    );
    expect(fr?.slug).toBe(SLUG);
  });

  it("falls back to English when no translation exists", () => {
    expect(hasBlogTranslation("fr", "what-is-a-3d-box-designer")).toBe(false);
    const en = getLocalizedBlogPost("what-is-a-3d-box-designer", "fr");
    expect(en?.title).toMatch(/3D Box Designer/);
  });
});
