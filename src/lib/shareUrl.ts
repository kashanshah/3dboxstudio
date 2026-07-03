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
  } catch {
    /* not a URL */
  }

  return null;
}

export function isShareToken(value: string | null | undefined): boolean {
  return Boolean(value && SHARE_TOKEN_RE.test(value));
}

export function studioSharePath(id: string): string {
  return `/studio?share=${encodeURIComponent(id)}`;
}

export function studioPreviewPath(previewToken: string): string {
  return `/studio?preview=${encodeURIComponent(previewToken)}`;
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
