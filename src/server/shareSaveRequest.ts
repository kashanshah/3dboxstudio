import type { ShareOgImageInput } from "./shareService";

export type ParsedShareSaveRequest = {
  designJson: string;
  ogImage: ShareOgImageInput | null;
};

function parseOgImageObject(value: unknown): ShareOgImageInput | null {
  if (typeof value !== "object" || value === null) return null;
  const o = value as ShareOgImageInput;
  if (typeof o.base64Png !== "string" || !o.base64Png.trim()) return null;
  const width = Number(o.width);
  const height = Number(o.height);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  return { base64Png: o.base64Png.trim(), width: Math.round(width), height: Math.round(height) };
}

export function parseShareOgImageFromHeaders(req: Request): ShareOgImageInput | null {
  const base64Png = req.headers.get("X-Share-Og-Image")?.trim();
  if (!base64Png) return null;

  const width = Number(req.headers.get("X-Share-Og-Image-Width"));
  const height = Number(req.headers.get("X-Share-Og-Image-Height"));
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }

  return { base64Png, width: Math.round(width), height: Math.round(height) };
}

/** Parse design JSON body; supports legacy raw v1 JSON or `{ design, ogImage }` wrapper. */
export function parseShareSaveRequest(req: Request, rawBody: string): ParsedShareSaveRequest {
  const headerOg = parseShareOgImageFromHeaders(req);
  const trimmed = rawBody.trim();
  if (!trimmed) {
    return { designJson: "", ogImage: headerOg };
  }

  if (trimmed.startsWith("{")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (typeof parsed === "object" && parsed !== null && "design" in parsed) {
        const design = (parsed as { design: unknown }).design;
        const designJson = typeof design === "string" ? design : JSON.stringify(design);
        const ogImage = parseOgImageObject((parsed as { ogImage?: unknown }).ogImage) ?? headerOg;
        return { designJson, ogImage };
      }
    } catch {
      /* fall through to raw design JSON */
    }
  }

  return { designJson: rawBody, ogImage: headerOg };
}
