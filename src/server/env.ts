export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function optionalEnv(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value || fallback;
}

export function shareTtlDays(): number {
  const raw = process.env.SHARE_TTL_DAYS;
  const n = raw ? Number(raw) : 90;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 90;
}

export function shareMaxPayloadBytes(): number {
  const raw = process.env.SHARE_MAX_PAYLOAD_BYTES;
  const n = raw ? Number(raw) : 4_500_000;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 4_500_000;
}

/** Max decoded bytes per face image (~2 MB). */
export const SHARE_MAX_IMAGE_BYTES = 2 * 1024 * 1024;
