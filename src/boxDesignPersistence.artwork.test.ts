import { describe, expect, it } from "vitest";
import {
  parseDesignJsonV1,
  parseFaceImagePlacements,
  parseSourceImages,
} from "./boxDesignPersistence";
import { cropToPixelRect } from "./lib/faceImageCrop";

const legacyJson = JSON.stringify({
  v: 1,
  unit: "cm",
  dims: { width: 24, height: 10, length: 16 },
  materialId: "matte-white",
  opening: "closed",
  splitTopHingeSide: "side_a",
  openT: 0.35,
  wireframe: false,
  showGrid: true,
  showAxesGizmo: true,
  autoRotate: false,
  autoRotateSpeed: 0.65,
  autoRotateReverse: false,
  zoomFraction: 0.5,
  envPreset: "studio",
  textureRotationDeg: { front: 90 },
  faceImages: {
    front: { name: "front.png", mime: "image/png", base64: "ZmFrZQ==" },
    back: { name: "back.png", mime: "image/png", base64: "YmFjaw==" },
  },
});

const croppedJson = JSON.stringify({
  v: 1,
  unit: "cm",
  dims: { width: 24, height: 10, length: 16 },
  materialId: "matte-white",
  opening: "closed",
  splitTopHingeSide: "side_a",
  openT: 0.35,
  wireframe: false,
  showGrid: true,
  showAxesGizmo: true,
  autoRotate: false,
  autoRotateSpeed: 0.65,
  autoRotateReverse: false,
  zoomFraction: 0.5,
  envPreset: "studio",
  textureRotationDeg: {},
  faceImages: {
    left: { name: "legacy-left.png", mime: "image/png", base64: "bGVmdA==" },
  },
  sourceImages: {
    dieline: {
      id: "dieline",
      name: "pack.jpg",
      mime: "image/jpeg",
      base64: "ZGllbGluZQ==",
      naturalWidth: 4000,
      naturalHeight: 2000,
    },
  },
  faceImagePlacements: {
    front: {
      sourceImageId: "dieline",
      crop: { x: 10, y: 5, width: 20, height: 15, unit: "percent" },
      zoom: 2,
      rotation: 0,
      aspectRatio: 2.4,
    },
    back: {
      sourceImageId: "dieline",
      crop: { x: 60, y: 40, width: 25, height: 20, unit: "percent" },
      zoom: 1.2,
      rotation: 0,
      aspectRatio: 2.4,
    },
  },
});

describe("legacy design compatibility", () => {
  it("loads designs that have only faceImages and no crop metadata", () => {
    const parsed = parseDesignJsonV1(legacyJson);
    expect(parsed).not.toBeNull();
    expect(parsed?.faceImages.front?.name).toBe("front.png");
    expect(parsed?.faceImages.back?.base64).toBe("YmFjaw==");
    expect(parsed?.sourceImages).toEqual({});
    expect(parsed?.faceImagePlacements).toEqual({});
    expect(parsed?.textureRotationDeg.front).toBe(90);
  });

  it("does not invent crop data when saving a legacy-shaped payload back through parse", () => {
    const parsed = parseDesignJsonV1(legacyJson);
    expect(parsed?.faceImagePlacements).toEqual({});
    expect(Object.keys(parsed?.sourceImages ?? {})).toHaveLength(0);
  });
});

describe("cropped design persistence", () => {
  it("preserves one source image and independent crops across save/load", () => {
    const parsed = parseDesignJsonV1(croppedJson);
    expect(Object.keys(parsed?.sourceImages ?? {})).toEqual(["dieline"]);
    expect(parsed?.sourceImages?.dieline.base64).toBe("ZGllbGluZQ==");
    expect(parsed?.faceImagePlacements?.front?.crop).toEqual({
      x: 10,
      y: 5,
      width: 20,
      height: 15,
      unit: "percent",
    });
    expect(parsed?.faceImagePlacements?.back?.crop.x).toBe(60);
    expect(parsed?.faceImagePlacements?.front?.sourceImageId).toBe(
      parsed?.faceImagePlacements?.back?.sourceImageId
    );
    expect(parsed?.faceImages.left?.name).toBe("legacy-left.png");
    expect(parsed?.faceImages.front).toBeUndefined();
  });

  it("drops invalid crop entries and missing source references instead of writing unrestorable metadata", () => {
    expect(parseFaceImagePlacements({ front: { sourceImageId: "x" } })).toEqual({});
    expect(parseSourceImages({ broken: { id: "broken", name: "a.jpg", mime: "image/jpeg" } })).toEqual({});
  });

  it("exports from the saved crop and full-resolution source, not a preview thumbnail", () => {
    const parsed = parseDesignJsonV1(croppedJson);
    const crop = parsed?.faceImagePlacements?.front?.crop;
    const source = parsed?.sourceImages?.dieline;
    expect(crop && source).toBeTruthy();
    expect(cropToPixelRect(crop!, source!.naturalWidth, source!.naturalHeight)).toEqual({
      x: 400,
      y: 100,
      width: 800,
      height: 300,
    });
    expect(source?.naturalWidth).toBe(4000);
  });
});
