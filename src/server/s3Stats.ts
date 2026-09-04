import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { adminPeriodKey, listAdminDayKeys, startOfAdminPeriod, type AdminPeriodTrunc } from "@/lib/adminTimeZone";
import type { AdminS3Usage, AdminS3Window } from "@/server/admin/types";
import { getS3Client, s3BucketConfig } from "./s3";

const CACHE_TTL_MS = 5 * 60 * 1000;
const ERROR_CACHE_TTL_MS = 30 * 1000;
const MAX_LIST_PAGES = 100;
const S3_STANDARD_USD_PER_GB_MONTH = 0.023;
const S3_PUT_USD_PER_THOUSAND = 0.005;
const BYTES_PER_GB = 1024 ** 3;

export type S3ObjectKind = "face" | "og" | "other";

export type S3ObjectRecord = {
  key: string;
  size: number;
  lastModified: Date;
  storageClass: string;
  kind: S3ObjectKind;
};

export type S3Inventory =
  | {
      ok: true;
      objects: S3ObjectRecord[];
      bucket: string;
      region: string;
      prefix: string;
      scannedAt: string;
      truncated: boolean;
    }
  | {
      ok: false;
      error: string;
      bucket: string;
      region: string;
      prefix: string;
    };

type CacheEntry = { expiresAt: number; inventory: S3Inventory };

let cache: CacheEntry | null = null;

const FACE_FILE = /\/(front|back|left|right|top|bottom|topLeft|topRight)\.(png|jpe?g|webp|gif)$/i;
const OG_FILE = /\/og-preview\.[a-z0-9]+$/i;

export function classifyS3ObjectKey(key: string): S3ObjectKind {
  if (OG_FILE.test(key)) return "og";
  if (FACE_FILE.test(key)) return "face";
  return "other";
}

function emptyWindow(): AdminS3Window {
  return { objects: 0, bytes: 0 };
}

function emptyUsage(partial: Pick<AdminS3Usage, "bucket" | "region" | "prefix"> & Partial<AdminS3Usage>): AdminS3Usage {
  return {
    available: false,
    scannedAt: new Date(0).toISOString(),
    objectCount: 0,
    totalBytes: 0,
    averageBytes: 0,
    faceImages: 0,
    ogImages: 0,
    otherObjects: 0,
    last7Days: emptyWindow(),
    last30Days: emptyWindow(),
    objectsByDay: listAdminDayKeys(30).map((date) => ({ date, count: 0, bytes: 0 })),
    storageClasses: [],
    estimatedMonthlyStorageUsd: 0,
    estimatedMonthlyPutUsd: 0,
    truncated: false,
    ...partial,
  };
}

function safeConfig(): { bucket: string; region: string; prefix: string } {
  try {
    return s3BucketConfig();
  } catch {
    return {
      bucket: process.env.AWS_S3_BUCKET?.trim() || "",
      region: process.env.AWS_REGION?.trim() || "",
      prefix: process.env.AWS_S3_SHARE_PREFIX?.trim() || "shares/",
    };
  }
}

function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "name" in error) {
    const name = String((error as { name?: string }).name);
    if (name === "AccessDenied" || name === "AllAccessDisabled") {
      return "Could not list the S3 bucket. Confirm the AWS key has s3:ListBucket permission.";
    }
    if (name === "NoSuchBucket") {
      return "The configured S3 bucket was not found.";
    }
  }
  if (error instanceof Error && error.message) {
    if (/is not configured/.test(error.message)) {
      return error.message;
    }
    return `Could not list the S3 bucket. ${error.message}`;
  }
  return "Could not list the S3 bucket.";
}

async function listAllS3Objects(bucket: string): Promise<{ objects: S3ObjectRecord[]; truncated: boolean }> {
  const client = getS3Client();
  const objects: S3ObjectRecord[] = [];
  let continuationToken: string | undefined;
  let pages = 0;

  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      }),
    );

    for (const obj of res.Contents ?? []) {
      if (!obj.Key) continue;
      objects.push({
        key: obj.Key,
        size: obj.Size ?? 0,
        lastModified: obj.LastModified ?? new Date(0),
        storageClass: obj.StorageClass ?? "STANDARD",
        kind: classifyS3ObjectKey(obj.Key),
      });
    }

    pages += 1;
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken && pages < MAX_LIST_PAGES);

  return { objects, truncated: Boolean(continuationToken) };
}

export function summarizeS3Inventory(
  objects: S3ObjectRecord[],
  meta: { bucket: string; region: string; prefix: string; scannedAt: string; truncated?: boolean },
  now = new Date(),
): AdminS3Usage {
  const last7Ms = 7 * 24 * 60 * 60 * 1000;
  const last30Ms = 30 * 24 * 60 * 60 * 1000;
  const last7Days = emptyWindow();
  const last30Days = emptyWindow();
  const dayCounts = new Map<string, { count: number; bytes: number }>();
  const classCounts = new Map<string, { objects: number; bytes: number }>();

  let totalBytes = 0;
  let faceImages = 0;
  let ogImages = 0;
  let otherObjects = 0;

  for (const obj of objects) {
    totalBytes += obj.size;
    if (obj.kind === "face") faceImages += 1;
    else if (obj.kind === "og") ogImages += 1;
    else otherObjects += 1;

    const age = now.getTime() - obj.lastModified.getTime();
    if (age >= 0 && age < last30Ms) {
      last30Days.objects += 1;
      last30Days.bytes += obj.size;
      if (age < last7Ms) {
        last7Days.objects += 1;
        last7Days.bytes += obj.size;
      }
    }

    const dayKey = adminPeriodKey(startOfAdminPeriod(obj.lastModified, "day"), "day");
    const day = dayCounts.get(dayKey) ?? { count: 0, bytes: 0 };
    day.count += 1;
    day.bytes += obj.size;
    dayCounts.set(dayKey, day);

    const classLabel = obj.storageClass || "STANDARD";
    const storage = classCounts.get(classLabel) ?? { objects: 0, bytes: 0 };
    storage.objects += 1;
    storage.bytes += obj.size;
    classCounts.set(classLabel, storage);
  }

  return {
    available: true,
    bucket: meta.bucket,
    region: meta.region,
    prefix: meta.prefix,
    scannedAt: meta.scannedAt,
    objectCount: objects.length,
    totalBytes,
    averageBytes: objects.length > 0 ? Math.round(totalBytes / objects.length) : 0,
    faceImages,
    ogImages,
    otherObjects,
    last7Days,
    last30Days,
    objectsByDay: listAdminDayKeys(30, now).map((date) => ({
      date,
      count: dayCounts.get(date)?.count ?? 0,
      bytes: dayCounts.get(date)?.bytes ?? 0,
    })),
    storageClasses: [...classCounts.entries()]
      .map(([label, value]) => ({ label, objects: value.objects, bytes: value.bytes }))
      .sort((a, b) => b.bytes - a.bytes || a.label.localeCompare(b.label)),
    estimatedMonthlyStorageUsd: (totalBytes / BYTES_PER_GB) * S3_STANDARD_USD_PER_GB_MONTH,
    estimatedMonthlyPutUsd: (last30Days.objects / 1000) * S3_PUT_USD_PER_THOUSAND,
    truncated: Boolean(meta.truncated),
  };
}

export function bucketS3Inventory(
  objects: S3ObjectRecord[],
  periods: { key: string }[],
  trunc: AdminPeriodTrunc,
): { imagesUploaded: number; bytesUploaded: number }[] {
  const map = new Map<string, { imagesUploaded: number; bytesUploaded: number }>();
  for (const obj of objects) {
    if (!obj.lastModified.getTime()) continue;
    const key = adminPeriodKey(startOfAdminPeriod(obj.lastModified, trunc), trunc);
    const current = map.get(key) ?? { imagesUploaded: 0, bytesUploaded: 0 };
    current.imagesUploaded += 1;
    current.bytesUploaded += obj.size;
    map.set(key, current);
  }

  return periods.map((period) => map.get(period.key) ?? { imagesUploaded: 0, bytesUploaded: 0 });
}

async function loadS3Inventory(): Promise<S3Inventory> {
  const config = s3BucketConfig();
  const { objects, truncated } = await listAllS3Objects(config.bucket);
  return {
    ok: true,
    objects,
    bucket: config.bucket,
    region: config.region,
    prefix: config.prefix,
    scannedAt: new Date().toISOString(),
    truncated,
  };
}

export async function getS3Inventory(): Promise<S3Inventory> {
  if (cache && cache.expiresAt > Date.now()) return cache.inventory;

  try {
    const inventory = await loadS3Inventory();
    cache = { expiresAt: Date.now() + CACHE_TTL_MS, inventory };
    return inventory;
  } catch (error) {
    const config = safeConfig();
    const inventory: S3Inventory = {
      ok: false,
      error: errorMessage(error),
      bucket: config.bucket,
      region: config.region,
      prefix: config.prefix,
    };
    cache = { expiresAt: Date.now() + ERROR_CACHE_TTL_MS, inventory };
    console.error("S3 inventory listing failed:", error);
    return inventory;
  }
}

export async function getS3UsageStats(now = new Date()): Promise<AdminS3Usage> {
  const inventory = await getS3Inventory();
  if (!inventory.ok) {
    return emptyUsage({
      available: false,
      error: inventory.error,
      bucket: inventory.bucket,
      region: inventory.region,
      prefix: inventory.prefix,
    });
  }

  return summarizeS3Inventory(
    inventory.objects,
    {
      bucket: inventory.bucket,
      region: inventory.region,
      prefix: inventory.prefix,
      scannedAt: inventory.scannedAt,
      truncated: inventory.truncated,
    },
    now,
  );
}
