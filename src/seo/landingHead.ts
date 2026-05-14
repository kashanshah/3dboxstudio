export const LANDING_TITLE =
  "Free packaging box designer — 3D Box Studio | 3dboxstudio.com";

export const LANDING_DESCRIPTION =
  "Free packaging box designer & 3D carton preview in your browser (3dboxstudio.com, 3D Box Studio). PBR materials, openings, per-face artwork, HDRI lighting, PNG & JSON export—no signup, saves locally. Open source (MIT).";

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
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is a 3D box designer or packaging simulator?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A 3D box designer lets you preview how flat packaging artwork and structural choices look on a three-dimensional carton or mailer. A packaging simulator applies realistic lighting and materials so stakeholders can review proportions, openings, and branding before print.",
            },
          },
          {
            "@type": "Question",
            name: "Is this 3D box simulator free?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. The studio runs in your browser with no paywall for the core preview: dimensions, materials, openings, per-face images, lighting, PNG export, and JSON import/export for portable backups. Designs can be saved locally in your browser.",
            },
          },
          {
            "@type": "Question",
            name: "Is this a substitute for Esko, ArtiosCAD, or dedicated packaging CAD?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Those platforms engineer production die-lines. This 3D packaging simulator helps you communicate look and feel, camera angles, and rough scale early. Export is a viewport PNG, not a print plate.",
            },
          },
          {
            "@type": "Question",
            name: "Does the 3D box simulator work on mobile?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The studio is built for desktop browsers with WebGL. Phones may run it, but the control density is optimized for keyboard and mouse users.",
            },
          },
          {
            "@type": "Question",
            name: "Where is my data stored?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Optional local browser storage keeps your fields and encoded images on-device. There is no account-backed cloud sync in this open tool.",
            },
          },
          {
            "@type": "Question",
            name: "Will on-screen colors match my print run?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Screen previews are RGB and depend on your display calibration. This tool is for structural and graphic composition—not ink drawdowns or press proofs. Always validate color with your printer's proofing process.",
            },
          },
          {
            "@type": "Question",
            name: "Can I export or import my 3D box design as JSON?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. In the studio you can download a v1 JSON file that contains dimensions, materials, openings, viewport options, per-face rotations, and images as base64. Import that file on another machine or browser to restore the same preview. This is separate from automatic localStorage save.",
            },
          },
          {
            "@type": "Question",
            name: "How do I use my own marketing screenshots?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Export PNGs from the studio, then replace files under public/landing/ or update image paths in the landing page component for marketing and SEO-rich visuals.",
            },
          },
        ],
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

export function applyLandingRouteSeo(doc: Document, origin: string): () => void {
  doc.title = LANDING_TITLE;
  setMeta(doc, "description", LANDING_DESCRIPTION);
  const themeMeta = doc.querySelector('meta[name="theme-color"]');
  const prevThemeColor = themeMeta?.getAttribute("content") ?? null;
  if (themeMeta) {
    themeMeta.setAttribute("content", "#e8edf4");
    themeMeta.setAttribute("data-landing-theme", "1");
  }
  if (origin) {
    setMeta(doc, "og:title", doc.title, "property");
    setMeta(doc, "og:description", LANDING_DESCRIPTION, "property");
    setMeta(doc, "og:type", "website", "property");
    setMeta(doc, "og:url", `${origin}/`, "property");
    setMeta(doc, "og:image", `${origin}/landing/og-preview.svg`, "property");
    setMeta(doc, "twitter:card", "summary_large_image");
    setMeta(doc, "twitter:title", doc.title);
    setMeta(doc, "twitter:description", LANDING_DESCRIPTION);
    setMeta(doc, "twitter:image", `${origin}/landing/og-preview.svg`);
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

export function buildLandingHeadHtml(origin: string): string {
  const tags = [
    `<title>${escapeHtml(LANDING_TITLE)}</title>`,
    `<meta name="description" content="${escapeHtml(LANDING_DESCRIPTION)}" />`,
    `<meta name="theme-color" content="#e8edf4" />`,
  ];
  if (origin) {
    tags.push(
      `<meta property="og:title" content="${escapeHtml(LANDING_TITLE)}" />`,
      `<meta property="og:description" content="${escapeHtml(LANDING_DESCRIPTION)}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:url" content="${escapeHtml(`${origin}/`)}" />`,
      `<meta property="og:image" content="${escapeHtml(`${origin}/landing/og-preview.svg`)}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${escapeHtml(LANDING_TITLE)}" />`,
      `<meta name="twitter:description" content="${escapeHtml(LANDING_DESCRIPTION)}" />`,
      `<meta name="twitter:image" content="${escapeHtml(`${origin}/landing/og-preview.svg`)}" />`,
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
