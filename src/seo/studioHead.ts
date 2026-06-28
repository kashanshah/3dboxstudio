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

export const STUDIO_TITLE =
  "3D Box Maker Studio — Free Online Box Designer | 3D Box Studio";

export const STUDIO_DESCRIPTION =
  "Free 3D box maker and design studio in your browser. Set dimensions, materials, openings, and per-face artwork; export PNG snapshots and JSON backups. No signup—open source (MIT).";

export function applyStudioRouteSeo(doc: Document, origin?: string): () => void {
  doc.title = STUDIO_TITLE;
  setMeta(doc, "description", STUDIO_DESCRIPTION);
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
