export type SourceImage = {
  id: string;
  url?: string;
  storageKey?: string;
  originalFileName?: string;
  mimeType?: string;
  naturalWidth: number;
  naturalHeight: number;
  fileSize?: number;
};

export type SourceImageRecord = SourceImage & {
  file: File;
};

export function createSourceImageId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `src_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function decodeImageFile(file: File): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    try {
      if (!(bitmap.width > 0 && bitmap.height > 0)) {
        throw new Error("Image has no dimensions.");
      }
      return { width: bitmap.width, height: bitmap.height };
    } finally {
      bitmap.close();
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const size = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        if (!(image.naturalWidth > 0 && image.naturalHeight > 0)) {
          reject(new Error("Image has no dimensions."));
          return;
        }
        resolve({ width: image.naturalWidth, height: image.naturalHeight });
      };
      image.onerror = () => reject(new Error("Could not decode image."));
      image.src = objectUrl;
    });
    return size;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function findMatchingSource(
  catalog: Record<string, SourceImageRecord>,
  file: File
): SourceImageRecord | undefined {
  return Object.values(catalog).find(
    (source) =>
      source.file === file ||
      (source.originalFileName === file.name &&
        source.file.size === file.size &&
        (source.mimeType || "") === (file.type || ""))
  );
}

export async function createSourceImageFromFile(
  file: File,
  catalog: Record<string, SourceImageRecord> = {}
): Promise<SourceImageRecord> {
  const existing = findMatchingSource(catalog, file);
  if (existing) return existing;

  const decoded = await decodeImageFile(file);
  return {
    id: createSourceImageId(),
    file,
    originalFileName: file.name,
    mimeType: file.type || "application/octet-stream",
    naturalWidth: decoded.width,
    naturalHeight: decoded.height,
    fileSize: file.size,
  };
}

export function sourceRecordFromLoadedFile(
  file: File,
  meta: {
    id?: string;
    naturalWidth?: number;
    naturalHeight?: number;
    originalFileName?: string;
    mimeType?: string;
    url?: string;
    storageKey?: string;
  } = {}
): SourceImageRecord {
  return {
    id: meta.id || createSourceImageId(),
    file,
    url: meta.url,
    storageKey: meta.storageKey,
    originalFileName: meta.originalFileName || file.name,
    mimeType: meta.mimeType || file.type || "application/octet-stream",
    naturalWidth: meta.naturalWidth && meta.naturalWidth > 0 ? meta.naturalWidth : 0,
    naturalHeight: meta.naturalHeight && meta.naturalHeight > 0 ? meta.naturalHeight : 0,
    fileSize: file.size,
  };
}

export function uniqueSourcesFromRecords(
  catalog: Record<string, SourceImageRecord>
): SourceImageRecord[] {
  const seen = new Set<string>();
  const out: SourceImageRecord[] = [];
  for (const source of Object.values(catalog)) {
    if (seen.has(source.id)) continue;
    seen.add(source.id);
    out.push(source);
  }
  return out.sort((a, b) =>
    (a.originalFileName || "").localeCompare(b.originalFileName || "", undefined, { sensitivity: "base" })
  );
}
