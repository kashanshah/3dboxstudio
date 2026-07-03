export const SHARE_TOKEN_RE = /^[0-9A-Za-z]{10,24}$/;

/** Extract an editor share id from a bare id or full studio URL. */
export function parseShareIdFromInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (SHARE_TOKEN_RE.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    const fromQuery = url.searchParams.get("share");
    if (fromQuery && SHARE_TOKEN_RE.test(fromQuery)) return fromQuery;
    const parts = url.pathname.split("/").filter(Boolean);
    const studioIdx = parts.indexOf("studio");
    if (studioIdx !== -1) {
      const segment = parts[studioIdx + 1];
      if (segment && SHARE_TOKEN_RE.test(segment)) return segment;
    }
    const last = parts[parts.length - 1];
    if (last && SHARE_TOKEN_RE.test(last)) return last;
  } catch {
    /* not a URL */
  }

  return null;
}

/** Extract a view-only preview token from a bare token or full preview studio URL. */
export function parsePreviewTokenFromInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (SHARE_TOKEN_RE.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    const fromQuery = url.searchParams.get("preview");
    if (fromQuery && SHARE_TOKEN_RE.test(fromQuery)) return fromQuery;
    const parts = url.pathname.split("/").filter(Boolean);
    const previewIdx = parts.indexOf("preview");
    if (previewIdx !== -1) {
      const segment = parts[previewIdx + 1];
      if (segment && SHARE_TOKEN_RE.test(segment)) return segment;
    }
  } catch {
    /* not a URL */
  }

  return null;
}

export function isShareToken(value: string | null | undefined): boolean {
  return Boolean(value && SHARE_TOKEN_RE.test(value));
}

export function studioSharePath(id: string): string {
  return `/studio/${encodeURIComponent(id)}`;
}

export function studioPreviewPath(previewToken: string): string {
  return `/preview/${encodeURIComponent(previewToken)}`;
}

export function studioShareUrl(id: string, origin?: string): string {
  const path = studioSharePath(id);
  const resolvedOrigin = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  if (!resolvedOrigin) return path;
  return `${resolvedOrigin.replace(/\/$/, "")}${path}`;
}

export function studioPreviewUrl(previewToken: string, origin?: string): string {
  const path = studioPreviewPath(previewToken);
  const resolvedOrigin = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  if (!resolvedOrigin) return path;
  return `${resolvedOrigin.replace(/\/$/, "")}${path}`;
}

export function studioEditorPath(id: string): string {
  return studioSharePath(id);
}

export function studioEditorUrl(id: string, origin?: string): string {
  return studioShareUrl(id, origin);
}

export function shareOgImageApiPath(shareId: string): string {
  return `/api/shares/${encodeURIComponent(shareId)}/og-image`;
}

export function previewOgImageApiPath(previewToken: string): string {
  return `/api/shares/preview/${encodeURIComponent(previewToken)}/og-image`;
}
