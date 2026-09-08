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
  plainBlogInlineText,
} from "@/content/blogPosts";
import { FAQ_PAGE_DESCRIPTION, FAQ_PAGE_TITLE } from "@/content/faq";
import { CONTACT_PAGE_DESCRIPTION, CONTACT_PAGE_TITLE } from "@/content/contact";
import { PRIVACY_PAGE_DESCRIPTION, PRIVACY_PAGE_TITLE } from "@/content/privacy";
import { TERMS_PAGE_DESCRIPTION, TERMS_PAGE_TITLE } from "@/content/terms";
import { hasBlogTranslation } from "@/content/blogLocales";
import { displayShareLabel } from "@/lib/shareName";
import {
  buildLandingJsonLd,
  LANDING_OG_IMAGE_ALT,
  LANDING_OG_IMAGE_HEIGHT,
  LANDING_OG_IMAGE_PATH,
  LANDING_OG_IMAGE_TYPE,
  LANDING_OG_IMAGE_WIDTH,
} from "@/seo/landingHead";
import { buildFaqJsonLd } from "@/seo/faqHead";
import { buildStudioJsonLd } from "@/seo/studioHead";
import { getLandingPageMeta, getStudioPageMeta } from "@/seo/localePageMeta";
import { SITE_KEYWORDS_META } from "@/seo/siteKeywords";
import { locales, type Locale } from "@/i18n/config";
import { absoluteLocalizedUrl, localeOgLocale, localizePath } from "@/i18n/localePaths";
import {
  buildBlogLanguageAlternates,
  buildLanguageAlternates,
  getIndexableAlternateLocales,
  parseLocale,
  robotsForBlogPost,
  robotsForStaticPage,
} from "@/i18n/seoPolicy";
import {
  getStaticPageCanonicalLocale,
  isStaticPageTranslated,
  type StaticPath,
} from "@/i18n/staticPageTranslations";
import { getSiteOrigin } from "@/lib/siteOrigin";

/** Avoid Next.js root title templates doubling the brand suffix. */
function absoluteTitle(title: string): Metadata["title"] {
  return { absolute: title };
}

function resolveOgImageVersion(): string {
  return process.env.NEXT_PUBLIC_OG_IMAGE_VERSION?.trim() || "1";
}

function resolveStaticPagePath(path: StaticPath, locale: string) {
  const normalizedLocale = parseLocale(locale);
  const canonicalLocale = getStaticPageCanonicalLocale(normalizedLocale, path);
  const alternates = buildLanguageAlternates(path, getIndexableAlternateLocales(path));
  return {
    canonicalLocale,
    canonicalPath: localizePath(path, canonicalLocale),
    alternates,
  };
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
  locale: Locale = "en",
): Metadata["openGraph"] {
  const origin = getSiteOrigin();
  const imageUrl = image?.url ?? getOgImageUrl(origin);
  const base = {
    title,
    description,
    type,
    locale: localeOgLocale[locale],
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

export function createLandingMetadata(locale: string = "en"): Metadata {
  const normalized = parseLocale(locale);
  const meta = getLandingPageMeta(normalized);
  const { canonicalPath, alternates } = resolveStaticPagePath("/", normalized);
  return {
    title: absoluteTitle(meta.title),
    description: meta.description,
    keywords: meta.keywords.split(", ").map((k) => k.trim()).filter(Boolean),
    metadataBase: new URL(getSiteOrigin()),
    robots: robotsForStaticPage(normalized, "/"),
    alternates: { canonical: canonicalPath, languages: alternates },
    openGraph: buildOpenGraph(meta.title, meta.description, canonicalPath, "website", null, undefined, normalized),
    twitter: buildTwitter(meta.title, meta.description),
  };
}

export function createStudioMetadata(locale: string = "en"): Metadata {
  const normalized = parseLocale(locale);
  const meta = getStudioPageMeta(normalized);
  const { canonicalPath, alternates } = resolveStaticPagePath("/studio", normalized);
  return {
    title: absoluteTitle(meta.title),
    description: meta.description,
    keywords: meta.keywords.split(", ").map((k) => k.trim()).filter(Boolean),
    robots: robotsForStaticPage(normalized, "/studio"),
    alternates: { canonical: canonicalPath, languages: alternates },
    openGraph: buildOpenGraph(meta.title, meta.description, canonicalPath, "website", null, undefined, normalized),
    twitter: buildTwitter(meta.title, meta.description),
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

export function createFaqMetadata(locale: string = "en"): Metadata {
  const normalized = parseLocale(locale);
  const { canonicalPath, alternates } = resolveStaticPagePath("/faq", normalized);
  return {
    title: absoluteTitle(FAQ_PAGE_TITLE),
    description: FAQ_PAGE_DESCRIPTION,
    keywords: SITE_KEYWORDS_META.split(", "),
    robots: robotsForStaticPage(normalized, "/faq"),
    alternates: { canonical: canonicalPath, languages: alternates },
    openGraph: buildOpenGraph(FAQ_PAGE_TITLE, FAQ_PAGE_DESCRIPTION, canonicalPath, "website", null, undefined, normalized),
    twitter: buildTwitter(FAQ_PAGE_TITLE, FAQ_PAGE_DESCRIPTION),
  };
}

export function createContactMetadata(locale: string = "en"): Metadata {
  const normalized = parseLocale(locale);
  const { canonicalPath, alternates } = resolveStaticPagePath("/contact", normalized);
  return {
    title: absoluteTitle(CONTACT_PAGE_TITLE),
    description: CONTACT_PAGE_DESCRIPTION,
    keywords: SITE_KEYWORDS_META.split(", "),
    robots: robotsForStaticPage(normalized, "/contact"),
    alternates: { canonical: canonicalPath, languages: alternates },
    openGraph: buildOpenGraph(CONTACT_PAGE_TITLE, CONTACT_PAGE_DESCRIPTION, canonicalPath, "website", null, undefined, normalized),
    twitter: buildTwitter(CONTACT_PAGE_TITLE, CONTACT_PAGE_DESCRIPTION),
  };
}

export function createPrivacyMetadata(locale: string = "en"): Metadata {
  const normalized = parseLocale(locale);
  const { canonicalPath, alternates } = resolveStaticPagePath("/privacy", normalized);
  return {
    title: absoluteTitle(PRIVACY_PAGE_TITLE),
    description: PRIVACY_PAGE_DESCRIPTION,
    keywords: SITE_KEYWORDS_META.split(", "),
    robots: robotsForStaticPage(normalized, "/privacy"),
    alternates: { canonical: canonicalPath, languages: alternates },
    openGraph: buildOpenGraph(PRIVACY_PAGE_TITLE, PRIVACY_PAGE_DESCRIPTION, canonicalPath, "website", null, undefined, normalized),
    twitter: buildTwitter(PRIVACY_PAGE_TITLE, PRIVACY_PAGE_DESCRIPTION),
  };
}

export function createTermsMetadata(locale: string = "en"): Metadata {
  const normalized = parseLocale(locale);
  const { canonicalPath, alternates } = resolveStaticPagePath("/terms", normalized);
  return {
    title: absoluteTitle(TERMS_PAGE_TITLE),
    description: TERMS_PAGE_DESCRIPTION,
    keywords: SITE_KEYWORDS_META.split(", "),
    robots: robotsForStaticPage(normalized, "/terms"),
    alternates: { canonical: canonicalPath, languages: alternates },
    openGraph: buildOpenGraph(TERMS_PAGE_TITLE, TERMS_PAGE_DESCRIPTION, canonicalPath, "website", null, undefined, normalized),
    twitter: buildTwitter(TERMS_PAGE_TITLE, TERMS_PAGE_DESCRIPTION),
  };
}

export function createBlogIndexMetadata(locale: string = "en"): Metadata {
  const normalized = parseLocale(locale);
  const { canonicalPath, alternates } = resolveStaticPagePath("/blog", normalized);
  return {
    title: absoluteTitle(BLOG_INDEX_TITLE),
    description: BLOG_INDEX_DESCRIPTION,
    keywords: SITE_KEYWORDS_META.split(", "),
    robots: robotsForStaticPage(normalized, "/blog"),
    alternates: { canonical: canonicalPath, languages: alternates },
    openGraph: buildOpenGraph(BLOG_INDEX_TITLE, BLOG_INDEX_DESCRIPTION, canonicalPath, "website", null, undefined, normalized),
    twitter: buildTwitter(BLOG_INDEX_TITLE, BLOG_INDEX_DESCRIPTION),
  };
}

export function createBlogPostMetadata(
  post: BlogPost,
  locale: string = "en"
): Metadata {
  const normalized = parseLocale(locale);
  const hasTranslation = normalized === "en" || hasBlogTranslation(normalized, post.slug);
  const localizedLocale = hasTranslation ? normalized : "en";
  const seoTitle = post.seoTitle ?? post.title;
  const title = post.seoTitle
    ? `${post.seoTitle} | 3D Box Studio`
    : `${post.title} | Free 3D Box Designer | 3D Box Studio`;
  const path = `/blog/${post.slug}`;
  const localizedPath = localizePath(path, localizedLocale);
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
    robots: robotsForBlogPost(normalized, post.slug),
    alternates: {
      canonical: localizedPath,
      languages: buildBlogLanguageAlternates(post.slug),
    },
    openGraph: buildOpenGraph(
      seoTitle,
      post.description,
      localizedPath,
      "article",
      ogImage,
      {
        publishedTime: post.published,
        modifiedTime: post.updated ?? post.published,
      },
      localizedLocale,
    ),
    twitter: buildTwitter(seoTitle, post.description, imageUrl),
  };
}

export function LandingJsonLd({ locale = "en" }: { locale?: string }) {
  const normalized = parseLocale(locale);
  const origin = getSiteOrigin();
  const meta = getLandingPageMeta(normalized);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(
          buildLandingJsonLd(origin, {
            locale: normalized,
            description: meta.description,
            homeUrl: absoluteLocalizedUrl(origin, "/", normalized),
            studioUrl: absoluteLocalizedUrl(origin, "/studio", normalized),
          }),
        ),
      }}
    />
  );
}

export function FaqJsonLd({ locale = "en" }: { locale?: string }) {
  if (!(locales as readonly string[]).includes(locale) || !isStaticPageTranslated(locale as Locale, "/faq")) {
    return null;
  }
  const origin = getSiteOrigin();
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqJsonLd(origin)) }}
    />
  );
}

export function StudioJsonLd({ locale = "en" }: { locale?: string }) {
  const normalized = parseLocale(locale);
  const origin = getSiteOrigin();
  const meta = getStudioPageMeta(normalized);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(
          buildStudioJsonLd(origin, {
            description: meta.description,
            url: absoluteLocalizedUrl(origin, "/studio", normalized),
          }),
        ),
      }}
    />
  );
}

export function BlogIndexJsonLd({ locale = "en" }: { locale?: string }) {
  if (!(locales as readonly string[]).includes(locale) || !isStaticPageTranslated(locale as Locale, "/blog")) {
    return null;
  }
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

export function BlogPostJsonLd({
  post,
  locale = "en",
}: {
  post: BlogPost;
  locale?: string;
}) {
  const normalized = parseLocale(locale);
  const hasTranslation = normalized === "en" || hasBlogTranslation(normalized, post.slug);
  const localizedLocale = hasTranslation ? normalized : "en";
  const origin = getSiteOrigin();
  const url = absoluteLocalizedUrl(origin, `/blog/${post.slug}`, localizedLocale);
  const blogPosting = {
    "@type": "BlogPosting",
    inLanguage: localizedLocale,
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

  const data =
    post.faqs && post.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@graph": [
            blogPosting,
            {
              "@type": "FAQPage",
              mainEntity: post.faqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: plainBlogInlineText(faq.answer),
                },
              })),
            },
          ],
        }
      : {
          "@context": "https://schema.org",
          ...blogPosting,
        };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
