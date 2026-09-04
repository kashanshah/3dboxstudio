export type SideImageCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
  unit: "percent";
};

export type SideImagePlacement = {
  sourceImageId: string;
  crop: SideImageCrop;
  zoom: number;
  rotation?: number;
  aspectRatio: number;
};

export type TextureCropTransform = {
  offsetX: number;
  offsetY: number;
  repeatX: number;
  repeatY: number;
  centerX: number;
  centerY: number;
  rotationRad: number;
};

const MIN_CROP_PERCENT = 0.01;

function finiteOr(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function clamp01Percent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

/** Clamp a percent-space crop so it stays inside the image. */
export function clampCrop(crop: SideImageCrop | null | undefined): SideImageCrop {
  const width = Math.min(100, Math.max(MIN_CROP_PERCENT, finiteOr(crop?.width, 100)));
  const height = Math.min(100, Math.max(MIN_CROP_PERCENT, finiteOr(crop?.height, 100)));
  const x = Math.min(100 - width, Math.max(0, finiteOr(crop?.x, 0)));
  const y = Math.min(100 - height, Math.max(0, finiteOr(crop?.y, 0)));
  return { x, y, width, height, unit: "percent" };
}

export function isValidCrop(crop: unknown): crop is SideImageCrop {
  if (!crop || typeof crop !== "object") return false;
  const c = crop as SideImageCrop;
  return (
    c.unit === "percent" &&
    Number.isFinite(c.x) &&
    Number.isFinite(c.y) &&
    Number.isFinite(c.width) &&
    Number.isFinite(c.height) &&
    c.width > 0 &&
    c.height > 0
  );
}

/**
 * Largest centered rectangle of `aspectRatio` that fits inside the image.
 * This is the default "cover" crop: fill the face without stretching.
 */
export function coverCropPercent(
  naturalWidth: number,
  naturalHeight: number,
  aspectRatio: number
): SideImageCrop {
  const imgW = naturalWidth > 0 ? naturalWidth : 1;
  const imgH = naturalHeight > 0 ? naturalHeight : 1;
  const target = aspectRatio > 0 && Number.isFinite(aspectRatio) ? aspectRatio : 1;
  const imageAspect = imgW / imgH;

  if (imageAspect > target) {
    const width = (target / imageAspect) * 100;
    return clampCrop({ x: (100 - width) / 2, y: 0, width, height: 100, unit: "percent" });
  }

  const height = (imageAspect / target) * 100;
  return clampCrop({ x: 0, y: (100 - height) / 2, width: 100, height, unit: "percent" });
}

export function defaultZoom(): number {
  return 1;
}

export function clampZoom(zoom: unknown): number {
  const n = finiteOr(zoom, 1);
  return Math.min(8, Math.max(1, n));
}

export function clampRotationDeg(rotation: unknown): number {
  const n = finiteOr(rotation, 0);
  const wrapped = ((n % 360) + 360) % 360;
  return wrapped;
}

export function createSideImagePlacement(
  sourceImageId: string,
  crop: SideImageCrop,
  aspectRatio: number,
  zoom = 1,
  rotation = 0
): SideImagePlacement {
  return {
    sourceImageId,
    crop: clampCrop(crop),
    zoom: clampZoom(zoom),
    rotation: clampRotationDeg(rotation),
    aspectRatio: aspectRatio > 0 && Number.isFinite(aspectRatio) ? aspectRatio : 1,
  };
}

export type PixelRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Convert a persisted percent crop to natural-image pixel coordinates. */
export function cropToPixelRect(
  crop: SideImageCrop,
  naturalWidth: number,
  naturalHeight: number
): PixelRect {
  const c = clampCrop(crop);
  const imgW = Math.max(1, naturalWidth);
  const imgH = Math.max(1, naturalHeight);
  const x = Math.round((c.x / 100) * imgW);
  const y = Math.round((c.y / 100) * imgH);
  const width = Math.round((c.width / 100) * imgW);
  const height = Math.round((c.height / 100) * imgH);
  return {
    x: Math.min(Math.max(0, x), imgW - 1),
    y: Math.min(Math.max(0, y), imgH - 1),
    width: Math.min(Math.max(1, width), imgW - x),
    height: Math.min(Math.max(1, height), imgH - y),
  };
}

/**
 * Three.js UV transform that maps a face onto `crop` (image space, top-left origin),
 * then rotates the cropped result around the face center.
 *
 * Three.js textures are flipY by default, so image +Y (down) becomes UV +V (up).
 */
export function cropToTextureTransform(
  crop: SideImageCrop | null | undefined,
  rotationDeg = 0
): TextureCropTransform {
  const rotationRad = (clampRotationDeg(rotationDeg) * Math.PI) / 180;

  if (!crop) {
    return {
      offsetX: 0,
      offsetY: 0,
      repeatX: 1,
      repeatY: 1,
      centerX: 0.5,
      centerY: 0.5,
      rotationRad,
    };
  }

  const c = clampCrop(crop);
  const x = c.x / 100;
  const y = c.y / 100;
  const w = c.width / 100;
  const h = c.height / 100;
  const uvY = 1 - y - h;

  return {
    offsetX: x + w / 2 - 0.5,
    offsetY: uvY + h / 2 - 0.5,
    repeatX: w,
    repeatY: h,
    centerX: 0.5,
    centerY: 0.5,
    rotationRad,
  };
}

export function parseSideImagePlacement(raw: unknown): SideImagePlacement | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  if (typeof rec.sourceImageId !== "string" || !rec.sourceImageId) return null;
  if (!isValidCrop(rec.crop)) return null;
  const aspectRatio = finiteOr(rec.aspectRatio, 0);
  if (!(aspectRatio > 0)) return null;
  return createSideImagePlacement(
    rec.sourceImageId,
    rec.crop,
    aspectRatio,
    clampZoom(rec.zoom),
    clampRotationDeg(rec.rotation)
  );
}

export function placementsEqual(
  a: SideImagePlacement | null | undefined,
  b: SideImagePlacement | null | undefined
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.sourceImageId === b.sourceImageId &&
    a.zoom === b.zoom &&
    (a.rotation ?? 0) === (b.rotation ?? 0) &&
    a.aspectRatio === b.aspectRatio &&
    a.crop.x === b.crop.x &&
    a.crop.y === b.crop.y &&
    a.crop.width === b.crop.width &&
    a.crop.height === b.crop.height
  );
}
