import { MAX_FACE_ARTWORK_BYTES } from "@/lib/faceArtworkUpload";

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

/** Max decoded bytes per face image. Matches studio upload validation. */
export const SHARE_MAX_IMAGE_BYTES = MAX_FACE_ARTWORK_BYTES;

/** Max decoded bytes for the saved viewport OG preview. */
export const SHARE_MAX_OG_IMAGE_BYTES = SHARE_MAX_IMAGE_BYTES;
