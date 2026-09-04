import type { FaceId } from "@/types";

export function createSharedFileObjectUrls(
  files: Partial<Record<FaceId, File | null>>,
  createObjectURL: (file: File) => string = (file) => URL.createObjectURL(file),
  revokeObjectURL: (url: string) => void = (url) => URL.revokeObjectURL(url)
): {
  urls: Partial<Record<FaceId, string>>;
  revoke: () => void;
} {
  const urls: Partial<Record<FaceId, string>> = {};
  const created: string[] = [];
  const byFile = new Map<File, string>();

  (Object.keys(files) as FaceId[]).forEach((key) => {
    const file = files[key];
    if (!file) return;
    const existing = byFile.get(file);
    if (existing) {
      urls[key] = existing;
      return;
    }
    const url = createObjectURL(file);
    byFile.set(file, url);
    urls[key] = url;
    created.push(url);
  });

  return {
    urls,
    revoke: () => {
      created.forEach((url) => revokeObjectURL(url));
    },
  };
}
