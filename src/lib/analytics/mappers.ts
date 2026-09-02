import type { FaceId } from "@/types";
import { BOX_TEMPLATES } from "@/boxTemplates";
import type {
  BoxType,
  ExportFormat,
  FileSizeBucket,
  PageType,
  SourcePageType,
  StudioEntryPoint,
  TemplateType,
  UploadSurface,
} from "./types";

const TEMPLATE_IDS = new Set(BOX_TEMPLATES.map((t) => t.id));

export function sanitizeTemplateType(id: string): TemplateType {
  if (id === "custom" || TEMPLATE_IDS.has(id)) {
    return id as TemplateType;
  }
  return "custom";
}

export function sanitizeBoxType(templateId: string): BoxType {
  return sanitizeTemplateType(templateId);
}

export function faceToUploadSurface(face: FaceId): UploadSurface {
  switch (face) {
    case "front":
    case "back":
    case "left":
    case "right":
    case "top":
    case "bottom":
      return face;
    default:
      return "other";
  }
}

export function fileTypeFromMime(mime: string): string {
  const normalized = mime.toLowerCase();
  if (normalized.includes("png")) return "png";
  if (normalized.includes("jpeg") || normalized.includes("jpg")) return "jpg";
  if (normalized.includes("webp")) return "webp";
  if (normalized.includes("gif")) return "gif";
  if (normalized.includes("svg")) return "svg";
  return "other";
}

export function fileSizeBucket(bytes: number): FileSizeBucket {
  if (bytes < 100 * 1024) return "under_100kb";
  if (bytes < 500 * 1024) return "100kb_500kb";
  if (bytes < 1024 * 1024) return "500kb_1mb";
  if (bytes <= 4 * 1024 * 1024) return "1mb_4mb";
  return "over_4mb";
}

export function pathnameToPageType(pathname: string): PageType {
  const path = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  if (path === "/") return "homepage";
  if (path === "/studio" || path.startsWith("/studio/")) return "studio";
  if (path === "/blog") return "blog";
  if (path.startsWith("/blog/")) return "guide";
  if (path === "/faq" || path === "/contact") return "landing";
  if (path.startsWith("/preview/")) return "studio";
  if (path === "/privacy" || path === "/terms") return "other";
  return "other";
}

export function pathnameToSourcePageType(pathname: string): SourcePageType {
  const path = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  if (path === "/") return "homepage";
  if (path === "/blog") return "blog";
  if (path.startsWith("/blog/")) return "guide";
  if (path === "/faq" || path === "/contact") return "landing_page";
  return "other";
}

export function pathnameToEntryPoint(pathname: string): StudioEntryPoint {
  const source = pathnameToSourcePageType(pathname);
  switch (source) {
    case "homepage":
      return "homepage";
    case "blog":
      return "blog";
    case "guide":
      return "guide";
    case "template":
      return "template_page";
    case "landing_page":
      return "other";
    default:
      return "other";
  }
}

export function slugFromPath(pathname: string): string | null {
  const path = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  if (path.startsWith("/blog/")) {
    const slug = path.slice("/blog/".length).split("/")[0]?.trim();
    return slug || null;
  }
  return null;
}

export function videoFormatFromMime(mime: string): ExportFormat {
  return mime.includes("mp4") ? "mp4" : "webm";
}
