import { describe, expect, it } from "vitest";
import { getFaceAspectRatio, getFaceEffectiveSize } from "./faceAspectRatio";
import type { BoxDimensions } from "@/types";

const dims: BoxDimensions = { width: 24, height: 10, length: 16 };

describe("getFaceEffectiveSize", () => {
  it("uses configured box dimensions, not a UI preview size", () => {
    expect(getFaceEffectiveSize("front", { dims })).toEqual({
      width: 24,
      height: 10,
      aspectRatio: 24 / 10,
    });
  });

  it("returns landscape, portrait, and square ratios from side dimensions", () => {
    expect(getFaceAspectRatio("front", { dims })).toBeCloseTo(2.4);
    expect(getFaceAspectRatio("left", { dims })).toBeCloseTo(1.6);
    expect(getFaceAspectRatio("top", { dims })).toBeCloseTo(1.5);
    expect(getFaceAspectRatio("front", { dims: { width: 10, height: 24, length: 16 } })).toBeCloseTo(10 / 24);
    expect(getFaceAspectRatio("front", { dims: { width: 12, height: 12, length: 8 } })).toBe(1);
  });

  it("uses half-width or half-depth for oriented split-top flaps", () => {
    expect(getFaceEffectiveSize("topLeft", { dims, splitTopHingeSide: "side_a" })).toEqual({
      width: 12,
      height: 16,
      aspectRatio: 12 / 16,
    });
    expect(getFaceEffectiveSize("topRight", { dims, splitTopHingeSide: "side_b" })).toEqual({
      width: 24,
      height: 8,
      aspectRatio: 24 / 8,
    });
  });

  it("falls back to 1:1 when dimensions are missing or zero", () => {
    expect(getFaceEffectiveSize("front", { dims: { width: 0, height: 0, length: 0 } })).toEqual({
      width: 1,
      height: 1,
      aspectRatio: 1,
    });
  });
});
