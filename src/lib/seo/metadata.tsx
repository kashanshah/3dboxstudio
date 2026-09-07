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
import { getLocalizedBlogIndexPost, hasBlogTranslation } from "@/content/blogLocales";
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
import { locales, type Locale } from "@/i18n/config";
import {
  getStaticPageAlternateLocales,
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

function localizePath(path: string, locale: string = "en"): string {
  if (locale === "en") return path;
  if (path === "/") return `/${locale}`;
  return `/${locale}${path}`;
}

function localizedAlternates(
  path: string,
  supportedLocales: readonly Locale[] = locales,
): NonNullable<Metadata["alternates"]>["languages"] {
  return Object.fromEntries(
    supportedLocales.map((locale) => [locale, localizePath(path, locale)]),
  );
}

function resolveStaticPagePath(path: StaticPath, locale: string) {
  const normalizedLocale = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "en";
  const canonicalLocale = getStaticPageCanonicalLocale(normalizedLocale, path);
  const alternates = localizedAlternates(path, getStaticPageAlternateLocales(path));
  return {
    canonicalLocale,
    canonicalPath: localizePath(path, canonicalLocale),
    alternates,
  };
}

function localizedBlogAlternates(slug: string): NonNullable<Metadata["alternates"]>["languages"] {
  const path = `/blog/${slug}`;
  return Object.fromEntries(
    locales
      .filter((locale) => locale === "en" || hasBlogTranslation(locale, slug))
      .map((locale) => [locale, localizePath(path, locale)]),
  );
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

export function createLandingMetadata(locale: string = "en"): Metadata {
  const { canonicalPath, alternates } = resolveStaticPagePath("/", locale);
  return {
    title: absoluteTitle(LANDING_TITLE),
    description: LANDING_DESCRIPTION,
    keywords: LANDING_KEYWORDS.split(", "),
    metadataBase: new URL(getSiteOrigin()),
    alternates: { canonical: canonicalPath, languages: alternates },
    openGraph: buildOpenGraph(LANDING_TITLE, LANDING_DESCRIPTION, canonicalPath),
    twitter: buildTwitter(LANDING_TITLE, LANDING_DESCRIPTION),
  };
}

export function createStudioMetadata(locale: string = "en"): Metadata {
  const { canonicalPath, alternates } = resolveStaticPagePath("/studio", locale);
  return {
    title: absoluteTitle(STUDIO_TITLE),
    description: STUDIO_DESCRIPTION,
    keywords: STUDIO_KEYWORDS.split(", "),
    alternates: { canonical: canonicalPath, languages: alternates },
    openGraph: buildOpenGraph(STUDIO_TITLE, STUDIO_DESCRIPTION, canonicalPath),
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

export function createFaqMetadata(locale: string = "en"): Metadata {
  const { canonicalPath, alternates } = resolveStaticPagePath("/faq", locale);
  return {
    title: absoluteTitle(FAQ_PAGE_TITLE),
    description: FAQ_PAGE_DESCRIPTION,
    keywords: SITE_KEYWORDS_META.split(", "),
    alternates: { canonical: canonicalPath, languages: alternates },
    openGraph: buildOpenGraph(FAQ_PAGE_TITLE, FAQ_PAGE_DESCRIPTION, canonicalPath),
    twitter: buildTwitter(FAQ_PAGE_TITLE, FAQ_PAGE_DESCRIPTION),
  };
}

export function createContactMetadata(locale: string = "en"): Metadata {
  const { canonicalPath, alternates } = resolveStaticPagePath("/contact", locale);
  return {
    title: absoluteTitle(CONTACT_PAGE_TITLE),
    description: CONTACT_PAGE_DESCRIPTION,
    keywords: SITE_KEYWORDS_META.split(", "),
    alternates: { canonical: canonicalPath, languages: alternates },
    openGraph: buildOpenGraph(CONTACT_PAGE_TITLE, CONTACT_PAGE_DESCRIPTION, canonicalPath),
    twitter: buildTwitter(CONTACT_PAGE_TITLE, CONTACT_PAGE_DESCRIPTION),
  };
}

export function createPrivacyMetadata(locale: string = "en"): Metadata {
  const { canonicalPath, alternates } = resolveStaticPagePath("/privacy", locale);
  return {
    title: absoluteTitle(PRIVACY_PAGE_TITLE),
    description: PRIVACY_PAGE_DESCRIPTION,
    keywords: SITE_KEYWORDS_META.split(", "),
    alternates: { canonical: canonicalPath, languages: alternates },
    openGraph: buildOpenGraph(PRIVACY_PAGE_TITLE, PRIVACY_PAGE_DESCRIPTION, canonicalPath),
    twitter: buildTwitter(PRIVACY_PAGE_TITLE, PRIVACY_PAGE_DESCRIPTION),
  };
}

export function createTermsMetadata(locale: string = "en"): Metadata {
  const { canonicalPath, alternates } = resolveStaticPagePath("/terms", locale);
  return {
    title: absoluteTitle(TERMS_PAGE_TITLE),
    description: TERMS_PAGE_DESCRIPTION,
    keywords: SITE_KEYWORDS_META.split(", "),
    alternates: { canonical: canonicalPath, languages: alternates },
    openGraph: buildOpenGraph(TERMS_PAGE_TITLE, TERMS_PAGE_DESCRIPTION, canonicalPath),
    twitter: buildTwitter(TERMS_PAGE_TITLE, TERMS_PAGE_DESCRIPTION),
  };
}

const BLOG_INDEX_LOCALIZED_COPY: Record<Locale, { title: string; description: string }> = {
  en: {
    title: BLOG_INDEX_TITLE,
    description: BLOG_INDEX_DESCRIPTION,
  },
  fr: {
    title: "Blog design de boîtes 3D — Mockups d’emballage gratuits, guides cartons et mailers | 3D Box Studio",
    description:
      "Guides pratiques sur les concepteurs de boîtes 3D gratuits, les générateurs de mockups d’emballage, les aperçus de cartons pliants, les mockups de boîtes mailer et les outils de création de boîtes dans le navigateur pour l’e-commerce, la beauté, le café, l’électronique, la bijouterie, l’impression, les freelances et les équipes packaging.",
  },
  es: {
    title: "Blog de diseño de cajas 3D — Mockups de packaging gratis, guías de cartones y mailers | 3D Box Studio",
    description:
      "Guías prácticas sobre creadores de cajas 3D gratuitos, generadores de mockups de packaging, vistas previas de cartones plegables, mockups de cajas mailer y herramientas de cajas en navegador para e-commerce, belleza, café, electrónica, joyería, imprentas, freelancers y equipos de packaging.",
  },
  zh: {
    title: "3D 盒型设计博客 — 免费包装样机、纸盒与 Mailer 指南 | 3D Box Studio",
    description:
      "实用指南，涵盖免费的 3D 盒型设计工具、包装样机生成器、折叠纸盒预览、Mailer 包装盒样机，以及面向电商、美妆、咖啡、电子、珠宝、印刷、自由设计师和包装团队的浏览器式盒型工具。",
  },
};

export function createBlogIndexMetadata(locale: string = "en"): Metadata {
  const { canonicalLocale, canonicalPath, alternates } = resolveStaticPagePath("/blog", locale);
  const copy = BLOG_INDEX_LOCALIZED_COPY[canonicalLocale];
  return {
    title: absoluteTitle(copy.title),
    description: copy.description,
    keywords: SITE_KEYWORDS_META.split(", "),
    alternates: { canonical: canonicalPath, languages: alternates },
    openGraph: buildOpenGraph(copy.title, copy.description, canonicalPath),
    twitter: buildTwitter(copy.title, copy.description),
  };
}

export function createBlogPostMetadata(
  post: BlogPost,
  locale: string = "en"
): Metadata {
  const localizedLocale =
    locale !== "en" && hasBlogTranslation(locale as Locale, post.slug) ? locale : "en";
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
    alternates: {
      canonical: localizedPath,
      languages: localizedBlogAlternates(post.slug),
    },
    openGraph: buildOpenGraph(seoTitle, post.description, localizedPath, "article", ogImage, {
      publishedTime: post.published,
      modifiedTime: post.updated ?? post.published,
    }),
    twitter: buildTwitter(seoTitle, post.description, imageUrl),
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

export function StudioJsonLd() {
  const origin = getSiteOrigin();
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(buildStudioJsonLd(origin)) }}
    />
  );
}

export function BlogIndexJsonLd({ locale = "en" }: { locale?: string }) {
  if (!(locales as readonly string[]).includes(locale) || !isStaticPageTranslated(locale as Locale, "/blog")) {
    return null;
  }
  const normalizedLocale = locale as Locale;
  const copy = BLOG_INDEX_LOCALIZED_COPY[normalizedLocale];
  const origin = getSiteOrigin();
  const data = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: copy.title,
    alternateName: copy.title,
    description: copy.description,
    url: `${origin}${localizePath("/blog", normalizedLocale)}`,
    blogPost: BLOG_POSTS.map((post) => {
      const localizedPost = getLocalizedBlogIndexPost(post.slug, normalizedLocale) ?? post;
      const articleLocale =
        normalizedLocale !== "en" && hasBlogTranslation(normalizedLocale, post.slug) ? normalizedLocale : "en";
      return {
      "@type": "BlogPosting",
      headline: localizedPost.title,
      description: localizedPost.description,
      datePublished: post.published,
      dateModified: post.updated ?? post.published,
      url: `${origin}${localizePath(`/blog/${post.slug}`, articleLocale)}`,
      image: getBlogPostOgImageUrl(origin, post.slug),
      };
    }),
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
  const blogPosting = {
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
