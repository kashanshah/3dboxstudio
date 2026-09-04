import { describe, expect, it } from "vitest";
import { formatBytes, formatUsd } from "./formatBytes";

describe("formatBytes", () => {
  it("formats zero and invalid values", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(-1)).toBe("0 B");
    expect(formatBytes(Number.NaN)).toBe("0 B");
  });

  it("picks the nearest unit", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.50 KB");
    expect(formatBytes(10 * 1024)).toBe("10.0 KB");
    expect(formatBytes(1024 * 1024)).toBe("1.00 MB");
  });
});

describe("formatUsd", () => {
  it("formats currency and tiny amounts", () => {
    expect(formatUsd(0)).toBe("$0.00");
    expect(formatUsd(0.004)).toBe("<$0.01");
    expect(formatUsd(1.23)).toBe("$1.23");
  });
});
