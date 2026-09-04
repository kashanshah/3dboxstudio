import { describe, expect, it } from "vitest";
import {
  applyFaceCrop,
  applySourceToFaces,
  artworkPersistencePlan,
  changingOneFaceLeavesOthersUnchanged,
  clearAllFaceArtwork,
  clearFaceArtwork,
  emptyFaceArtworkState,
  sourceForFace,
} from "./faceArtworkState";
import { coverCropPercent, createSideImagePlacement } from "./faceImageCrop";
import type { SourceImageRecord } from "./sourceImages";
import type { BoxDimensions } from "@/types";

function fakeFile(name: string): File {
  return { name, size: 128, type: "image/jpeg" } as File;
}

function source(id: string, file = fakeFile(`${id}.jpg`)): SourceImageRecord {
  return {
    id,
    file,
    originalFileName: `${id}.jpg`,
    mimeType: "image/jpeg",
    naturalWidth: 2000,
    naturalHeight: 1000,
    fileSize: 128,
  };
}

const dims: BoxDimensions = { width: 24, height: 10, length: 16 };

describe("face artwork state", () => {
  it("opens a crop assignment only after apply, and cancel leaves state unchanged", () => {
    const before = emptyFaceArtworkState();
    const afterCancel = before;
    expect(afterCancel).toEqual(before);
    expect(afterCancel.faceFiles.front).toBeUndefined();
  });

  it("applies a crop to one face and keeps the original source image", () => {
    const src = source("dieline");
    const placement = createSideImagePlacement(
      src.id,
      coverCropPercent(src.naturalWidth, src.naturalHeight, 24 / 10),
      24 / 10,
      1.8
    );
    const next = applyFaceCrop(emptyFaceArtworkState(), "front", src, placement);
    expect(next.faceFiles.front).toBe(src.file);
    expect(next.sourceImages.dieline.file).toBe(src.file);
    expect(next.faceImagePlacements.front?.zoom).toBe(1.8);
    expect(next.sourceImages.dieline.naturalWidth).toBe(2000);
  });

  it("reuses one source on many faces with independent crops", () => {
    const src = source("dieline");
    const assigned = applySourceToFaces(emptyFaceArtworkState(), src, ["front", "back", "left"], { dims });
    expect(assigned.faceFiles.front).toBe(src.file);
    expect(assigned.faceFiles.back).toBe(src.file);
    expect(assigned.faceFiles.left).toBe(src.file);
    expect(Object.keys(assigned.sourceImages)).toEqual(["dieline"]);
    expect(assigned.faceImagePlacements.front?.aspectRatio).toBeCloseTo(24 / 10);
    expect(assigned.faceImagePlacements.left?.aspectRatio).toBeCloseTo(16 / 10);
    expect(assigned.faceImagePlacements.front?.crop).not.toEqual(assigned.faceImagePlacements.left?.crop);

    const customFront = applyFaceCrop(
      assigned,
      "front",
      src,
      createSideImagePlacement(src.id, { x: 12, y: 8, width: 30, height: 18, unit: "percent" }, 2.4, 2.5, 15)
    );
    const appliedToAll = applySourceToFaces(customFront, src, ["front", "back", "left"], { dims }, "front");
    expect(appliedToAll.faceImagePlacements.front?.crop).toEqual(customFront.faceImagePlacements.front?.crop);
    expect(appliedToAll.faceImagePlacements.back?.crop).toEqual(customFront.faceImagePlacements.front?.crop);
    expect(appliedToAll.faceImagePlacements.left?.crop).toEqual(customFront.faceImagePlacements.front?.crop);
    expect(appliedToAll.faceImagePlacements.back?.zoom).toBe(2.5);
    expect(appliedToAll.faceImagePlacements.left?.rotation).toBe(15);

    const frontEdit = applyFaceCrop(
      assigned,
      "front",
      src,
      createSideImagePlacement(src.id, { x: 5, y: 5, width: 20, height: 10, unit: "percent" }, 2.4, 3)
    );
    expect(changingOneFaceLeavesOthersUnchanged(assigned, frontEdit, "front")).toBe(true);
    expect(frontEdit.faceImagePlacements.back).toEqual(assigned.faceImagePlacements.back);
    expect(frontEdit.faceImagePlacements.front?.zoom).toBe(3);
  });

  it("reset uses the intended cover crop for the face ratio", () => {
    const src = source("dieline");
    const reset = coverCropPercent(src.naturalWidth, src.naturalHeight, 24 / 10);
    expect(reset.width).toBe(100);
    expect(reset.height).toBeCloseTo((2 / 2.4) * 100);
  });

  it("does not keep a source after every referencing face is cleared", () => {
    const src = source("dieline");
    const assigned = applySourceToFaces(emptyFaceArtworkState(), src, ["front", "back"], { dims });
    const clearedFront = clearFaceArtwork(assigned, "front");
    expect(clearedFront.sourceImages.dieline).toBeDefined();
    const clearedAll = clearFaceArtwork(clearedFront, "back");
    expect(clearedAll.sourceImages.dieline).toBeUndefined();
    expect(clearAllFaceArtwork()).toEqual(emptyFaceArtworkState());
  });

  it("stores the original once when the same image is used on every side", () => {
    const src = source("dieline");
    const assigned = applySourceToFaces(
      emptyFaceArtworkState(),
      src,
      ["front", "back", "left", "right", "top", "bottom"],
      { dims }
    );
    const plan = artworkPersistencePlan(assigned);
    expect(plan.sourceIds).toEqual(["dieline"]);
    expect(plan.placedFaces).toHaveLength(6);
    expect(plan.legacyFaces).toHaveLength(0);
  });

  it("keeps mixed legacy and cropped sides in one project", () => {
    const src = source("dieline");
    const legacyFile = fakeFile("old-front.png");
    const mixed = applyFaceCrop(
      {
        sourceImages: {},
        faceFiles: { back: legacyFile },
        faceImagePlacements: {},
      },
      "front",
      src,
      createSideImagePlacement(src.id, { x: 0, y: 0, width: 40, height: 40, unit: "percent" }, 2.4)
    );
    const plan = artworkPersistencePlan(mixed);
    expect(plan.sourceIds).toEqual(["dieline"]);
    expect(plan.placedFaces).toEqual(["front"]);
    expect(plan.legacyFaces).toEqual(["back"]);
    expect(mixed.faceFiles.back).toBe(legacyFile);
    expect(mixed.faceImagePlacements.back).toBeUndefined();
  });

  it("resolves a missing source without inventing crop data", () => {
    const state = {
      sourceImages: {},
      faceFiles: {},
      faceImagePlacements: {
        front: createSideImagePlacement("missing", { x: 0, y: 0, width: 100, height: 100, unit: "percent" }, 1),
      },
    };
    expect(sourceForFace(state, "front")).toBeNull();
    expect(artworkPersistencePlan(state).placedFaces).toEqual([]);
  });
});
