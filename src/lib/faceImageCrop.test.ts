import { describe, expect, it } from "vitest";
import {
  clampCrop,
  coverCropPercent,
  createSideImagePlacement,
  cropToPixelRect,
  cropToTextureTransform,
  parseSideImagePlacement,
} from "./faceImageCrop";

describe("clampCrop", () => {
  it("clamps invalid or out-of-bounds crop data", () => {
    expect(clampCrop({ x: -20, y: 90, width: 50, height: 50, unit: "percent" })).toEqual({
      x: 0,
      y: 50,
      width: 50,
      height: 50,
      unit: "percent",
    });
    expect(clampCrop({ x: 0, y: 0, width: 0, height: -4, unit: "percent" }).width).toBeGreaterThan(0);
    expect(clampCrop(null).width).toBe(100);
  });
});

describe("coverCropPercent", () => {
  it("fits portrait, landscape, and square targets without stretching", () => {
    const landscapeOnPortrait = coverCropPercent(2000, 1000, 10 / 24);
    expect(landscapeOnPortrait.height).toBe(100);
    expect(landscapeOnPortrait.width).toBeCloseTo((10 / 24 / 2) * 100);

    const portraitOnLandscape = coverCropPercent(1000, 2000, 24 / 10);
    expect(portraitOnLandscape.width).toBe(100);
    expect(portraitOnLandscape.height).toBeCloseTo((0.5 / 2.4) * 100);

    const square = coverCropPercent(1000, 1000, 1);
    expect(square).toEqual({ x: 0, y: 0, width: 100, height: 100, unit: "percent" });
  });
});

describe("cropToPixelRect", () => {
  it("converts percent crops to natural-image pixels for export", () => {
    expect(cropToPixelRect({ x: 25, y: 10, width: 50, height: 40, unit: "percent" }, 2000, 1000)).toEqual({
      x: 500,
      y: 100,
      width: 1000,
      height: 400,
    });
  });
});

describe("cropToTextureTransform", () => {
  it("maps a full image with no crop using legacy UVs", () => {
    const t = cropToTextureTransform(null, 90);
    expect(t.repeatX).toBe(1);
    expect(t.repeatY).toBe(1);
    expect(t.offsetX).toBe(0);
    expect(t.offsetY).toBe(0);
    expect(t.rotationRad).toBeCloseTo(Math.PI / 2);
  });

  it("maps a percent crop through flipY so the 3D preview matches the editor", () => {
    const t = cropToTextureTransform({ x: 20, y: 10, width: 40, height: 50, unit: "percent" }, 0);
    expect(t.repeatX).toBeCloseTo(0.4);
    expect(t.repeatY).toBeCloseTo(0.5);
    expect(t.offsetX).toBeCloseTo(0.2 + 0.2 - 0.5);
    expect(t.offsetY).toBeCloseTo(0.4 + 0.25 - 0.5);
  });
});

describe("parseSideImagePlacement", () => {
  it("accepts valid placements and rejects incomplete crop metadata", () => {
    const valid = parseSideImagePlacement({
      sourceImageId: "src-1",
      crop: { x: 10, y: 10, width: 40, height: 40, unit: "percent" },
      zoom: 1.4,
      rotation: 0,
      aspectRatio: 1.2,
    });
    expect(valid?.sourceImageId).toBe("src-1");
    expect(valid?.zoom).toBe(1.4);

    expect(parseSideImagePlacement({ sourceImageId: "src-1" })).toBeNull();
    expect(parseSideImagePlacement({ crop: { x: 0, y: 0, width: 100, height: 100, unit: "percent" } })).toBeNull();
  });

  it("builds a restorable placement for Crop / Edit", () => {
    const placement = createSideImagePlacement(
      "src-1",
      { x: 10, y: 15, width: 30, height: 20, unit: "percent" },
      1.5,
      2.25,
      15
    );
    expect(placement).toMatchObject({
      sourceImageId: "src-1",
      zoom: 2.25,
      rotation: 15,
      aspectRatio: 1.5,
    });
    expect(placement.crop).toEqual({ x: 10, y: 15, width: 30, height: 20, unit: "percent" });
  });
});
