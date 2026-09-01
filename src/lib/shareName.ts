const MAX_SHARE_NAME_LENGTH = 120;

/** Default name for cloud projects created via auto-save (Google Docs–style). */
export const DEFAULT_UNTITLED_SHARE_NAME = "Untitled";

export function normalizeShareName(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const trimmed = raw.trim().replace(/\s+/g, " ").slice(0, MAX_SHARE_NAME_LENGTH);
  return trimmed.length > 0 ? trimmed : null;
}

export function shareNameError(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_SHARE_NAME_LENGTH) {
    return `Name must be ${MAX_SHARE_NAME_LENGTH} characters or fewer.`;
  }
  return null;
}

export function displayShareLabel(name: string | null | undefined, _shareId: string | null): string {
  if (name) return name;
  return DEFAULT_UNTITLED_SHARE_NAME;
}
