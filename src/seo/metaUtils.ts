export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function setMeta(
  doc: Document,
  name: string,
  content: string,
  attr: "name" | "property" = "name",
): void {
  let el = doc.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = doc.createElement("meta");
    el.setAttribute(attr, name);
    doc.head.appendChild(el);
  }
  el.setAttribute("content", content);
  el.setAttribute("data-route-seo", "1");
}

export function setCanonical(doc: Document, href: string): void {
  let link = doc.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = doc.createElement("link");
    link.rel = "canonical";
    doc.head.appendChild(link);
  }
  link.href = href;
  link.setAttribute("data-route-seo", "1");
}

export function setJsonLd(doc: Document, data: unknown): void {
  const jsonLd = JSON.stringify(data);
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
}

export function cleanupRouteSeo(doc: Document): void {
  doc.querySelectorAll("[data-route-seo]").forEach((node) => node.remove());
}

type SocialMetaOptions = {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageType?: string;
  type?: string;
};

export function buildSocialMetaTags(options: SocialMetaOptions): string[] {
  const tags = [
    `<meta property="og:title" content="${escapeHtml(options.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(options.description)}" />`,
    `<meta property="og:type" content="${options.type ?? "website"}" />`,
    `<meta property="og:url" content="${escapeHtml(options.url)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(options.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(options.description)}" />`,
  ];
  if (options.imageUrl) {
    tags.push(
      `<meta property="og:image" content="${escapeHtml(options.imageUrl)}" />`,
      `<meta property="og:image:secure_url" content="${escapeHtml(options.imageUrl)}" />`,
      `<meta name="twitter:image" content="${escapeHtml(options.imageUrl)}" />`,
    );
    if (options.imageType) {
      tags.push(
        `<meta property="og:image:type" content="${options.imageType}" />`,
      );
    }
    if (options.imageWidth) {
      tags.push(
        `<meta property="og:image:width" content="${options.imageWidth}" />`,
      );
    }
    if (options.imageHeight) {
      tags.push(
        `<meta property="og:image:height" content="${options.imageHeight}" />`,
      );
    }
    if (options.imageAlt) {
      tags.push(
        `<meta property="og:image:alt" content="${escapeHtml(options.imageAlt)}" />`,
      );
    }
  }
  return tags;
}

export function applySocialMeta(doc: Document, options: SocialMetaOptions): void {
  setMeta(doc, "og:title", options.title, "property");
  setMeta(doc, "og:description", options.description, "property");
  setMeta(doc, "og:type", options.type ?? "website", "property");
  setMeta(doc, "og:url", options.url, "property");
  setMeta(doc, "twitter:card", "summary_large_image");
  setMeta(doc, "twitter:title", options.title);
  setMeta(doc, "twitter:description", options.description);
  if (options.imageUrl) {
    setMeta(doc, "og:image", options.imageUrl, "property");
    setMeta(doc, "og:image:secure_url", options.imageUrl, "property");
    setMeta(doc, "twitter:image", options.imageUrl);
    if (options.imageType) {
      setMeta(doc, "og:image:type", options.imageType, "property");
    }
    if (options.imageWidth) {
      setMeta(doc, "og:image:width", String(options.imageWidth), "property");
    }
    if (options.imageHeight) {
      setMeta(doc, "og:image:height", String(options.imageHeight), "property");
    }
    if (options.imageAlt) {
      setMeta(doc, "og:image:alt", options.imageAlt, "property");
    }
  }
}
