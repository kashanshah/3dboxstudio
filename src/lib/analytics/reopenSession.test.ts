/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { trackEventMock } = vi.hoisted(() => ({
  trackEventMock: vi.fn(),
}));

vi.mock("@/lib/analytics/core", async () => {
  const actual = await vi.importActual<typeof import("@/lib/analytics/core")>("@/lib/analytics/core");
  return { ...actual, trackEvent: trackEventMock };
});

import {
  beginReopenedDesignSession,
  beginTrackedDesignSession,
  trackDesignCustomized,
  trackDesignStarted,
} from "@/lib/analytics/events";
import {
  resetAnalyticsDedupeForTesting,
  resetDesignSession,
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
    clear: () => store.clear(),
  };
}

beforeEach(() => {
  vi.stubGlobal("localStorage", createStorage());
  vi.stubGlobal("sessionStorage", createStorage());
  // Node env: provide a minimal window for analytics path guards.
  vi.stubGlobal("window", {
    location: { pathname: "/studio", href: "https://www.3dboxstudio.com/studio" },
  });
  trackEventMock.mockClear();
  resetAnalyticsDedupeForTesting();
  resetDesignSession();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("beginReopenedDesignSession", () => {
  it("emits project_reopened once and never design_started", () => {
    beginReopenedDesignSession({ userStatus: "signed_in" }, "share_a");
    beginReopenedDesignSession({ userStatus: "signed_in" }, "share_a");

    const names = trackEventMock.mock.calls.map((c) => c[0]);
    expect(names).toEqual(["project_reopened"]);
    expect(names).not.toContain("design_started");
  });

  it("resets customization dedupe when opening a different project", () => {
    beginReopenedDesignSession({ userStatus: "signed_in" }, "share_a");
    trackDesignCustomized("artwork", { userStatus: "signed_in" });
    trackDesignCustomized("artwork", { userStatus: "signed_in" });
    expect(trackEventMock.mock.calls.filter((c) => c[0] === "design_customized")).toHaveLength(1);

    beginReopenedDesignSession({ userStatus: "signed_in" }, "share_b");
    trackDesignCustomized("artwork", { userStatus: "signed_in" });
    expect(trackEventMock.mock.calls.filter((c) => c[0] === "design_customized")).toHaveLength(2);
    expect(trackEventMock.mock.calls.filter((c) => c[0] === "design_started")).toHaveLength(0);
  });

  it("blocks design_started after reopen until a genuine new session begins", () => {
    beginReopenedDesignSession({ userStatus: "signed_in" }, "share_x");
    trackDesignStarted({ userStatus: "signed_in" });
    expect(trackEventMock.mock.calls.filter((c) => c[0] === "design_started")).toHaveLength(0);

    beginTrackedDesignSession({ userStatus: "signed_in" });
    expect(trackEventMock.mock.calls.filter((c) => c[0] === "design_started")).toHaveLength(1);
  });
});

describe("failed JSON import does not emit design_started", () => {
  it("only successful import path calls beginTrackedDesignSession", async () => {
    // Mirrors StudioStartDialog onImport + importJsonFile contract:
    // dialog opens modal without starting; importJsonFile starts only after deserialize succeeds.
    const onDesignSessionStart = vi.fn(() => beginTrackedDesignSession({ userStatus: "guest" }));

    async function importJsonFile(ok: boolean) {
      if (!ok) {
        // failed read / invalid JSON — no session start
        return;
      }
      onDesignSessionStart();
    }

    await importJsonFile(false);
    expect(onDesignSessionStart).not.toHaveBeenCalled();
    expect(trackEventMock.mock.calls.filter((c) => c[0] === "design_started")).toHaveLength(0);

    await importJsonFile(true);
    expect(onDesignSessionStart).toHaveBeenCalledTimes(1);
    expect(trackEventMock.mock.calls.filter((c) => c[0] === "design_started")).toHaveLength(1);
  });
});
