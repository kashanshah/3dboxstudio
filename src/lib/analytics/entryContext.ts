import type { CtaLocation, SourcePageType, StudioCtaContext, StudioEntryContext, StudioEntryPoint } from "./types";
import { pathnameToEntryPoint, slugFromPath } from "./mappers";

const ENTRY_KEY = "sb_studio_entry";
const LAST_PAGE_KEY = "sb_last_page_context";

type LastPageContext = {
  path: string;
  sourcePageType: SourcePageType;
  pageSlug: string | null;
};

export function storeLastPageContext(path: string, sourcePageType: SourcePageType, pageSlug: string | null): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      LAST_PAGE_KEY,
      JSON.stringify({ path, sourcePageType, pageSlug } satisfies LastPageContext)
    );
  } catch {
    /* ignore */
  }
}

export function storeStudioCtaContext(context: StudioCtaContext): void {
  if (typeof window === "undefined") return;
  const entry: StudioEntryContext = {
    entryPoint: mapSourceToEntryPoint(context.sourcePageType),
    sourcePageType: context.sourcePageType,
    pagePath: context.pagePath,
    pageSlug: context.pageSlug ?? null,
    ctaLocation: context.ctaLocation,
  };
  try {
    sessionStorage.setItem(ENTRY_KEY, JSON.stringify(entry));
  } catch {
    /* ignore */
  }
}

function mapSourceToEntryPoint(source: SourcePageType): StudioEntryPoint {
  switch (source) {
    case "homepage":
      return "homepage";
    case "blog":
      return "blog";
    case "guide":
      return "guide";
    case "template":
      return "template_page";
    case "landing_page":
      return "other";
    default:
      return "other";
  }
}

function readLastPageContext(): LastPageContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LAST_PAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LastPageContext;
  } catch {
    return null;
  }
}

export function consumeStudioEntryContext(): StudioEntryContext {
  if (typeof window === "undefined") {
    return { entryPoint: "direct" };
  }

  try {
    const raw = sessionStorage.getItem(ENTRY_KEY);
    if (raw) {
      sessionStorage.removeItem(ENTRY_KEY);
      const parsed = JSON.parse(raw) as StudioEntryContext;
      if (parsed.entryPoint) return parsed;
    }
  } catch {
    /* ignore */
  }

  const referrer = document.referrer;
  if (!referrer) {
    return { entryPoint: "direct" };
  }

  try {
    const refUrl = new URL(referrer);
    if (refUrl.origin !== window.location.origin) {
      return { entryPoint: "other", pagePath: refUrl.pathname };
    }
    const last = readLastPageContext();
    if (last) {
      return {
        entryPoint: pathnameToEntryPoint(last.path),
        sourcePageType: last.sourcePageType,
        pagePath: last.path,
        pageSlug: last.pageSlug,
      };
    }
    return {
      entryPoint: pathnameToEntryPoint(refUrl.pathname),
      pagePath: refUrl.pathname,
      pageSlug: slugFromPath(refUrl.pathname),
    };
  } catch {
    return { entryPoint: "other" };
  }
}

export function buildCtaContextFromPath(
  pathname: string,
  ctaLocation: CtaLocation,
  destination = "/studio"
): StudioCtaContext {
  const path = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  return {
    sourcePageType: path === "/" ? "homepage" : path.startsWith("/blog/") ? "guide" : path === "/blog" ? "blog" : "landing_page",
    pagePath: path,
    pageSlug: slugFromPath(path),
    ctaLocation,
    destination,
  };
}
