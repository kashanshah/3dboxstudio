import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/content/blogPosts";
import { getSiteOrigin } from "@/lib/siteOrigin";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteOrigin();
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${origin}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/studio`, lastModified, changeFrequency: "weekly", priority: 0.95 },
    { url: `${origin}/faq`, lastModified, changeFrequency: "monthly", priority: 0.85 },
    { url: `${origin}/blog`, lastModified, changeFrequency: "weekly", priority: 0.9 },
  ];

  const blogRoutes: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${origin}/blog/${post.slug}`,
    lastModified: new Date(post.updated ?? post.published),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...blogRoutes];
}
