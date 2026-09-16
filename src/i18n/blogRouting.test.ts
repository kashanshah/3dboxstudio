import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "../../middleware";
import { getEnglishBlogRedirect, needsEnglishBlogFallback } from "./blogRouting";
import { buildSitemapEntries } from "@/server/sitemap";
import { buildBlogLanguageAlternates } from "./seoPolicy";
import { routing } from "./routing";

// The redirect must happen before next-intl's static-route handling.
vi.mock("next-intl/middleware", () => ({
  default: () => () => { throw new Error("Unexpected next-intl routing"); },
}));
vi.mock("next-intl/navigation", () => ({ createNavigation: () => ({}) }));

const reportedPaths = [
  "/fr/blog/soap-bath-body-packaging-3d-preview",
  "/fr/blog/mailer-box-mockup-online",
  "/de/blog/how-to-create-3d-product-box-mockup-online",
  "/fr/blog/free-3d-box-maker-online",
  "/fr/blog/what-is-a-3d-box-designer",
  "/de/blog/what-is-a-3d-box-designer",
  "/de/blog/free-3d-box-maker-online",
];

describe("missing blog translations", () => {
  it.each(reportedPaths)("permanently redirects %s to its English article", (path) => {
    const response = middleware(new NextRequest(`https://www.3dboxstudio.com${path}?ref=search`));
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      `https://www.3dboxstudio.com${path.slice(3)}?ref=search`,
    );
  });

  it("preserves actual translations, English pages, and invalid URLs", () => {
    for (const path of [
      "/fr/blog/how-to-create-3d-product-box-mockup-online",
      "/blog/free-3d-box-maker-online",
      "/de/blog/not-a-real-article",
      "/xx/blog/free-3d-box-maker-online",
      "/de/blog/free-3d-box-maker-online/extra",
      "/$",
    ]) expect(getEnglishBlogRedirect(path)).toBeUndefined();
  });

  it("handles trailing slashes and article links with query strings or fragments", () => {
    expect(getEnglishBlogRedirect(`${reportedPaths[0]}/`)).toBe(reportedPaths[0].slice(3));
    expect(needsEnglishBlogFallback("/blog/free-3d-box-maker-online?ref=footer#intro", "fr")).toBe(true);
    expect(needsEnglishBlogFallback("/blog/how-to-create-3d-product-box-mockup-online", "fr")).toBe(false);
    expect(needsEnglishBlogFallback("/blog", "fr")).toBe(false);
  });

  it("does not advertise redirecting URLs in the sitemap or hreflang", () => {
    expect(routing.alternateLinks).toBe(false);
    const entries = buildSitemapEntries();
    for (const path of reportedPaths) {
      expect(entries.some((entry) => new URL(entry.url).pathname === path)).toBe(false);
      const slug = path.split("/").at(-1)!;
      const alternates = buildBlogLanguageAlternates(slug) ?? {};
      expect(Object.values(alternates)).not.toContain(`https://www.3dboxstudio.com${path}`);
    }
  });
});
