import { describe, expect, it } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { createLandingMetadata, createBlogPostMetadata } from "@/lib/seo/metadata";
import { getBlogPostBySlug } from "@/content/blogPosts";
import { getLocalizedBlogPost } from "@/content/blogLocales";
import { localizePath } from "@/i18n/localePaths";
import {
  isDefaultLocalePrefixPath,
  upgradeEnPrefixRedirect,
} from "@/i18n/enPrefixRedirect";
import {
  buildBlogLanguageAlternates,
  buildLanguageAlternates,
  resolveLanguageSwitcherPath,
  robotsForLocale,
  robotsForStaticPage,
} from "@/i18n/seoPolicy";
import { buildSitemapEntries, buildSitemapXml } from "@/server/sitemap";
import {
  getLandingPageMeta,
  getStudioPageMeta,
  STUDIO_KEYWORDS,
} from "@/seo/localePageMeta";

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

describe("localized Studio SEO keywords", () => {
  it("keeps English Studio keywords unchanged", () => {
    expect(getStudioPageMeta("en").keywords).toBe(STUDIO_KEYWORDS);
  });

  it("uses locale-specific Studio keywords (not English reuse)", () => {
    for (const locale of ["es", "fr", "de", "zh"] as const) {
      const keywords = getStudioPageMeta(locale).keywords;
      expect(keywords).toBeTruthy();
      expect(keywords).not.toBe(STUDIO_KEYWORDS);
      expect(keywords!.length).toBeGreaterThan(20);
      expect(keywords!.length).toBeLessThan(220);
    }
  });

  it("includes natural search phrases per locale", () => {
    expect(getStudioPageMeta("es").keywords).toMatch(/diseñador|mockup|empaque/i);
    expect(getStudioPageMeta("fr").keywords).toMatch(/concepteur|mockup|emballage/i);
    expect(getStudioPageMeta("de").keywords).toMatch(/Designer|Mockup|Verpackung/i);
    expect(getStudioPageMeta("zh").keywords).toMatch(/3D|纸盒|包装/);
  });
});

describe("sitemap locale coverage", () => {
  it("includes English home, locale homes, and x-default alternates", () => {
    const entries = buildSitemapEntries();
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
  });

  it("omits lastModified on static pages; keeps it on blog posts", () => {
    const entries = buildSitemapEntries();
    const enHome = entries.find((e) => /https?:\/\/[^/]+\/$/.test(e.url));
    const enStudio = entries.find((e) => e.url.endsWith("/studio"));
    const esHome = entries.find((e) => e.url.endsWith("/es"));
    expect(enHome?.lastModified).toBeUndefined();
    expect(enStudio?.lastModified).toBeUndefined();
    expect(esHome?.lastModified).toBeUndefined();

    const blogEntry = entries.find((e) => e.url.includes("/blog/") && !e.url.includes("/fr/"));
    expect(blogEntry?.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}/);

    const xml = buildSitemapXml(entries);
    expect(xml).toContain("<lastmod>");
    // Static home URL should appear without a following lastmod in the same url block
    const homeBlock = xml.match(
      /<url>\s*<loc>https?:\/\/[^/]+\/<\/loc>([\s\S]*?)<\/url>/,
    );
    expect(homeBlock?.[1]).not.toMatch(/<lastmod>/);
  });
});

describe("/en permanent redirects", () => {
  it("detects default-locale prefix paths", () => {
    expect(isDefaultLocalePrefixPath("/en")).toBe(true);
    expect(isDefaultLocalePrefixPath("/en/")).toBe(true);
    expect(isDefaultLocalePrefixPath("/en/studio")).toBe(true);
    expect(isDefaultLocalePrefixPath("/en/blog/foo")).toBe(true);
    expect(isDefaultLocalePrefixPath("/studio")).toBe(false);
    expect(isDefaultLocalePrefixPath("/es")).toBe(false);
    expect(isDefaultLocalePrefixPath("/energy")).toBe(false);
  });

  function permanentFromTemp(path: string, locationPath: string, search = "") {
    const req = new NextRequest(`http://localhost${path}${search}`);
    const temp = NextResponse.redirect(new URL(`${locationPath}${search}`, req.url), 307);
    return { req, res: upgradeEnPrefixRedirect(req, temp) };
  }

  it("permanently redirects /en to /", () => {
    const { res } = permanentFromTemp("/en", "/");
    expect(res.status).toBe(308);
    expect(new URL(res.headers.get("location")!, "http://localhost").pathname).toBe("/");
  });

  it("permanently redirects /en/studio to /studio", () => {
    const { res } = permanentFromTemp("/en/studio", "/studio");
    expect(res.status).toBe(308);
    expect(new URL(res.headers.get("location")!, "http://localhost").pathname).toBe("/studio");
  });

  it("permanently redirects /en/blog/... and preserves query string", () => {
    const { res } = permanentFromTemp("/en/blog/test-post", "/blog/test-post", "?ref=seo");
    expect(res.status).toBe(308);
    const location = new URL(res.headers.get("location")!, "http://localhost");
    expect(location.pathname).toBe("/blog/test-post");
    expect(location.search).toBe("?ref=seo");
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
