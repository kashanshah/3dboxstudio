import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { trackEventMock } = vi.hoisted(() => ({
  trackEventMock: vi.fn(),
}));

vi.mock("@/lib/analytics/core", async () => {
  const actual = await vi.importActual<typeof import("@/lib/analytics/core")>("@/lib/analytics/core");
  return {
    ...actual,
    trackEvent: trackEventMock,
  };
});

import {
  beginTrackedDesignSession,
  trackDesignStarted,
  trackProjectReopened,
  trackStudioError,
} from "@/lib/analytics/events";
import {
  markDesignStarted,
  markProjectReopenedOnce,
  markStudioErrorOnce,
  resetAnalyticsDedupeForTesting,
  resetDesignSession,
  STUDIO_ERROR_COOLDOWN_MS_EXPORT,
} from "@/lib/analytics/session";

function createStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

beforeEach(() => {
  vi.stubGlobal("window", {
    location: { pathname: "/studio", href: "https://www.3dboxstudio.com/studio" },
  });
  vi.stubGlobal("localStorage", createStorage());
  vi.stubGlobal("sessionStorage", createStorage());
  trackEventMock.mockClear();
  resetAnalyticsDedupeForTesting();
  resetDesignSession();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("design_started Strict Mode / rerender safety", () => {
  it("beginTrackedDesignSession fires once under Strict Mode double-invoke", () => {
    beginTrackedDesignSession({ userStatus: "guest" });
    beginTrackedDesignSession({ userStatus: "guest" });
    expect(trackEventMock.mock.calls.filter((c) => c[0] === "design_started")).toHaveLength(1);
  });

  it("markDesignStarted returns false on duplicate without reset (rerender / Strict Mode)", () => {
    expect(markDesignStarted()).toBe(true);
    expect(markDesignStarted()).toBe(false);
    expect(markDesignStarted()).toBe(false);
  });

  it("does not treat template/auth-style repeated trackDesignStarted as new events", () => {
    trackDesignStarted({ userStatus: "signed_in", templateType: "mailer" });
    trackDesignStarted({ userStatus: "signed_in", templateType: "cube" });
    trackDesignStarted({ userStatus: "signed_in_unverified", templateType: "cube" });
    expect(trackEventMock.mock.calls.filter((c) => c[0] === "design_started")).toHaveLength(1);
  });
});

describe("project_reopened Strict Mode / sync safety", () => {
  it("dedupes identical project keys within the short window", () => {
    trackProjectReopened({ userStatus: "signed_in" }, "share_abc");
    trackProjectReopened({ userStatus: "signed_in" }, "share_abc");
    trackProjectReopened({ userStatus: "signed_in" }, "share_abc");
    expect(trackEventMock.mock.calls.filter((c) => c[0] === "project_reopened")).toHaveLength(1);
  });

  it("allows a different project immediately", () => {
    trackProjectReopened({ userStatus: "signed_in" }, "share_a");
    trackProjectReopened({ userStatus: "signed_in" }, "share_b");
    expect(trackEventMock.mock.calls.filter((c) => c[0] === "project_reopened")).toHaveLength(2);
  });

  it("allows reopening the same project after the dedupe window", () => {
    vi.useFakeTimers();
    expect(markProjectReopenedOnce("share_x")).toBe(true);
    expect(markProjectReopenedOnce("share_x")).toBe(false);
    vi.advanceTimersByTime(3_001);
    expect(markProjectReopenedOnce("share_x")).toBe(true);
  });

  it("does not fire design_started when only project_reopened is tracked", () => {
    trackProjectReopened({ userStatus: "signed_in" }, "share_only");
    expect(trackEventMock.mock.calls.map((c) => c[0])).toEqual(["project_reopened"]);
  });
});

describe("studio_error cooldown", () => {
  it("rate-limits identical category+stage pairs", () => {
    trackStudioError("cloud_save_failed", "other");
    trackStudioError("cloud_save_failed", "other");
    trackStudioError("cloud_save_failed", "other");
    expect(trackEventMock.mock.calls.filter((c) => c[0] === "studio_error")).toHaveLength(1);
  });

  it("allows a different category during the cooldown", () => {
    trackStudioError("cloud_save_failed", "other");
    trackStudioError("cloud_load_failed", "studio_load");
    expect(trackEventMock.mock.calls.filter((c) => c[0] === "studio_error")).toHaveLength(2);
  });

  it("emits again after the cooldown elapses", () => {
    vi.useFakeTimers();
    const t0 = Date.now();
    expect(markStudioErrorOnce("export_failed", "export", t0)).toBe(true);
    expect(markStudioErrorOnce("export_failed", "export", t0 + 1_000)).toBe(false);
    expect(
      markStudioErrorOnce("export_failed", "export", t0 + STUDIO_ERROR_COOLDOWN_MS_EXPORT + 1)
    ).toBe(true);
  });
});
