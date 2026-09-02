import { describe, expect, it } from "vitest";
import { shouldFireStudioOpen } from "@/lib/analytics/studioOpen";

const ready = {
  showAuthGate: false,
  authLoading: false,
  sessionReady: true,
};

describe("shouldFireStudioOpen", () => {
  it("fires once per Studio mount and again after remount (Studio → leave → Studio)", () => {
    expect(shouldFireStudioOpen({ ...ready, alreadyTrackedThisMount: false })).toBe(true);
    expect(shouldFireStudioOpen({ ...ready, alreadyTrackedThisMount: true })).toBe(false);

    // Remount after navigating away — guard resets.
    expect(shouldFireStudioOpen({ ...ready, alreadyTrackedThisMount: false })).toBe(true);
  });

  it("does not fire during auth loading or on the auth gate", () => {
    expect(
      shouldFireStudioOpen({ ...ready, alreadyTrackedThisMount: false, authLoading: true })
    ).toBe(false);
    expect(
      shouldFireStudioOpen({ ...ready, alreadyTrackedThisMount: false, showAuthGate: true })
    ).toBe(false);
  });
});
