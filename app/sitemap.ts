import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/content/blogPosts";
import { getSiteOrigin } from "@/lib/siteOrigin";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteOrigin();
  const lastModified = new Date();

  const paths = ["/", "/studio", "/faq", "/contact", "/privacy", "/terms", "/blog"];
  const staticRoutes: MetadataRoute.Sitemap = paths.flatMap((path) => {
    const enUrl = `${origin}${path === "/" ? "/" : path}`;
    const frUrl = `${origin}/fr${path === "/" ? "" : path}`;
    return [
      {
        url: enUrl,
        lastModified,
        changeFrequency: path === "/" || path === "/blog" || path === "/studio" ? "weekly" : "monthly",
        priority: path === "/" ? 1 : path === "/studio" ? 0.95 : path === "/blog" ? 0.9 : 0.75,
        alternates: {
          languages: {
            en: enUrl,
            fr: frUrl,
          },
        },
      },
      {
        url: frUrl,
        lastModified,
        changeFrequency: path === "/" || path === "/blog" || path === "/studio" ? "weekly" : "monthly",
        priority: path === "/" ? 0.9 : path === "/studio" ? 0.85 : 0.7,
        alternates: {
          languages: {
            en: enUrl,
            fr: frUrl,
          },
        },
      },
    ];
  });

  const blogRoutes: MetadataRoute.Sitemap = BLOG_POSTS.flatMap((post) => {
    const enUrl = `${origin}/blog/${post.slug}`;
    const frUrl = `${origin}/fr/blog/${post.slug}`;
    const modified = new Date(post.updated ?? post.published);
    return [
      {
        url: enUrl,
        lastModified: modified,
        changeFrequency: "monthly" as const,
        priority: 0.8,
        alternates: { languages: { en: enUrl, fr: frUrl } },
      },
      {
        url: frUrl,
        lastModified: modified,
        changeFrequency: "monthly" as const,
        priority: 0.7,
        alternates: { languages: { en: enUrl, fr: frUrl } },
      },
    ];
  });

  return [...staticRoutes, ...blogRoutes];
}
