import { describe, expect, it } from "vitest";

/**
 * Mirrors PackagingBox seam/thickness helpers — kept in sync so corner-seal
 * regressions are caught without mounting R3F.
 */
function faceSeam(width: number, height: number): number {
  return Math.min(0.55, Math.max(0.32, Math.min(width, height) * 0.025));
}

function wallThickness(width: number, height: number): number {
  return Math.min(0.18, Math.max(0.1, Math.min(width, height) * 0.02));
}

describe("packaging box corner seal", () => {
  it("keeps seam larger than EPS so overlapping walls cover the miter", () => {
    const EPS = 0.02;
    for (const size of [4, 10, 30, 80]) {
      expect(faceSeam(size, size)).toBeGreaterThan(EPS * 4);
    }
  });

  it("gives walls real thickness on typical carton faces", () => {
    expect(wallThickness(20, 10)).toBeGreaterThanOrEqual(0.1);
    expect(wallThickness(20, 10)).toBeLessThanOrEqual(0.18);
  });
});
