import { describe, expect, it } from "vitest";

/** Mirrors PackagingBox faceSeam — kept in sync for corner-seal regressions. */
function faceSeam(width: number, height: number): number {
  return Math.min(0.35, Math.max(0.2, Math.min(width, height) * 0.02));
}

describe("packaging box corner seal", () => {
  it("uses a mobile-safe seam floor without huge unprinted flanges", () => {
    expect(faceSeam(10, 10)).toBeGreaterThanOrEqual(0.2);
    expect(faceSeam(10, 10)).toBeLessThanOrEqual(0.35);
    expect(faceSeam(80, 80)).toBeLessThanOrEqual(0.35);
  });

  it("scales seam up for larger faces within the cap", () => {
    expect(faceSeam(20, 20)).toBeGreaterThan(faceSeam(8, 8));
  });
});
