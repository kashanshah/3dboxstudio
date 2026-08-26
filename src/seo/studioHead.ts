import {
  applySocialMeta,
  buildSocialMetaTags,
  cleanupRouteSeo,
  escapeHtml,
  setCanonical,
  setMeta,
} from "./metaUtils";
import {
  getLandingOgImageUrl,
  LANDING_OG_IMAGE_ALT,
  LANDING_OG_IMAGE_HEIGHT,
  LANDING_OG_IMAGE_TYPE,
  LANDING_OG_IMAGE_WIDTH,
} from "./landingHead";
import { SITE_KEYWORDS_META } from "./siteKeywords";

export const STUDIO_TITLE =
  "Free 3D Box Maker Online — Design Cartons & Mailers | 3D Box Studio";

export const STUDIO_DESCRIPTION =
  "Open the free 3D box maker studio in your browser. Set custom dimensions, packaging materials, lid and flap openings, and per-face artwork. Save to the cloud, share view-only client previews, and export PNG mockups or JSON backups—no signup required.";

export const STUDIO_KEYWORDS = SITE_KEYWORDS_META;

export function applyStudioRouteSeo(doc: Document, origin?: string): () => void {
  doc.title = STUDIO_TITLE;
  setMeta(doc, "description", STUDIO_DESCRIPTION);
  setMeta(doc, "keywords", STUDIO_KEYWORDS);
  if (origin) {
    const url = `${origin}/studio`;
    applySocialMeta(doc, {
      title: STUDIO_TITLE,
      description: STUDIO_DESCRIPTION,
      url,
      imageUrl: getLandingOgImageUrl(origin),
      imageAlt: LANDING_OG_IMAGE_ALT,
      imageWidth: LANDING_OG_IMAGE_WIDTH,
      imageHeight: LANDING_OG_IMAGE_HEIGHT,
      imageType: LANDING_OG_IMAGE_TYPE,
    });
    setCanonical(doc, url);
  }
  return () => {
    cleanupRouteSeo(doc);
  };
}

export function buildStudioHeadHtml(origin: string): string {
  const tags = [
    `<title>${escapeHtml(STUDIO_TITLE)}</title>`,
    `<meta name="description" content="${escapeHtml(STUDIO_DESCRIPTION)}" />`,
    `<meta name="keywords" content="${escapeHtml(STUDIO_KEYWORDS)}" />`,
    `<meta name="theme-color" content="#0c0e12" />`,
  ];
  if (origin) {
    const url = `${origin}/studio`;
    tags.push(
      ...buildSocialMetaTags({
        title: STUDIO_TITLE,
        description: STUDIO_DESCRIPTION,
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
  return tags.join("\n    ");
}
