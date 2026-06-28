import type { BlogPost } from "../content/blogPosts";
import {
  BLOG_INDEX_DESCRIPTION,
  BLOG_INDEX_TITLE,
  BLOG_POSTS,
} from "../content/blogPosts";
import {
  applySocialMeta,
  buildSocialMetaTags,
  cleanupRouteSeo,
  escapeHtml,
  setCanonical,
  setJsonLd,
  setMeta,
} from "./metaUtils";
import {
  getLandingOgImageUrl,
  LANDING_OG_IMAGE_ALT,
  LANDING_OG_IMAGE_HEIGHT,
  LANDING_OG_IMAGE_TYPE,
  LANDING_OG_IMAGE_WIDTH,
} from "./landingHead";

function buildBlogIndexJsonLd(origin: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "3D Box Studio Blog",
    description: BLOG_INDEX_DESCRIPTION,
    url: origin ? `${origin}/blog` : "/blog",
    blogPost: BLOG_POSTS.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      datePublished: post.published,
      dateModified: post.updated ?? post.published,
      url: origin ? `${origin}/blog/${post.slug}` : `/blog/${post.slug}`,
    })),
  };
}

function buildBlogPostJsonLd(origin: string, post: BlogPost) {
  const url = origin ? `${origin}/blog/${post.slug}` : `/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.published,
    dateModified: post.updated ?? post.published,
    keywords: post.keywords.join(", "),
    url,
    mainEntityOfPage: url,
    author: {
      "@type": "Organization",
      name: "3D Box Studio",
    },
    publisher: {
      "@type": "Organization",
      name: "3D Box Studio",
    },
  };
}

export function applyBlogIndexRouteSeo(doc: Document, origin: string): () => void {
  doc.title = BLOG_INDEX_TITLE;
  setMeta(doc, "description", BLOG_INDEX_DESCRIPTION);
  const themeMeta = doc.querySelector('meta[name="theme-color"]');
  const prevThemeColor = themeMeta?.getAttribute("content") ?? null;
  if (themeMeta) {
    themeMeta.setAttribute("content", "#e8edf4");
    themeMeta.setAttribute("data-landing-theme", "1");
  }
  if (origin) {
    const url = `${origin}/blog`;
    applySocialMeta(doc, {
      title: BLOG_INDEX_TITLE,
      description: BLOG_INDEX_DESCRIPTION,
      url,
      imageUrl: getLandingOgImageUrl(origin),
      imageAlt: LANDING_OG_IMAGE_ALT,
      imageWidth: LANDING_OG_IMAGE_WIDTH,
      imageHeight: LANDING_OG_IMAGE_HEIGHT,
      imageType: LANDING_OG_IMAGE_TYPE,
    });
    setCanonical(doc, url);
  }
  setJsonLd(doc, buildBlogIndexJsonLd(origin));
  return () => {
    cleanupRouteSeo(doc);
    if (themeMeta?.hasAttribute("data-landing-theme")) {
      themeMeta.removeAttribute("data-landing-theme");
      if (prevThemeColor !== null) {
        themeMeta.setAttribute("content", prevThemeColor);
      } else {
        themeMeta.setAttribute("content", "#0c0e12");
      }
    }
  };
}

export function applyBlogPostRouteSeo(
  doc: Document,
  origin: string,
  post: BlogPost,
): () => void {
  const title = `${post.title} | 3D Box Studio`;
  doc.title = title;
  setMeta(doc, "description", post.description);
  setMeta(doc, "keywords", post.keywords.join(", "));
  const themeMeta = doc.querySelector('meta[name="theme-color"]');
  const prevThemeColor = themeMeta?.getAttribute("content") ?? null;
  if (themeMeta) {
    themeMeta.setAttribute("content", "#e8edf4");
    themeMeta.setAttribute("data-landing-theme", "1");
  }
  if (origin) {
    const url = `${origin}/blog/${post.slug}`;
    applySocialMeta(doc, {
      title,
      description: post.description,
      url,
      type: "article",
      imageUrl: getLandingOgImageUrl(origin),
      imageAlt: LANDING_OG_IMAGE_ALT,
      imageWidth: LANDING_OG_IMAGE_WIDTH,
      imageHeight: LANDING_OG_IMAGE_HEIGHT,
      imageType: LANDING_OG_IMAGE_TYPE,
    });
    setCanonical(doc, url);
  }
  setJsonLd(doc, buildBlogPostJsonLd(origin, post));
  return () => {
    cleanupRouteSeo(doc);
    if (themeMeta?.hasAttribute("data-landing-theme")) {
      themeMeta.removeAttribute("data-landing-theme");
      if (prevThemeColor !== null) {
        themeMeta.setAttribute("content", prevThemeColor);
      } else {
        themeMeta.setAttribute("content", "#0c0e12");
      }
    }
  };
}

export function buildBlogIndexHeadHtml(origin: string): string {
  const tags = [
    `<title>${escapeHtml(BLOG_INDEX_TITLE)}</title>`,
    `<meta name="description" content="${escapeHtml(BLOG_INDEX_DESCRIPTION)}" />`,
    `<meta name="theme-color" content="#e8edf4" />`,
  ];
  if (origin) {
    const url = `${origin}/blog`;
    tags.push(
      ...buildSocialMetaTags({
        title: BLOG_INDEX_TITLE,
        description: BLOG_INDEX_DESCRIPTION,
        url,
        imageUrl: getLandingOgImageUrl(origin),
        imageAlt: LANDING_OG_IMAGE_ALT,
        imageWidth: LANDING_OG_IMAGE_WIDTH,
        imageHeight: LANDING_OG_IMAGE_HEIGHT,
        imageType: LANDING_OG_IMAGE_TYPE,
      }),
      `<link rel="canonical" href="${escapeHtml(url)}" />`,
    );
  }
  tags.push(
    `<script type="application/ld+json" data-route-seo="1">${JSON.stringify(buildBlogIndexJsonLd(origin))}</script>`,
  );
  return tags.join("\n    ");
}

export function buildBlogPostHeadHtml(origin: string, post: BlogPost): string {
  const title = `${post.title} | 3D Box Studio`;
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(post.description)}" />`,
    `<meta name="keywords" content="${escapeHtml(post.keywords.join(", "))}" />`,
    `<meta name="theme-color" content="#e8edf4" />`,
  ];
  if (origin) {
    const url = `${origin}/blog/${post.slug}`;
    tags.push(
      ...buildSocialMetaTags({
        title,
        description: post.description,
        url,
        type: "article",
        imageUrl: getLandingOgImageUrl(origin),
        imageAlt: LANDING_OG_IMAGE_ALT,
        imageWidth: LANDING_OG_IMAGE_WIDTH,
        imageHeight: LANDING_OG_IMAGE_HEIGHT,
        imageType: LANDING_OG_IMAGE_TYPE,
      }),
      `<link rel="canonical" href="${escapeHtml(url)}" />`,
    );
  }
  tags.push(
    `<script type="application/ld+json" data-route-seo="1">${JSON.stringify(buildBlogPostJsonLd(origin, post))}</script>`,
  );
  return tags.join("\n    ");
}
