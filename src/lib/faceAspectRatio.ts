import type { BoxDimensions, FaceId, SplitTopHingeSide } from "@/types";

export type FaceSizeContext = {
  dims: BoxDimensions;
  splitTopHingeSide?: SplitTopHingeSide;
};

export type FaceEffectiveSize = {
  width: number;
  height: number;
  aspectRatio: number;
};

function positiveDimension(n: unknown, fallback = 1): number {
  const value = typeof n === "number" ? n : Number(n);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/**
 * Effective panel size after opening/orientation rules.
 *
 * Uses configured box dimensions, not the on-screen preview element.
 * Mesh placement rotations do not swap these axes; a 90° artwork rotation
 * is applied after the crop and does not change the panel rectangle.
 */
export function getFaceEffectiveSize(faceId: FaceId, ctx: FaceSizeContext): FaceEffectiveSize {
  const width = positiveDimension(ctx.dims.width);
  const height = positiveDimension(ctx.dims.height);
  const depth = positiveDimension(ctx.dims.length);

  let size: { width: number; height: number };
  switch (faceId) {
    case "front":
    case "back":
      size = { width, height };
      break;
    case "left":
    case "right":
      size = { width: depth, height };
      break;
    case "top":
    case "bottom":
      size = { width, height: depth };
      break;
    case "topLeft":
    case "topRight":
      size =
        ctx.splitTopHingeSide === "side_b"
          ? { width, height: depth / 2 }
          : { width: width / 2, height: depth };
      break;
    default: {
      const _exhaustive: never = faceId;
      void _exhaustive;
      size = { width: 1, height: 1 };
    }
  }

  return {
    ...size,
    aspectRatio: size.width / size.height,
  };
}

export function getFaceAspectRatio(faceId: FaceId, ctx: FaceSizeContext): number {
  return getFaceEffectiveSize(faceId, ctx).aspectRatio;
}
