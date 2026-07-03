const SHARE_ID_RE = /^[0-9A-Za-z]{10,24}$/;

/** Extract a share id from a bare id or full studio URL. */
export function parseShareIdFromInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (SHARE_ID_RE.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    const fromQuery = url.searchParams.get("share");
    if (fromQuery && SHARE_ID_RE.test(fromQuery)) return fromQuery;
    const parts = url.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && SHARE_ID_RE.test(last)) return last;
  } catch {
    /* not a URL */
  }

  return null;
}

export function studioSharePath(id: string): string {
  return `/studio?share=${encodeURIComponent(id)}`;
}
