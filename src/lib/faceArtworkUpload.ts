/** Same cap as S3 share uploads (`SHARE_MAX_IMAGE_BYTES`). */
export const MAX_FACE_ARTWORK_BYTES = 2 * 1024 * 1024;

export const ALLOWED_FACE_ARTWORK_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_FACE_ARTWORK_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export type FaceArtworkUploadErrorKind = "too_large" | "unsupported" | "unreadable";

export type FaceArtworkUploadError = {
  kind: FaceArtworkUploadErrorKind;
  fileName: string;
  fileSize: number;
  maxBytes: number;
  message: string;
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function extensionOf(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  return i >= 0 ? fileName.slice(i).toLowerCase() : "";
}

export function isAllowedFaceArtworkType(file: File): boolean {
  const mime = (file.type || "").toLowerCase();
  if (ALLOWED_FACE_ARTWORK_MIME_TYPES.has(mime)) return true;
  if (mime && mime !== "application/octet-stream") return false;
  return ALLOWED_FACE_ARTWORK_EXTENSIONS.has(extensionOf(file.name));
}

export function validateFaceArtworkFile(file: File): FaceArtworkUploadError | null {
  if (!isAllowedFaceArtworkType(file)) {
    return {
      kind: "unsupported",
      fileName: file.name,
      fileSize: file.size,
      maxBytes: MAX_FACE_ARTWORK_BYTES,
      message: "Use a JPG, PNG, or WebP image.",
    };
  }
  if (file.size <= MAX_FACE_ARTWORK_BYTES) return null;
  return {
    kind: "too_large",
    fileName: file.name,
    fileSize: file.size,
    maxBytes: MAX_FACE_ARTWORK_BYTES,
    message: `Face artwork must be ${formatFileSize(MAX_FACE_ARTWORK_BYTES)} or smaller.`,
  };
}

export function unreadableFaceArtworkError(file: File): FaceArtworkUploadError {
  return {
    kind: "unreadable",
    fileName: file.name,
    fileSize: file.size,
    maxBytes: MAX_FACE_ARTWORK_BYTES,
    message: "This file could not be read as an image. It may be corrupt or in an unsupported format.",
  };
}
