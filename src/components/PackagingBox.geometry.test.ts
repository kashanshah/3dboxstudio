import { describe, expect, it } from "vitest";
import { shouldUseSolidShell } from "@/components/PackagingBox";

describe("packaging box solid shell", () => {
  it("uses a solid shell when opening is closed", () => {
    expect(shouldUseSolidShell("closed", 0.35)).toBe(true);
    expect(shouldUseSolidShell("closed", 0)).toBe(true);
  });

  it("uses a solid shell when open amount is effectively zero", () => {
    expect(shouldUseSolidShell("lid_from_back", 0)).toBe(true);
    expect(shouldUseSolidShell("lid_from_back", 0.0005)).toBe(true);
  });

  it("uses hinged planes when the lid/doors are open", () => {
    expect(shouldUseSolidShell("lid_from_back", 0.35)).toBe(false);
    expect(shouldUseSolidShell("double_doors", 0.5)).toBe(false);
  });
});
