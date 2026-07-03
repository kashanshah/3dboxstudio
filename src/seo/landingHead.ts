import { FAQ_ITEMS } from "../content/faq";

export const LANDING_TITLE =
  "3D Box Studio — Free 3D Box Designer, Maker & Simulator | 3dboxstudio.com";

export const LANDING_DESCRIPTION =
  "Free 3D box designer, box maker, and packaging simulator in your browser. Design folding cartons and mailers with PBR materials, lid and flap openings, per-face artwork, HDRI lighting, cloud save & share links, PNG and JSON export—no signup. Open source (MIT).";

export const LANDING_OG_IMAGE_PATH = "/images/featured-image.jpg";
export const LANDING_OG_IMAGE_WIDTH = 1402;
export const LANDING_OG_IMAGE_HEIGHT = 1122;
export const LANDING_OG_IMAGE_ALT =
  "Stylized 3D packaging box with studio lighting—representative of the interactive simulator";
export const LANDING_OG_IMAGE_TYPE = "image/jpeg";

type LandingHeadOptions = {
  ogImageVersion?: string;
  updatedTime?: string;
  facebookAppId?: string;
};

function resolveFacebookAppId(appId?: string): string | undefined {
  const value = appId ?? process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function resolveOgImageVersion(version?: string): string {
  if (version?.trim()) return version.trim();
  return process.env.NEXT_PUBLIC_OG_IMAGE_VERSION?.trim() || "1";
}

export function getLandingOgImageUrl(origin: string, version?: string): string {
  const url = new URL(LANDING_OG_IMAGE_PATH, `${origin.replace(/\/$/, "")}/`);
  url.searchParams.set("v", resolveOgImageVersion(version));
  return url.toString();
}

function applyLandingSocialMeta(
  doc: Document,
  origin: string,
  options?: LandingHeadOptions,
): void {
  const imageUrl = getLandingOgImageUrl(origin, options?.ogImageVersion);
  setMeta(doc, "og:title", doc.title, "property");
  setMeta(doc, "og:description", LANDING_DESCRIPTION, "property");
  setMeta(doc, "og:type", "website", "property");
  setMeta(doc, "og:url", `${origin}/`, "property");
  setMeta(doc, "og:image", imageUrl, "property");
  setMeta(doc, "og:image:secure_url", imageUrl, "property");
  setMeta(doc, "og:image:type", LANDING_OG_IMAGE_TYPE, "property");
  setMeta(doc, "og:image:width", String(LANDING_OG_IMAGE_WIDTH), "property");
  setMeta(doc, "og:image:height", String(LANDING_OG_IMAGE_HEIGHT), "property");
  setMeta(doc, "og:image:alt", LANDING_OG_IMAGE_ALT, "property");
  if (options?.updatedTime) {
    setMeta(doc, "og:updated_time", options.updatedTime, "property");
  }
  const facebookAppId = resolveFacebookAppId(options?.facebookAppId);
  if (facebookAppId) {
    setMeta(doc, "fb:app_id", facebookAppId, "property");
  }
  setMeta(doc, "twitter:card", "summary_large_image");
  setMeta(doc, "twitter:title", doc.title);
  setMeta(doc, "twitter:description", LANDING_DESCRIPTION);
  setMeta(doc, "twitter:image", imageUrl);
}

export function buildLandingJsonLd(origin: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "3D Box Studio",
        description: LANDING_DESCRIPTION,
        url: origin ? `${origin}/` : "/",
      },
      {
        "@type": "WebApplication",
        name: "3D Box Studio",
        applicationCategory: "DesignApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript. WebGL recommended.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        description: LANDING_DESCRIPTION,
        url: origin ? `${origin}/studio` : "/studio",
      },
      {
        "@type": "Organization",
        name: "3D Box Studio",
        url: origin ? `${origin}/` : "/",
        description: LANDING_DESCRIPTION,
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ_ITEMS.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };
}

function setMeta(
  doc: Document,
  name: string,
  content: string,
  attr: "name" | "property" = "name",
) {
  let el = doc.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = doc.createElement("meta");
    el.setAttribute(attr, name);
    doc.head.appendChild(el);
  }
  el.setAttribute("content", content);
  el.setAttribute("data-route-seo", "1");
}

export function applyLandingRouteSeo(
  doc: Document,
  origin: string,
  options?: LandingHeadOptions,
): () => void {
  doc.title = LANDING_TITLE;
  setMeta(doc, "description", LANDING_DESCRIPTION);
  const themeMeta = doc.querySelector('meta[name="theme-color"]');
  const prevThemeColor = themeMeta?.getAttribute("content") ?? null;
  if (themeMeta) {
    themeMeta.setAttribute("content", "#e8edf4");
    themeMeta.setAttribute("data-landing-theme", "1");
  }
  if (origin) {
    applyLandingSocialMeta(doc, origin, options);
    let link = doc.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = doc.createElement("link");
      link.rel = "canonical";
      doc.head.appendChild(link);
    }
    link.href = `${origin}/`;
    link.setAttribute("data-route-seo", "1");
  }

  const jsonLd = JSON.stringify(buildLandingJsonLd(origin));
  const jsonLdScripts = doc.querySelectorAll<HTMLScriptElement>(
    'script[type="application/ld+json"]',
  );
  const script = jsonLdScripts[0] ?? doc.createElement("script");
  script.type = "application/ld+json";
  script.setAttribute("data-route-seo", "1");
  script.textContent = jsonLd;
  if (!script.isConnected) {
    doc.head.appendChild(script);
  }
  for (let i = 1; i < jsonLdScripts.length; i += 1) {
    jsonLdScripts[i].remove();
  }

  return () => {
    doc.querySelectorAll("[data-route-seo]").forEach((node) => node.remove());
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

export function buildLandingHeadHtml(origin: string, options?: LandingHeadOptions): string {
  const tags = [
    `<title>${escapeHtml(LANDING_TITLE)}</title>`,
    `<meta name="description" content="${escapeHtml(LANDING_DESCRIPTION)}" />`,
    `<meta name="theme-color" content="#e8edf4" />`,
  ];
  if (origin) {
    const imageUrl = escapeHtml(getLandingOgImageUrl(origin, options?.ogImageVersion));
    tags.push(
      `<link rel="preload" as="image" href="${escapeHtml(`${origin}/images/hero-img.webp`)}" fetchpriority="high" />`,
      `<meta property="og:title" content="${escapeHtml(LANDING_TITLE)}" />`,
      `<meta property="og:description" content="${escapeHtml(LANDING_DESCRIPTION)}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:url" content="${escapeHtml(`${origin}/`)}" />`,
      `<meta property="og:image" content="${imageUrl}" />`,
      `<meta property="og:image:secure_url" content="${imageUrl}" />`,
      `<meta property="og:image:type" content="${LANDING_OG_IMAGE_TYPE}" />`,
      `<meta property="og:image:width" content="${LANDING_OG_IMAGE_WIDTH}" />`,
      `<meta property="og:image:height" content="${LANDING_OG_IMAGE_HEIGHT}" />`,
      `<meta property="og:image:alt" content="${escapeHtml(LANDING_OG_IMAGE_ALT)}" />`,
    );
    if (options?.updatedTime) {
      tags.push(
        `<meta property="og:updated_time" content="${escapeHtml(options.updatedTime)}" />`,
      );
    }
    const facebookAppId = resolveFacebookAppId(options?.facebookAppId);
    if (facebookAppId) {
      tags.push(`<meta property="fb:app_id" content="${escapeHtml(facebookAppId)}" />`);
    }
    tags.push(
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${escapeHtml(LANDING_TITLE)}" />`,
      `<meta name="twitter:description" content="${escapeHtml(LANDING_DESCRIPTION)}" />`,
      `<meta name="twitter:image" content="${imageUrl}" />`,
      `<link rel="canonical" href="${escapeHtml(`${origin}/`)}" />`,
    );
  }
  tags.push(
    `<script type="application/ld+json" data-route-seo="1">${JSON.stringify(buildLandingJsonLd(origin))}</script>`,
  );
  return tags.join("\n    ");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
