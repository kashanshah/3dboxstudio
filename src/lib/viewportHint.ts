const STORAGE_KEY = "3dboxstudio:viewport-hint-dismissed:v1";
const DISMISS_MS = 24 * 60 * 60 * 1000;

export function isViewportHintDismissed(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) return false;
    return Date.now() - dismissedAt < DISMISS_MS;
  } catch {
    return false;
  }
}

export function dismissViewportHint(): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* ignore quota errors */
  }
}
