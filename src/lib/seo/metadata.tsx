import type { Metadata } from "next";
import type { BlogPost } from "@/content/blogPosts";
import type { ShareSeoMeta } from "@/server/shareService";
import {
  BLOG_IMAGE_HEIGHT,
  BLOG_IMAGE_WIDTH,
  BLOG_INDEX_DESCRIPTION,
  BLOG_INDEX_TITLE,
  BLOG_POSTS,
  getBlogPostImageAlt,
  getBlogPostImagePath,
} from "@/content/blogPosts";
import { FAQ_PAGE_DESCRIPTION, FAQ_PAGE_TITLE } from "@/content/faq";
import { CONTACT_PAGE_DESCRIPTION, CONTACT_PAGE_TITLE } from "@/content/contact";
import { PRIVACY_PAGE_DESCRIPTION, PRIVACY_PAGE_TITLE } from "@/content/privacy";
import { displayShareLabel } from "@/lib/shareName";
import {
  buildLandingJsonLd,
  LANDING_DESCRIPTION,
  LANDING_KEYWORDS,
  LANDING_OG_IMAGE_ALT,
  LANDING_OG_IMAGE_HEIGHT,
  LANDING_OG_IMAGE_PATH,
  LANDING_OG_IMAGE_TYPE,
  LANDING_OG_IMAGE_WIDTH,
  LANDING_TITLE,
} from "@/seo/landingHead";
import { buildFaqJsonLd } from "@/seo/faqHead";
import {
  STUDIO_DESCRIPTION,
  STUDIO_KEYWORDS,
  STUDIO_TITLE,
  buildStudioJsonLd,
} from "@/seo/studioHead";
import { SITE_KEYWORDS_META } from "@/seo/siteKeywords";
import { getSiteOrigin } from "@/lib/siteOrigin";

/** Avoid Next.js root title templates doubling the brand suffix. */
function absoluteTitle(title: string): Metadata["title"] {
  return { absolute: title };
}

function resolveOgImageVersion(): string {
  return process.env.NEXT_PUBLIC_OG_IMAGE_VERSION?.trim() || "1";
}

export function getOgImageUrl(origin: string): string {
  const url = new URL(LANDING_OG_IMAGE_PATH, `${origin.replace(/\/$/, "")}/`);
  url.searchParams.set("v", resolveOgImageVersion());
  return url.toString();
}

function getBlogPostOgImageUrl(origin: string, slug: string): string {
  return new URL(
    getBlogPostImagePath(slug),
    `${origin.replace(/\/$/, "")}/`,
  ).toString();
}

function buildOpenGraph(
  title: string,
  description: string,
  path: string,
  type: "website" | "article" = "website",
  image?: {
    url: string;
    width?: number | null;
    height?: number | null;
    alt?: string;
    type?: string;
  } | null,
  article?: { publishedTime: string; modifiedTime: string },
): Metadata["openGraph"] {
  const origin = getSiteOrigin();
  const imageUrl = image?.url ?? getOgImageUrl(origin);
  const base = {
    title,
    description,
    type,
    url: `${origin}${path}`,
    images: [
      {
        url: imageUrl,
        width: image?.width ?? LANDING_OG_IMAGE_WIDTH,
        height: image?.height ?? LANDING_OG_IMAGE_HEIGHT,
        alt: image?.alt ?? LANDING_OG_IMAGE_ALT,
        type: image?.type ?? LANDING_OG_IMAGE_TYPE,
      },
    ],
  };
  if (type === "article" && article) {
    return { ...base, publishedTime: article.publishedTime, modifiedTime: article.modifiedTime };
  }
  return base;
}

function buildTwitter(
  title: string,
  description: string,
  imageUrl?: string | null,
): Metadata["twitter"] {
  const origin = getSiteOrigin();
  return {
    card: "summary_large_image",
    title,
    description,
    images: [imageUrl ?? getOgImageUrl(origin)],
  };
}

function sharePageTitle(meta: ShareSeoMeta): string {
  const label = displayShareLabel(meta.name, null);
  if (meta.isPreview) {
    return `${label} · View-Only Packaging Preview | 3D Box Studio`;
  }
  return `${label} · Free 3D Box Designer | 3D Box Studio`;
}

function sharePageDescription(meta: ShareSeoMeta): string {
  const label = displayShareLabel(meta.name, null);
  if (meta.isPreview) {
    return `View-only 3D packaging preview of “${label}” in 3D Box Studio. Orbit the carton, check materials and openings, and review artwork in your browser—no editor access.`;
  }
  return `Open “${label}” in the free 3D Box Studio online box designer. Adjust dimensions, packaging materials, lid openings, and per-face artwork, then export PNG mockups.`;
}

export function createLandingMetadata(): Metadata {
  const origin = getSiteOrigin();
  return {
    title: absoluteTitle(LANDING_TITLE),
    description: LANDING_DESCRIPTION,
    keywords: LANDING_KEYWORDS.split(", "),
    metadataBase: new URL(origin),
    alternates: { canonical: "/" },
    openGraph: buildOpenGraph(LANDING_TITLE, LANDING_DESCRIPTION, "/"),
    twitter: buildTwitter(LANDING_TITLE, LANDING_DESCRIPTION),
  };
}

export function createStudioMetadata(): Metadata {
  return {
    title: absoluteTitle(STUDIO_TITLE),
    description: STUDIO_DESCRIPTION,
    keywords: STUDIO_KEYWORDS.split(", "),
    alternates: { canonical: "/studio" },
    openGraph: buildOpenGraph(STUDIO_TITLE, STUDIO_DESCRIPTION, "/studio"),
    twitter: buildTwitter(STUDIO_TITLE, STUDIO_DESCRIPTION),
  };
}

export function createShareMetadata(meta: ShareSeoMeta): Metadata {
  const title = sharePageTitle(meta);
  const description = sharePageDescription(meta);
  const ogImage = meta.ogImageUrl
    ? {
        url: meta.ogImageUrl,
        width: meta.ogImageWidth,
        height: meta.ogImageHeight,
        alt: `${displayShareLabel(meta.name, null)} 3D packaging preview`,
        type: "image/png",
      }
    : null;

  return {
    title: absoluteTitle(title),
    description,
    keywords: SITE_KEYWORDS_META.split(", "),
    alternates: { canonical: meta.canonicalPath },
    openGraph: buildOpenGraph(title, description, meta.canonicalPath, "website", ogImage),
    twitter: buildTwitter(title, description, meta.ogImageUrl),
  };
}

export function createFaqMetadata(): Metadata {
  return {
    title: absoluteTitle(FAQ_PAGE_TITLE),
    description: FAQ_PAGE_DESCRIPTION,
    keywords: SITE_KEYWORDS_META.split(", "),
    alternates: { canonical: "/faq" },
    openGraph: buildOpenGraph(FAQ_PAGE_TITLE, FAQ_PAGE_DESCRIPTION, "/faq"),
    twitter: buildTwitter(FAQ_PAGE_TITLE, FAQ_PAGE_DESCRIPTION),
  };
}

export function createContactMetadata(): Metadata {
  return {
    title: absoluteTitle(CONTACT_PAGE_TITLE),
    description: CONTACT_PAGE_DESCRIPTION,
    keywords: SITE_KEYWORDS_META.split(", "),
    alternates: { canonical: "/contact" },
    openGraph: buildOpenGraph(CONTACT_PAGE_TITLE, CONTACT_PAGE_DESCRIPTION, "/contact"),
    twitter: buildTwitter(CONTACT_PAGE_TITLE, CONTACT_PAGE_DESCRIPTION),
  };
}

export function createPrivacyMetadata(): Metadata {
  return {
    title: absoluteTitle(PRIVACY_PAGE_TITLE),
    description: PRIVACY_PAGE_DESCRIPTION,
    keywords: SITE_KEYWORDS_META.split(", "),
    alternates: { canonical: "/privacy" },
    openGraph: buildOpenGraph(PRIVACY_PAGE_TITLE, PRIVACY_PAGE_DESCRIPTION, "/privacy"),
    twitter: buildTwitter(PRIVACY_PAGE_TITLE, PRIVACY_PAGE_DESCRIPTION),
  };
}

export function createBlogIndexMetadata(): Metadata {
  return {
    title: absoluteTitle(BLOG_INDEX_TITLE),
    description: BLOG_INDEX_DESCRIPTION,
    keywords: SITE_KEYWORDS_META.split(", "),
    alternates: { canonical: "/blog" },
    openGraph: buildOpenGraph(BLOG_INDEX_TITLE, BLOG_INDEX_DESCRIPTION, "/blog"),
    twitter: buildTwitter(BLOG_INDEX_TITLE, BLOG_INDEX_DESCRIPTION),
  };
}

export function createBlogPostMetadata(post: BlogPost): Metadata {
  const title = `${post.title} | Free 3D Box Designer | 3D Box Studio`;
  const path = `/blog/${post.slug}`;
  const origin = getSiteOrigin();
  const imageUrl = getBlogPostOgImageUrl(origin, post.slug);
  const imageAlt = getBlogPostImageAlt(post);
  const ogImage = {
    url: imageUrl,
    width: BLOG_IMAGE_WIDTH,
    height: BLOG_IMAGE_HEIGHT,
    alt: imageAlt,
    type: "image/webp",
  };
  const keywords = Array.from(
    new Set([...post.keywords, ...SITE_KEYWORDS_META.split(", ").slice(0, 6)]),
  );
  return {
    title: absoluteTitle(title),
    description: post.description,
    keywords,
    alternates: { canonical: path },
    openGraph: buildOpenGraph(title, post.description, path, "article", ogImage, {
      publishedTime: post.published,
      modifiedTime: post.updated ?? post.published,
    }),
    twitter: buildTwitter(title, post.description, imageUrl),
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

export function StudioJsonLd() {
  const origin = getSiteOrigin();
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(buildStudioJsonLd(origin)) }}
    />
  );
}

export function BlogIndexJsonLd() {
  const origin = getSiteOrigin();
  const data = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "3D Box Studio Packaging Blog",
    alternateName: "Free 3D Box Design & Mockup Guides",
    description: BLOG_INDEX_DESCRIPTION,
    url: `${origin}/blog`,
    blogPost: BLOG_POSTS.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      datePublished: post.published,
      dateModified: post.updated ?? post.published,
      url: `${origin}/blog/${post.slug}`,
      image: getBlogPostOgImageUrl(origin, post.slug),
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
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
    keywords: Array.from(
      new Set([...post.keywords, ...SITE_KEYWORDS_META.split(", ").slice(0, 6)]),
    ).join(", "),
    image: getBlogPostOgImageUrl(origin, post.slug),
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
