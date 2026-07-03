import type { ParsedDesignV1 } from "@/boxDesignPersistence";
import type { FaceId } from "@/types";
import { ALL_FACES, SPLIT_TOP_FACES } from "@/types";
import { normalizeShareName } from "@/lib/shareName";
import { getSql } from "./db";
import { SHARE_MAX_IMAGE_BYTES, shareMaxPayloadBytes, shareTtlDays } from "./env";
import { getShareObject, uploadShareFaceImage } from "./s3";
import { customAlphabet } from "nanoid";

const SHARE_FACE_IDS = new Set<FaceId>([...ALL_FACES, ...SPLIT_TOP_FACES, "top"]);

const createShareId = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 14);

export type StoredShareImage = {
  s3Key: string;
  mime: string;
  name: string;
};

export type ShareConfig = Omit<ParsedDesignV1, "faceImages" | "v">;

function stripImages(parsed: ParsedDesignV1): ShareConfig {
  const { faceImages: _faceImages, v: _v, ...config } = parsed;
  return config;
}

function validateImageSizes(parsed: ParsedDesignV1): string | null {
  for (const entry of Object.values(parsed.faceImages)) {
    if (!entry) continue;
    const bytes = Buffer.byteLength(entry.base64, "base64");
    if (bytes > SHARE_MAX_IMAGE_BYTES) {
      return `Each face image must be under ${Math.floor(SHARE_MAX_IMAGE_BYTES / (1024 * 1024))} MB.`;
    }
  }
  return null;
}

async function parseAndValidateDesignJson(designJson: string) {
  const maxPayload = shareMaxPayloadBytes();
  if (Buffer.byteLength(designJson, "utf8") > maxPayload) {
    throw new ShareError("Design is too large to share. Try smaller images or fewer faces.", 413);
  }

  const { parseDesignJsonV1 } = await import("@/boxDesignPersistence");
  const parsed = parseDesignJsonV1(designJson);
  if (!parsed) {
    throw new ShareError("Invalid design JSON. Expected a v1 export from this studio.", 400);
  }

  const imageError = validateImageSizes(parsed);
  if (imageError) throw new ShareError(imageError, 413);

  return parsed;
}

function shareImageApiUrl(shareId: string, faceId: FaceId): string {
  return `/api/shares/${encodeURIComponent(shareId)}/images/${encodeURIComponent(faceId)}`;
}

async function uploadDesignImages(
  shareId: string,
  parsed: ParsedDesignV1
): Promise<Partial<Record<FaceId, StoredShareImage>>> {
  const images: Partial<Record<FaceId, StoredShareImage>> = {};
  for (const faceId of Object.keys(parsed.faceImages) as FaceId[]) {
    const entry = parsed.faceImages[faceId];
    if (!entry) continue;
    const uploaded = await uploadShareFaceImage(shareId, faceId, entry);
    images[faceId] = {
      s3Key: uploaded.s3Key,
      mime: entry.mime,
      name: entry.name,
    };
  }
  return images;
}

export async function createShare(
  designJson: string,
  createdBy: string | null,
  name?: string | null
): Promise<{ id: string; url: string; name: string | null }> {
  const parsed = await parseAndValidateDesignJson(designJson);
  const id = createShareId();
  const images = await uploadDesignImages(id, parsed);
  const config = stripImages(parsed);
  const shareName = normalizeShareName(name);
  const ttlDays = shareTtlDays();
  const sql = getSql();

  await sql`
    INSERT INTO shared_designs (id, name, config, images, expires_at, created_by)
    VALUES (
      ${id},
      ${shareName},
      ${JSON.stringify(config)}::jsonb,
      ${JSON.stringify(images)}::jsonb,
      NOW() + (${ttlDays} * INTERVAL '1 day'),
      ${createdBy}
    )
  `;

  const { getSiteOrigin } = await import("@/lib/siteOrigin");
  const origin = getSiteOrigin();
  return { id, url: `${origin}/studio?share=${id}`, name: shareName };
}

export async function updateShare(id: string, designJson: string): Promise<{ id: string; url: string; name: string | null }> {
  if (!/^[0-9A-Za-z]{10,24}$/.test(id)) {
    throw new ShareError("Invalid share id.", 400);
  }

  const parsed = await parseAndValidateDesignJson(designJson);
  const sql = getSql();

  const existing = (await sql`
    SELECT id, name FROM shared_designs
    WHERE id = ${id}
      AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 1
  `) as { id: string; name: string | null }[];

  if (!existing[0]) {
    throw new ShareError("Share not found or expired.", 404);
  }

  const images = await uploadDesignImages(id, parsed);
  const config = stripImages(parsed);
  const ttlDays = shareTtlDays();

  await sql`
    UPDATE shared_designs
    SET
      config = ${JSON.stringify(config)}::jsonb,
      images = ${JSON.stringify(images)}::jsonb,
      expires_at = NOW() + (${ttlDays} * INTERVAL '1 day')
    WHERE id = ${id}
  `;

  const { getSiteOrigin } = await import("@/lib/siteOrigin");
  const origin = getSiteOrigin();
  return { id, url: `${origin}/studio?share=${id}`, name: existing[0].name ?? null };
}

export async function renameShare(id: string, name: string | null): Promise<{ id: string; name: string | null }> {
  if (!/^[0-9A-Za-z]{10,24}$/.test(id)) {
    throw new ShareError("Invalid share id.", 400);
  }

  const shareName = normalizeShareName(name);
  const sql = getSql();

  const rows = (await sql`
    UPDATE shared_designs
    SET name = ${shareName}
    WHERE id = ${id}
      AND (expires_at IS NULL OR expires_at > NOW())
    RETURNING id
  `) as { id: string }[];

  if (!rows[0]) {
    throw new ShareError("Share not found or expired.", 404);
  }

  return { id, name: shareName };
}

type ShareRow = {
  id: string;
  name: string | null;
  config: ShareConfig;
  images: Partial<Record<FaceId, StoredShareImage>>;
  expires_at: string | null;
};

export async function getShare(id: string): Promise<Record<string, unknown> | null> {
  if (!/^[0-9A-Za-z]{10,24}$/.test(id)) return null;

  const sql = getSql();
  const rows = (await sql`
    UPDATE shared_designs
    SET view_count = view_count + 1
    WHERE id = ${id}
      AND (expires_at IS NULL OR expires_at > NOW())
    RETURNING id, name, config, images, expires_at
  `) as ShareRow[];

  const row = rows[0];
  if (!row) return null;

  const faceImages: Partial<Record<FaceId, { name: string; mime: string; url: string }>> = {};
  for (const [faceId, meta] of Object.entries(row.images ?? {})) {
    if (!meta?.s3Key) continue;
    const id = faceId as FaceId;
    faceImages[id] = {
      name: meta.name,
      mime: meta.mime,
      url: shareImageApiUrl(row.id, id),
    };
  }

  return {
    v: 1,
    shareName: row.name ?? null,
    ...row.config,
    faceImages,
  };
}

export async function getShareFaceImage(
  shareId: string,
  faceId: string
): Promise<{ body: Uint8Array; contentType: string } | null> {
  if (!/^[0-9A-Za-z]{10,24}$/.test(shareId)) return null;
  if (!SHARE_FACE_IDS.has(faceId as FaceId)) return null;

  const sql = getSql();
  const rows = (await sql`
    SELECT images FROM shared_designs
    WHERE id = ${shareId}
      AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 1
  `) as { images: Partial<Record<FaceId, StoredShareImage>> }[];

  const meta = rows[0]?.images?.[faceId as FaceId];
  if (!meta?.s3Key) return null;

  try {
    return await getShareObject(meta.s3Key);
  } catch {
    return null;
  }
}

export class ShareError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ShareError";
    this.status = status;
  }
}
