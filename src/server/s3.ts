import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { PersistedImageEntry } from "@/boxDesignPersistence";
import type { FaceId } from "@/types";
import { optionalEnv, requireEnv } from "./env";

let client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!client) {
    client = new S3Client({
      region: requireEnv("AWS_REGION"),
      credentials: {
        accessKeyId: requireEnv("AWS_ACCESS_KEY_ID"),
        secretAccessKey: requireEnv("AWS_SECRET_ACCESS_KEY"),
      },
    });
  }
  return client;
}

function sharePrefix(): string {
  const raw = optionalEnv("AWS_S3_SHARE_PREFIX", "shares/");
  return raw.endsWith("/") ? raw : `${raw}/`;
}

function extensionFromMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "image/png":
    default:
      return ".png";
  }
}

export function publicUrlForKey(key: string): string {
  const customBase = process.env.AWS_S3_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (customBase) return `${customBase}/${key}`;
  const bucket = requireEnv("AWS_S3_BUCKET");
  const region = requireEnv("AWS_REGION");
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export async function uploadShareFaceImage(
  shareId: string,
  faceId: FaceId,
  entry: PersistedImageEntry
): Promise<{ s3Key: string; url: string }> {
  const key = `${sharePrefix()}${shareId}/${faceId}${extensionFromMime(entry.mime)}`;
  const body = Buffer.from(entry.base64, "base64");
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: requireEnv("AWS_S3_BUCKET"),
      Key: key,
      Body: body,
      ContentType: entry.mime,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return { s3Key: key, url: publicUrlForKey(key) };
}

export async function getShareObject(key: string): Promise<{ body: Uint8Array; contentType: string }> {
  const res = await getS3Client().send(
    new GetObjectCommand({
      Bucket: requireEnv("AWS_S3_BUCKET"),
      Key: key,
    })
  );
  const body = await res.Body?.transformToByteArray();
  if (!body) throw new Error("Empty S3 object");
  return {
    body,
    contentType: res.ContentType || "application/octet-stream",
  };
}
