/** Where a visitor first landed — used for signup conversion reporting. */
export type LandingType =
  | "home"
  | "blog_index"
  | "blog_post"
  | "studio"
  | "faq"
  | "contact"
  | "preview"
  | "legal"
  | "other";

export type LandingClassification = {
  type: LandingType;
  label: string;
  blogSlug: string | null;
};

const LANDING_TYPE_LABELS: Record<LandingType, string> = {
  home: "Homepage",
  blog_index: "Blog index",
  blog_post: "Blog article",
  studio: "Studio",
  faq: "FAQ",
  contact: "Contact",
  preview: "Shared preview",
  legal: "Legal page",
  other: "Other page",
};

export function landingTypeLabel(type: LandingType | string | null | undefined): string {
  if (!type) return "Unknown";
  return LANDING_TYPE_LABELS[type as LandingType] ?? type;
}

/** Classify a site path into a conversion surface (first-touch landing or signup page). */
export function classifyLandingPath(pathname: string): LandingClassification {
  const path = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/";

  if (path === "/") {
    return { type: "home", label: LANDING_TYPE_LABELS.home, blogSlug: null };
  }
  if (path === "/blog") {
    return { type: "blog_index", label: LANDING_TYPE_LABELS.blog_index, blogSlug: null };
  }
  if (path.startsWith("/blog/")) {
    const slug = path.slice("/blog/".length).split("/")[0]?.trim() || null;
    return {
      type: "blog_post",
      label: slug ? `Blog: ${slug}` : LANDING_TYPE_LABELS.blog_post,
      blogSlug: slug,
    };
  }
  if (path === "/studio" || path.startsWith("/studio/")) {
    return { type: "studio", label: LANDING_TYPE_LABELS.studio, blogSlug: null };
  }
  if (path === "/faq") {
    return { type: "faq", label: LANDING_TYPE_LABELS.faq, blogSlug: null };
  }
  if (path === "/contact") {
    return { type: "contact", label: LANDING_TYPE_LABELS.contact, blogSlug: null };
  }
  if (path.startsWith("/preview/")) {
    return { type: "preview", label: LANDING_TYPE_LABELS.preview, blogSlug: null };
  }
  if (path === "/privacy" || path === "/terms") {
    return { type: "legal", label: LANDING_TYPE_LABELS.legal, blogSlug: null };
  }

  return { type: "other", label: path, blogSlug: null };
}

/** Enrich attribution with landing classification derived from the path. */
export function enrichLandingAttribution<T extends { landingPage: string | null }>(
  data: T & {
    landingType?: string | null;
    landingLabel?: string | null;
    blogSlug?: string | null;
  }
): T & {
  landingType: LandingType | null;
  landingLabel: string | null;
  blogSlug: string | null;
} {
  if (!data.landingPage) {
    return { ...data, landingType: null, landingLabel: null, blogSlug: null };
  }

  const classified = classifyLandingPath(data.landingPage);
  return {
    ...data,
    landingType: (data.landingType as LandingType | null) ?? classified.type,
    landingLabel: data.landingLabel ?? classified.label,
    blogSlug: data.blogSlug ?? classified.blogSlug,
  };
}

export function formatLandingSummary(
  landingType: string | null,
  landingPage: string | null,
  landingLabel: string | null
): string {
  if (landingLabel) return landingLabel;
  if (landingType) return landingTypeLabel(landingType);
  if (landingPage) return landingPage;
  return "Unknown";
}

/** Normalize a stored landing path for display (strip query string and trailing slash). */
export function normalizeLandingPath(pathname: string): string {
  return (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/";
}

/** Format stored signup landing fields for admin tables (shows pathname for blog posts). */
export function formatStoredLandingDisplay(
  landingType: string | null,
  landingPage: string | null
): string {
  if (!landingPage && !landingType) return "Unknown";

  if (landingPage) {
    const path = normalizeLandingPath(landingPage);
    const type = (landingType as LandingType | null) ?? classifyLandingPath(landingPage).type;
    if (type === "blog_post") return path;
    const { label } = classifyLandingPath(landingPage);
    return formatLandingSummary(landingType, landingPage, label);
  }

  return formatLandingSummary(landingType, landingPage, null);
}
