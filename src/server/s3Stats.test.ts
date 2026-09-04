import { describe, expect, it } from "vitest";
import { bucketS3Inventory, classifyS3ObjectKey, summarizeS3Inventory, type S3ObjectRecord } from "./s3Stats";

function obj(partial: Partial<S3ObjectRecord> & Pick<S3ObjectRecord, "key" | "lastModified">): S3ObjectRecord {
  return {
    size: 1024,
    storageClass: "STANDARD",
    kind: classifyS3ObjectKey(partial.key),
    ...partial,
  };
}

describe("classifyS3ObjectKey", () => {
  it("classifies face, OG, and other keys", () => {
    expect(classifyS3ObjectKey("shares/abc/front.png")).toBe("face");
    expect(classifyS3ObjectKey("shares/abc/topLeft.webp")).toBe("face");
    expect(classifyS3ObjectKey("shares/abc/src_dieline1.jpg")).toBe("face");
    expect(classifyS3ObjectKey("shares/abc/og-preview.png")).toBe("og");
    expect(classifyS3ObjectKey("shares/abc/notes.txt")).toBe("other");
  });
});

describe("summarizeS3Inventory", () => {
  it("totals size, kinds, and recent uploads", () => {
    const now = new Date("2026-09-04T16:00:00.000Z");
    const usage = summarizeS3Inventory(
      [
        obj({ key: "shares/a/front.png", size: 2_000_000, lastModified: new Date("2026-09-03T12:00:00.000Z") }),
        obj({ key: "shares/a/og-preview.png", size: 400_000, lastModified: new Date("2026-09-01T12:00:00.000Z") }),
        obj({ key: "shares/b/notes.txt", size: 100, lastModified: new Date("2026-07-01T12:00:00.000Z") }),
      ],
      {
        bucket: "3dboxstudio",
        region: "us-east-1",
        prefix: "shares/",
        scannedAt: now.toISOString(),
      },
      now,
    );

    expect(usage.available).toBe(true);
    expect(usage.objectCount).toBe(3);
    expect(usage.totalBytes).toBe(2_400_100);
    expect(usage.faceImages).toBe(1);
    expect(usage.ogImages).toBe(1);
    expect(usage.otherObjects).toBe(1);
    expect(usage.last7Days.objects).toBe(2);
    expect(usage.last7Days.bytes).toBe(2_400_000);
    expect(usage.last30Days.objects).toBe(2);
    expect(usage.estimatedMonthlyStorageUsd).toBeCloseTo(2_400_100 / 1024 ** 3 * 0.023, 8);
    expect(usage.objectsByDay.some((day) => day.count > 0)).toBe(true);
  });
});

describe("bucketS3Inventory", () => {
  it("groups objects onto the matching period keys", () => {
    const series = bucketS3Inventory(
      [
        obj({ key: "shares/a/front.png", size: 10, lastModified: new Date("2026-09-03T12:00:00.000Z") }),
        obj({ key: "shares/a/back.png", size: 5, lastModified: new Date("2026-08-01T12:00:00.000Z") }),
      ],
      [{ key: "2026-09-03" }, { key: "2026-08-01" }, { key: "2026-07-01" }],
      "day",
    );

    expect(series).toEqual([
      { imagesUploaded: 1, bytesUploaded: 10 },
      { imagesUploaded: 1, bytesUploaded: 5 },
      { imagesUploaded: 0, bytesUploaded: 0 },
    ]);
  });
});
