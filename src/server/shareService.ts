import type { ParsedDesignV1 } from "@/boxDesignPersistence";
import type { FaceId } from "@/types";
import { ALL_FACES, SPLIT_TOP_FACES } from "@/types";
import { normalizeShareName } from "@/lib/shareName";
import { appendShareCacheVersion, toShareCacheVersion } from "@/lib/shareUrl";
import { getSql } from "./db";
import { SHARE_MAX_IMAGE_BYTES, SHARE_MAX_OG_IMAGE_BYTES, shareMaxPayloadBytes, shareTtlDays } from "./env";
import { getShareObject, publicUrlForKey, uploadShareFaceImage, uploadShareOgImage } from "./s3";
import { customAlphabet } from "nanoid";

const SHARE_FACE_IDS = new Set<FaceId>([...ALL_FACES, ...SPLIT_TOP_FACES, "top"]);
const SHARE_TOKEN_RE = /^[0-9A-Za-z]{10,24}$/;

const createShareId = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 14);
const createPreviewToken = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 16);

export type StoredShareImage = {
  s3Key: string;
  mime: string;
  name: string;
};

export type ShareConfig = Omit<ParsedDesignV1, "faceImages" | "v">;

export type ShareLinks = {
  id: string;
  previewToken: string;
  url: string;
  previewUrl: string;
  name: string | null;
  updatedAt: string;
};

export type ShareOgImageInput = {
  base64Png: string;
  width: number;
  height: number;
};

export type ShareSeoMeta = {
  name: string | null;
  ogImageUrl: string | null;
  ogImageWidth: number | null;
  ogImageHeight: number | null;
  canonicalPath: string;
  isPreview: boolean;
  cacheVersion: number | null;
};

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

function sharePreviewImageApiUrl(previewToken: string, faceId: FaceId): string {
  return `/api/shares/preview/${encodeURIComponent(previewToken)}/images/${encodeURIComponent(faceId)}`;
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

async function buildShareLinks(
  id: string,
  previewToken: string,
  name: string | null,
  updatedAt: string | Date
): Promise<ShareLinks> {
  const { getSiteOrigin } = await import("@/lib/siteOrigin");
  const origin = getSiteOrigin();
  const updatedAtIso = typeof updatedAt === "string" ? updatedAt : updatedAt.toISOString();
  const cacheVersion = toShareCacheVersion(updatedAtIso);
  return {
    id,
    previewToken,
    name,
    url: `${origin}/studio/${id}`,
    previewUrl: appendShareCacheVersion(`${origin}/preview/${previewToken}`, cacheVersion),
    updatedAt: updatedAtIso,
  };
}

async function saveOgImage(
  shareId: string,
  ogImage: ShareOgImageInput | null | undefined
): Promise<{
  og_image_key: string | null;
  og_image_width: number | null;
  og_image_height: number | null;
}> {
  if (!ogImage) {
    return { og_image_key: null, og_image_width: null, og_image_height: null };
  }

  const buffer = Buffer.from(ogImage.base64Png, "base64");
  if (!buffer.byteLength) {
    throw new ShareError("Preview image is empty.", 400);
  }
  if (buffer.byteLength > SHARE_MAX_OG_IMAGE_BYTES) {
    throw new ShareError("Preview image is too large.", 413);
  }

  const uploaded = await uploadShareOgImage(shareId, buffer);
  return {
    og_image_key: uploaded.s3Key,
    og_image_width: ogImage.width,
    og_image_height: ogImage.height,
  };
}

function buildOgImagePublicUrl(ogImageKey: string | null, cacheVersion: number | null): string | null {
  if (!ogImageKey) return null;
  return appendShareCacheVersion(publicUrlForKey(ogImageKey), cacheVersion);
}

function buildPreviewCanonicalPath(previewToken: string, cacheVersion: number | null): string {
  return appendShareCacheVersion(`/preview/${previewToken}`, cacheVersion);
}

function buildEditorPayload(
  row: ShareRow,
  faceImageUrl: (faceId: FaceId) => string,
  includePreviewToken: boolean
): Record<string, unknown> {
  const faceImages: Partial<Record<FaceId, { name: string; mime: string; url: string }>> = {};
  for (const [faceId, meta] of Object.entries(row.images ?? {})) {
    if (!meta?.s3Key) continue;
    const id = faceId as FaceId;
    faceImages[id] = {
      name: meta.name,
      mime: meta.mime,
      url: faceImageUrl(id),
    };
  }

  return {
    v: 1,
    shareName: row.name ?? null,
    shareUpdatedAt: row.updated_at ?? null,
    ...(includePreviewToken ? { previewToken: row.preview_token } : {}),
    ...row.config,
    faceImages,
  };
}

function assertOwner(ownerId: string | null, userId: string): void {
  if (!ownerId || ownerId !== userId) {
    throw new ShareError("You don't have permission to modify this project.", 403);
  }
}

export type ProjectSummary = {
  id: string;
  previewToken: string;
  name: string | null;
  updatedAt: string;
  createdAt: string;
  thumbnailUrl: string | null;
};

export async function listUserProjects(userId: string): Promise<ProjectSummary[]> {
  const sql = getSql();
  const rows = (await sql`
    SELECT id, preview_token, name, og_image_key, created_at, updated_at
    FROM shared_designs
    WHERE user_id = ${userId}
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY updated_at DESC
    LIMIT 200
  `) as {
    id: string;
    preview_token: string;
    name: string | null;
    og_image_key: string | null;
    created_at: string;
    updated_at: string;
  }[];

  return rows.map((row) => {
    const cacheVersion = toShareCacheVersion(row.updated_at);
    return {
      id: row.id,
      previewToken: row.preview_token,
      name: row.name ?? null,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
      thumbnailUrl: buildOgImagePublicUrl(row.og_image_key, cacheVersion),
    };
  });
}

/** Returns the owner user id for a project, or undefined if it does not exist / expired. */
export async function getShareOwnerId(id: string): Promise<string | null | undefined> {
  if (!SHARE_TOKEN_RE.test(id)) return undefined;
  const sql = getSql();
  const rows = (await sql`
    SELECT user_id FROM shared_designs
    WHERE id = ${id}
      AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 1
  `) as { user_id: string | null }[];
  if (rows.length === 0) return undefined;
  return rows[0].user_id;
}

export async function deleteShare(id: string, userId: string): Promise<void> {
  if (!SHARE_TOKEN_RE.test(id)) {
    throw new ShareError("Invalid project id.", 400);
  }
  const sql = getSql();
  const existing = (await sql`
    SELECT user_id FROM shared_designs WHERE id = ${id} LIMIT 1
  `) as { user_id: string | null }[];

  if (existing.length === 0) {
    throw new ShareError("Project not found.", 404);
  }
  assertOwner(existing[0].user_id, userId);

  await sql`DELETE FROM shared_designs WHERE id = ${id}`;
}

export async function createShare(
  designJson: string,
  createdBy: string | null,
  name?: string | null,
  ogImage?: ShareOgImageInput | null
): Promise<ShareLinks> {
  const parsed = await parseAndValidateDesignJson(designJson);
  const id = createShareId();
  const previewToken = createPreviewToken();
  const images = await uploadDesignImages(id, parsed);
  const config = stripImages(parsed);
  const shareName = normalizeShareName(name);
  const ogMeta = ogImage ? await saveOgImage(id, ogImage) : { og_image_key: null, og_image_width: null, og_image_height: null };
  const ttlDays = shareTtlDays();
  const sql = getSql();

  // Signed-in projects are permanent; any legacy anonymous share keeps the TTL.
  const expiresAt = createdBy ? null : new Date(Date.now() + ttlDays * 86_400_000).toISOString();

  const rows = (await sql`
    INSERT INTO shared_designs (
      id,
      preview_token,
      name,
      config,
      images,
      expires_at,
      created_by,
      user_id,
      og_image_key,
      og_image_width,
      og_image_height
    )
    VALUES (
      ${id},
      ${previewToken},
      ${shareName},
      ${JSON.stringify(config)}::jsonb,
      ${JSON.stringify(images)}::jsonb,
      ${expiresAt},
      ${createdBy},
      ${createdBy},
      ${ogMeta.og_image_key},
      ${ogMeta.og_image_width},
      ${ogMeta.og_image_height}
    )
    RETURNING updated_at
  `) as { updated_at: string }[];

  const updatedAt = rows[0]?.updated_at;
  if (!updatedAt) {
    throw new ShareError("Could not create share.", 500);
  }

  return buildShareLinks(id, previewToken, shareName, updatedAt);
}

export async function updateShare(
  id: string,
  designJson: string,
  userId: string,
  ogImage?: ShareOgImageInput | null
): Promise<ShareLinks> {
  if (!SHARE_TOKEN_RE.test(id)) {
    throw new ShareError("Invalid share id.", 400);
  }

  const parsed = await parseAndValidateDesignJson(designJson);
  const sql = getSql();

  const existing = (await sql`
    SELECT id, preview_token, name, user_id FROM shared_designs
    WHERE id = ${id}
      AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 1
  `) as { id: string; preview_token: string; name: string | null; user_id: string | null }[];

  if (!existing[0]?.preview_token) {
    throw new ShareError("Project not found.", 404);
  }
  assertOwner(existing[0].user_id, userId);

  const images = await uploadDesignImages(id, parsed);
  const config = stripImages(parsed);
  const ogMeta = ogImage ? await saveOgImage(id, ogImage) : null;

  const updatedRows = (await sql`
    UPDATE shared_designs
    SET
      config = ${JSON.stringify(config)}::jsonb,
      images = ${JSON.stringify(images)}::jsonb,
      og_image_key = COALESCE(${ogMeta?.og_image_key ?? null}, og_image_key),
      og_image_width = COALESCE(${ogMeta?.og_image_width ?? null}, og_image_width),
      og_image_height = COALESCE(${ogMeta?.og_image_height ?? null}, og_image_height),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING updated_at
  `) as { updated_at: string }[];

  const updatedAt = updatedRows[0]?.updated_at;
  if (!updatedAt) {
    throw new ShareError("Share not found or expired.", 404);
  }

  return buildShareLinks(existing[0].id, existing[0].preview_token, existing[0].name ?? null, updatedAt);
}

export async function renameShare(
  id: string,
  name: string | null,
  userId: string
): Promise<{ id: string; name: string | null; updatedAt: string }> {
  if (!SHARE_TOKEN_RE.test(id)) {
    throw new ShareError("Invalid share id.", 400);
  }

  const shareName = normalizeShareName(name);
  const sql = getSql();

  const existing = (await sql`
    SELECT user_id FROM shared_designs
    WHERE id = ${id}
      AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 1
  `) as { user_id: string | null }[];
  if (existing.length === 0) {
    throw new ShareError("Project not found.", 404);
  }
  assertOwner(existing[0].user_id, userId);

  const rows = (await sql`
    UPDATE shared_designs
    SET name = ${shareName}, updated_at = NOW()
    WHERE id = ${id}
      AND (expires_at IS NULL OR expires_at > NOW())
    RETURNING id, updated_at
  `) as { id: string; updated_at: string }[];

  if (!rows[0]) {
    throw new ShareError("Share not found or expired.", 404);
  }

  return { id, name: shareName, updatedAt: rows[0].updated_at };
}

export async function updateShareOgImage(
  shareId: string,
  pngBuffer: Buffer,
  width: number,
  height: number,
  userId: string
): Promise<{ ogImageUrl: string; width: number; height: number; updatedAt: string }> {
  if (!SHARE_TOKEN_RE.test(shareId)) {
    throw new ShareError("Invalid share id.", 400);
  }
  if (!pngBuffer.byteLength) {
    throw new ShareError("Preview image is empty.", 400);
  }
  if (pngBuffer.byteLength > SHARE_MAX_OG_IMAGE_BYTES) {
    throw new ShareError("Preview image is too large.", 413);
  }
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new ShareError("Invalid preview image dimensions.", 400);
  }

  const sql = getSql();
  const existing = (await sql`
    SELECT id, user_id FROM shared_designs
    WHERE id = ${shareId}
      AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 1
  `) as { id: string; user_id: string | null }[];

  if (!existing[0]) {
    throw new ShareError("Share not found or expired.", 404);
  }
  assertOwner(existing[0].user_id, userId);

  const uploaded = await uploadShareOgImage(shareId, pngBuffer);
  const imageWidth = Math.round(width);
  const imageHeight = Math.round(height);

  const rows = (await sql`
    UPDATE shared_designs
    SET
      og_image_key = ${uploaded.s3Key},
      og_image_width = ${imageWidth},
      og_image_height = ${imageHeight},
      updated_at = NOW()
    WHERE id = ${shareId}
    RETURNING updated_at
  `) as { updated_at: string }[];

  const updatedAt = rows[0]?.updated_at;
  if (!updatedAt) {
    throw new ShareError("Share not found or expired.", 404);
  }

  return {
    ogImageUrl: publicUrlForKey(uploaded.s3Key),
    width: imageWidth,
    height: imageHeight,
    updatedAt,
  };
}

type ShareRow = {
  id: string;
  preview_token: string;
  name: string | null;
  config: ShareConfig;
  images: Partial<Record<FaceId, StoredShareImage>>;
  expires_at: string | null;
  og_image_key: string | null;
  og_image_width: number | null;
  og_image_height: number | null;
  updated_at: string | null;
};

export async function getShareSeoMeta(shareId: string): Promise<ShareSeoMeta | null> {
  if (!SHARE_TOKEN_RE.test(shareId)) return null;

  const sql = getSql();
  const rows = (await sql`
    SELECT name, og_image_key, og_image_width, og_image_height, updated_at
    FROM shared_designs
    WHERE id = ${shareId}
      AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 1
  `) as Pick<ShareRow, "name" | "og_image_key" | "og_image_width" | "og_image_height" | "updated_at">[];

  const row = rows[0];
  if (!row) return null;

  const cacheVersion = toShareCacheVersion(row.updated_at);

  return {
    name: row.name ?? null,
    ogImageUrl: buildOgImagePublicUrl(row.og_image_key, cacheVersion),
    ogImageWidth: row.og_image_width ?? null,
    ogImageHeight: row.og_image_height ?? null,
    canonicalPath: `/studio/${shareId}`,
    isPreview: false,
    cacheVersion,
  };
}

export async function getShareSeoMetaByPreviewToken(previewToken: string): Promise<ShareSeoMeta | null> {
  if (!SHARE_TOKEN_RE.test(previewToken)) return null;

  const sql = getSql();
  const rows = (await sql`
    SELECT name, og_image_key, og_image_width, og_image_height, updated_at
    FROM shared_designs
    WHERE preview_token = ${previewToken}
      AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 1
  `) as Pick<ShareRow, "name" | "og_image_key" | "og_image_width" | "og_image_height" | "updated_at">[];

  const row = rows[0];
  if (!row) return null;

  const cacheVersion = toShareCacheVersion(row.updated_at);

  return {
    name: row.name ?? null,
    ogImageUrl: buildOgImagePublicUrl(row.og_image_key, cacheVersion),
    ogImageWidth: row.og_image_width ?? null,
    ogImageHeight: row.og_image_height ?? null,
    canonicalPath: buildPreviewCanonicalPath(previewToken, cacheVersion),
    isPreview: true,
    cacheVersion,
  };
}

export async function getShareOgImage(
  shareId: string
): Promise<{ body: Uint8Array; contentType: string } | null> {
  if (!SHARE_TOKEN_RE.test(shareId)) return null;

  const sql = getSql();
  const rows = (await sql`
    SELECT og_image_key FROM shared_designs
    WHERE id = ${shareId}
      AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 1
  `) as { og_image_key: string | null }[];

  const key = rows[0]?.og_image_key;
  if (!key) return null;

  try {
    return await getShareObject(key);
  } catch {
    return null;
  }
}

export async function getSharePreviewOgImage(
  previewToken: string
): Promise<{ body: Uint8Array; contentType: string } | null> {
  if (!SHARE_TOKEN_RE.test(previewToken)) return null;

  const sql = getSql();
  const rows = (await sql`
    SELECT og_image_key FROM shared_designs
    WHERE preview_token = ${previewToken}
      AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 1
  `) as { og_image_key: string | null }[];

  const key = rows[0]?.og_image_key;
  if (!key) return null;

  try {
    return await getShareObject(key);
  } catch {
    return null;
  }
}

export async function getShare(id: string): Promise<Record<string, unknown> | null> {
  if (!SHARE_TOKEN_RE.test(id)) return null;

  const sql = getSql();
  const rows = (await sql`
    UPDATE shared_designs
    SET view_count = view_count + 1
    WHERE id = ${id}
      AND (expires_at IS NULL OR expires_at > NOW())
    RETURNING id, preview_token, name, config, images, expires_at, updated_at
  `) as ShareRow[];

  const row = rows[0];
  if (!row?.preview_token) return null;

  return buildEditorPayload(row, (faceId) => shareImageApiUrl(row.id, faceId), true);
}

export async function getShareByPreviewToken(previewToken: string): Promise<Record<string, unknown> | null> {
  if (!SHARE_TOKEN_RE.test(previewToken)) return null;

  const sql = getSql();
  const rows = (await sql`
    UPDATE shared_designs
    SET view_count = view_count + 1
    WHERE preview_token = ${previewToken}
      AND (expires_at IS NULL OR expires_at > NOW())
    RETURNING id, preview_token, name, config, images, expires_at, updated_at
  `) as ShareRow[];

  const row = rows[0];
  if (!row) return null;

  return buildEditorPayload(row, (faceId) => sharePreviewImageApiUrl(row.preview_token, faceId), false);
}

export async function getShareFaceImage(
  shareId: string,
  faceId: string
): Promise<{ body: Uint8Array; contentType: string } | null> {
  if (!SHARE_TOKEN_RE.test(shareId)) return null;
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

export async function getSharePreviewFaceImage(
  previewToken: string,
  faceId: string
): Promise<{ body: Uint8Array; contentType: string } | null> {
  if (!SHARE_TOKEN_RE.test(previewToken)) return null;
  if (!SHARE_FACE_IDS.has(faceId as FaceId)) return null;

  const sql = getSql();
  const rows = (await sql`
    SELECT images FROM shared_designs
    WHERE preview_token = ${previewToken}
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
