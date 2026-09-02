export const MAX_FACE_ARTWORK_BYTES = 4 * 1024 * 1024;

export type FaceArtworkUploadError = {
  fileName: string;
  fileSize: number;
  maxBytes: number;
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function validateFaceArtworkFile(file: File): FaceArtworkUploadError | null {
  if (file.size <= MAX_FACE_ARTWORK_BYTES) return null;
  return {
    fileName: file.name,
    fileSize: file.size,
    maxBytes: MAX_FACE_ARTWORK_BYTES,
  };
}
