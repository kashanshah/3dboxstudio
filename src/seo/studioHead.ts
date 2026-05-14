export const STUDIO_TITLE = "Studio — Free packaging box designer | 3D Box Studio";

export const STUDIO_DESCRIPTION =
  "Free packaging box designer (3D Box Studio): dimensions, materials, openings, per-face artwork, lighting, PNG export, local save. Open source (MIT).";

function setMeta(doc: Document, name: string, content: string) {
  let el = doc.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = doc.createElement("meta");
    el.setAttribute("name", name);
    doc.head.appendChild(el);
  }
  el.setAttribute("content", content);
  el.setAttribute("data-route-seo", "1");
}

export function applyStudioRouteSeo(doc: Document): () => void {
  doc.title = STUDIO_TITLE;
  setMeta(doc, "description", STUDIO_DESCRIPTION);
  return () => {
    doc.querySelectorAll("[data-route-seo]").forEach((node) => node.remove());
  };
}

export function buildStudioHeadHtml(origin: string): string {
  const tags = [
    `<title>${escapeHtml(STUDIO_TITLE)}</title>`,
    `<meta name="description" content="${escapeHtml(STUDIO_DESCRIPTION)}" />`,
    `<meta name="theme-color" content="#0c0e12" />`,
  ];
  if (origin) {
    tags.push(`<link rel="canonical" href="${escapeHtml(`${origin}/studio`)}" />`);
  }
  return tags.join("\n    ");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
