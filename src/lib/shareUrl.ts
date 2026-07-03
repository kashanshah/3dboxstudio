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

export function isViewOnlyParam(value: string | null | undefined): boolean {
  return value === "1" || value === "true";
}

export function studioSharePath(id: string, options?: { view?: boolean }): string {
  const base = `/studio?share=${encodeURIComponent(id)}`;
  return options?.view ? `${base}&view=1` : base;
}

export function studioShareUrl(id: string, options?: { view?: boolean; origin?: string }): string {
  const path = studioSharePath(id, options);
  const origin = options?.origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  if (!origin) return path;
  return `${origin.replace(/\/$/, "")}${path}`;
}

export function studioEditorPath(id: string): string {
  return studioSharePath(id);
}

export function studioEditorUrl(id: string, origin?: string): string {
  return studioShareUrl(id, { origin });
}

export function studioPreviewPath(id: string): string {
  return studioSharePath(id, { view: true });
}

export function studioPreviewUrl(id: string, origin?: string): string {
  return studioShareUrl(id, { view: true, origin });
}
