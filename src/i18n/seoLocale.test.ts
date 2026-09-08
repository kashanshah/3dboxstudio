import { describe, expect, it } from "vitest";
import { createLandingMetadata, createBlogPostMetadata } from "@/lib/seo/metadata";
import { getBlogPostBySlug } from "@/content/blogPosts";
import { getLocalizedBlogPost } from "@/content/blogLocales";
import { localizePath } from "@/i18n/localePaths";
import {
  buildBlogLanguageAlternates,
  buildLanguageAlternates,
  resolveLanguageSwitcherPath,
  robotsForLocale,
  robotsForStaticPage,
} from "@/i18n/seoPolicy";
import { buildSitemapEntries } from "@/server/sitemap";
import { getLandingPageMeta } from "@/seo/localePageMeta";

describe("locale path routing", () => {
  it("keeps English unprefixed", () => {
    expect(localizePath("/", "en")).toBe("/");
    expect(localizePath("/blog/foo", "en")).toBe("/blog/foo");
    expect(localizePath("/studio", "en")).toBe("/studio");
  });

  it("prefixes non-English locales", () => {
    expect(localizePath("/", "es")).toBe("/es");
    expect(localizePath("/", "fr")).toBe("/fr");
    expect(localizePath("/", "de")).toBe("/de");
    expect(localizePath("/blog/foo", "es")).toBe("/es/blog/foo");
  });
});

describe("hreflang + canonical metadata", () => {
  it("emits self-canonical and reciprocal hreflang with x-default for landing", () => {
    const es = createLandingMetadata("es");
    expect(es.alternates?.canonical).toBe("/es");
    const languages = es.alternates?.languages as Record<string, string>;
    expect(languages.en).toBe("/");
    expect(languages.es).toBe("/es");
    expect(languages.fr).toBe("/fr");
    expect(languages.de).toBe("/de");
    expect(languages["x-default"]).toBe("/");
    expect(languages.zh).toBeUndefined();
  });

  it("localizes Spanish landing title/description", () => {
    const es = createLandingMetadata("es");
    const meta = getLandingPageMeta("es");
    expect(es.description).toBe(meta.description);
    expect(String((es.title as { absolute?: string }).absolute ?? "")).toContain("cajas 3D");
  });

  it("noindexes zh during initial rollout", () => {
    expect(robotsForLocale("zh")).toMatchObject({ index: false });
    expect(robotsForStaticPage("zh", "/")).toMatchObject({ index: false });
  });

  it("noindexes thin FAQ locale pages", () => {
    expect(robotsForStaticPage("es", "/faq")).toMatchObject({ index: false });
  });

  it("blog post hreflang only includes translated locales", () => {
    const slug = "how-to-create-3d-product-box-mockup-online";
    const languages = buildBlogLanguageAlternates(slug) as Record<string, string>;
    expect(languages.en).toBe(`/blog/${slug}`);
    expect(languages.fr).toBe(`/fr/blog/${slug}`);
    expect(languages["x-default"]).toBe(`/blog/${slug}`);
    expect(languages.es).toBeUndefined();
  });

  it("uses translated blog canonical + title for French", () => {
    const slug = "how-to-create-3d-product-box-mockup-online";
    const post = getLocalizedBlogPost(slug, "fr")!;
    const meta = createBlogPostMetadata(post, "fr");
    expect(meta.alternates?.canonical).toBe(`/fr/blog/${slug}`);
    expect(meta.description).toBe(post.description);
  });
});

describe("language switcher targets", () => {
  it("falls back to home when blog translation is missing", () => {
    expect(resolveLanguageSwitcherPath("/blog/what-is-a-3d-box-designer", "fr")).toBe("/");
    expect(
      resolveLanguageSwitcherPath("/blog/how-to-create-3d-product-box-mockup-online", "fr"),
    ).toBe("/blog/how-to-create-3d-product-box-mockup-online");
  });

  it("falls back to home for thin static pages", () => {
    expect(resolveLanguageSwitcherPath("/faq", "es")).toBe("/");
    expect(resolveLanguageSwitcherPath("/studio", "es")).toBe("/studio");
  });
});

describe("sitemap locale coverage", () => {
  it("includes English home, locale homes, and x-default alternates", () => {
    const entries = buildSitemapEntries();
    const home = entries.find((e) => e.url.endsWith("/") && !e.url.match(/\/(es|fr|de|zh)\/?$/));
    // Prefer exact English homepage
    const enHome = entries.find((e) => /https?:\/\/[^/]+\/$/.test(e.url));
    expect(enHome?.alternates?.["x-default"]).toBe(enHome?.url);
    expect(enHome?.alternates?.en).toBe(enHome?.url);
    expect(enHome?.alternates?.es).toMatch(/\/es$/);
    expect(enHome?.alternates?.fr).toMatch(/\/fr$/);
    expect(enHome?.alternates?.de).toMatch(/\/de$/);
    expect(enHome?.alternates?.zh).toBeUndefined();

    expect(entries.some((e) => e.url.endsWith("/es"))).toBe(true);
    expect(entries.some((e) => e.url.endsWith("/fr"))).toBe(true);
    expect(entries.some((e) => e.url.endsWith("/de"))).toBe(true);
    expect(entries.some((e) => e.url.endsWith("/zh"))).toBe(false);

    const frPillar = entries.find((e) =>
      e.url.includes("/fr/blog/how-to-create-3d-product-box-mockup-online"),
    );
    expect(frPillar).toBeTruthy();
    void home;
  });
});

describe("buildLanguageAlternates", () => {
  it("always includes x-default pointing at English", () => {
    const languages = buildLanguageAlternates("/studio", ["en", "es", "fr", "de"]) as Record<
      string,
      string
    >;
    expect(languages["x-default"]).toBe("/studio");
    expect(languages.es).toBe("/es/studio");
  });
});

describe("english blog source post", () => {
  it("still resolves the pillar slug in English", () => {
    const post = getBlogPostBySlug("how-to-create-3d-product-box-mockup-online");
    expect(post?.title).toMatch(/3D Box Mockup/i);
  });
});
