const MAX_SHARE_NAME_LENGTH = 120;

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

export function displayShareLabel(name: string | null | undefined, shareId: string | null): string {
  if (name) return name;
  if (shareId) return shareId.slice(0, 8) + "…";
  return "Untitled design";
}
