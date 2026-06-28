import type { Metadata } from "next";
import type { BlogPost } from "@/content/blogPosts";
import {
  BLOG_INDEX_DESCRIPTION,
  BLOG_INDEX_TITLE,
} from "@/content/blogPosts";
import { FAQ_PAGE_DESCRIPTION, FAQ_PAGE_TITLE } from "@/content/faq";
import {
  buildLandingJsonLd,
  LANDING_DESCRIPTION,
  LANDING_OG_IMAGE_ALT,
  LANDING_OG_IMAGE_HEIGHT,
  LANDING_OG_IMAGE_PATH,
  LANDING_OG_IMAGE_TYPE,
  LANDING_OG_IMAGE_WIDTH,
  LANDING_TITLE,
} from "@/seo/landingHead";
import { buildFaqJsonLd } from "@/seo/faqHead";
import { STUDIO_DESCRIPTION, STUDIO_TITLE } from "@/seo/studioHead";
import { getSiteOrigin } from "@/lib/siteOrigin";

function resolveOgImageVersion(): string {
  return process.env.NEXT_PUBLIC_OG_IMAGE_VERSION?.trim() || "1";
}

export function getOgImageUrl(origin: string): string {
  const url = new URL(LANDING_OG_IMAGE_PATH, `${origin.replace(/\/$/, "")}/`);
  url.searchParams.set("v", resolveOgImageVersion());
  return url.toString();
}

function buildOpenGraph(
  title: string,
  description: string,
  path: string,
  type: "website" | "article" = "website",
): Metadata["openGraph"] {
  const origin = getSiteOrigin();
  const imageUrl = getOgImageUrl(origin);
  return {
    title,
    description,
    type,
    url: `${origin}${path}`,
    images: [
      {
        url: imageUrl,
        width: LANDING_OG_IMAGE_WIDTH,
        height: LANDING_OG_IMAGE_HEIGHT,
        alt: LANDING_OG_IMAGE_ALT,
        type: LANDING_OG_IMAGE_TYPE,
      },
    ],
  };
}

function buildTwitter(title: string, description: string): Metadata["twitter"] {
  const origin = getSiteOrigin();
  return {
    card: "summary_large_image",
    title,
    description,
    images: [getOgImageUrl(origin)],
  };
}

export function createLandingMetadata(): Metadata {
  const origin = getSiteOrigin();
  return {
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
    metadataBase: new URL(origin),
    alternates: { canonical: "/" },
    openGraph: buildOpenGraph(LANDING_TITLE, LANDING_DESCRIPTION, "/"),
    twitter: buildTwitter(LANDING_TITLE, LANDING_DESCRIPTION),
  };
}

export function createStudioMetadata(): Metadata {
  return {
    title: STUDIO_TITLE,
    description: STUDIO_DESCRIPTION,
    alternates: { canonical: "/studio" },
    openGraph: buildOpenGraph(STUDIO_TITLE, STUDIO_DESCRIPTION, "/studio"),
    twitter: buildTwitter(STUDIO_TITLE, STUDIO_DESCRIPTION),
  };
}

export function createFaqMetadata(): Metadata {
  return {
    title: FAQ_PAGE_TITLE,
    description: FAQ_PAGE_DESCRIPTION,
    alternates: { canonical: "/faq" },
    openGraph: buildOpenGraph(FAQ_PAGE_TITLE, FAQ_PAGE_DESCRIPTION, "/faq"),
    twitter: buildTwitter(FAQ_PAGE_TITLE, FAQ_PAGE_DESCRIPTION),
  };
}

export function createBlogIndexMetadata(): Metadata {
  return {
    title: BLOG_INDEX_TITLE,
    description: BLOG_INDEX_DESCRIPTION,
    alternates: { canonical: "/blog" },
    openGraph: buildOpenGraph(BLOG_INDEX_TITLE, BLOG_INDEX_DESCRIPTION, "/blog"),
    twitter: buildTwitter(BLOG_INDEX_TITLE, BLOG_INDEX_DESCRIPTION),
  };
}

export function createBlogPostMetadata(post: BlogPost): Metadata {
  const title = `${post.title} | 3D Box Studio`;
  const path = `/blog/${post.slug}`;
  return {
    title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: path },
    openGraph: buildOpenGraph(title, post.description, path, "article"),
    twitter: buildTwitter(title, post.description),
  };
}

export function LandingJsonLd() {
  const origin = getSiteOrigin();
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(buildLandingJsonLd(origin)) }}
    />
  );
}

export function FaqJsonLd() {
  const origin = getSiteOrigin();
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqJsonLd(origin)) }}
    />
  );
}

export function BlogPostJsonLd({ post }: { post: BlogPost }) {
  const origin = getSiteOrigin();
  const url = `${origin}/blog/${post.slug}`;
  const data = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.published,
    dateModified: post.updated ?? post.published,
    keywords: post.keywords.join(", "),
    url,
    mainEntityOfPage: url,
    author: { "@type": "Organization", name: "3D Box Studio" },
    publisher: { "@type": "Organization", name: "3D Box Studio" },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
