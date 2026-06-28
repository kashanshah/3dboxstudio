import { FAQ_ITEMS, FAQ_PAGE_DESCRIPTION, FAQ_PAGE_TITLE } from "../content/faq";
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

export function buildFaqJsonLd(_origin: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function applyFaqRouteSeo(doc: Document, origin: string): () => void {
  doc.title = FAQ_PAGE_TITLE;
  setMeta(doc, "description", FAQ_PAGE_DESCRIPTION);
  const themeMeta = doc.querySelector('meta[name="theme-color"]');
  const prevThemeColor = themeMeta?.getAttribute("content") ?? null;
  if (themeMeta) {
    themeMeta.setAttribute("content", "#e8edf4");
    themeMeta.setAttribute("data-landing-theme", "1");
  }
  if (origin) {
    const url = `${origin}/faq`;
    const imageUrl = getLandingOgImageUrl(origin);
    applySocialMeta(doc, {
      title: FAQ_PAGE_TITLE,
      description: FAQ_PAGE_DESCRIPTION,
      url,
      imageUrl,
      imageAlt: LANDING_OG_IMAGE_ALT,
      imageWidth: LANDING_OG_IMAGE_WIDTH,
      imageHeight: LANDING_OG_IMAGE_HEIGHT,
      imageType: LANDING_OG_IMAGE_TYPE,
    });
    setCanonical(doc, url);
  }
  setJsonLd(doc, buildFaqJsonLd(origin));
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

export function buildFaqHeadHtml(origin: string): string {
  const tags = [
    `<title>${escapeHtml(FAQ_PAGE_TITLE)}</title>`,
    `<meta name="description" content="${escapeHtml(FAQ_PAGE_DESCRIPTION)}" />`,
    `<meta name="theme-color" content="#e8edf4" />`,
  ];
  if (origin) {
    const url = `${origin}/faq`;
    const imageUrl = getLandingOgImageUrl(origin);
    tags.push(
      ...buildSocialMetaTags({
        title: FAQ_PAGE_TITLE,
        description: FAQ_PAGE_DESCRIPTION,
        url,
        imageUrl,
        imageAlt: LANDING_OG_IMAGE_ALT,
        imageWidth: LANDING_OG_IMAGE_WIDTH,
        imageHeight: LANDING_OG_IMAGE_HEIGHT,
        imageType: LANDING_OG_IMAGE_TYPE,
      }),
      `<link rel="canonical" href="${escapeHtml(url)}" />`,
    );
  }
  tags.push(
    `<script type="application/ld+json" data-route-seo="1">${JSON.stringify(buildFaqJsonLd(origin))}</script>`,
  );
  return tags.join("\n    ");
}
