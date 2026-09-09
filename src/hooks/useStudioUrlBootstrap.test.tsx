/**
 * @vitest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRef, useState } from "react";
import { useStudioUrlBootstrap } from "@/hooks/useStudioUrlBootstrap";
import { resetUrlBootstrapCacheForTesting } from "@/lib/studioUrlBootstrap";
import {
  beginReopenedDesignSession,
  beginTrackedDesignSession,
} from "@/lib/analytics/events";
import {
  PROJECT_REOPEN_DEDUPE_MS,
  resetAnalyticsDedupeForTesting,
  resetDesignSession,
} from "@/lib/analytics/session";

const { trackEventMock } = vi.hoisted(() => ({
  trackEventMock: vi.fn(),
}));

vi.mock("@/lib/analytics/core", async () => {
  const actual = await vi.importActual<typeof import("@/lib/analytics/core")>(
    "@/lib/analytics/core"
  );
  return { ...actual, trackEvent: trackEventMock };
});

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
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { pathname: "/studio", href: "https://www.3dboxstudio.com/studio" },
  });
  vi.stubGlobal("localStorage", createStorage());
  vi.stubGlobal("sessionStorage", createStorage());
  resetUrlBootstrapCacheForTesting();
  resetAnalyticsDedupeForTesting();
  resetDesignSession();
  trackEventMock.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

type BootstrapHarness = {
  sessionReady: boolean;
  loads: number;
};

describe("useStudioUrlBootstrap Strict Mode", () => {
  it("share bootstrap: one load, one project_reopened, sessionReady true", async () => {
    let loads = 0;
    const loadShareById = vi.fn(async (shareId: string) => {
      loads += 1;
      await new Promise((r) => setTimeout(r, 30));
      beginReopenedDesignSession({ userStatus: "guest" }, shareId);
      return true;
    });

    const { result } = renderHook(
      () => {
        const [sessionReady, setSessionReady] = useState(false);
        const docRef = useRef({
          loadShareById,
          loadShareByPreviewToken: vi.fn(),
          showStatus: vi.fn(),
          markClean: vi.fn(),
        });
        useStudioUrlBootstrap({
          shareIdFromUrl: "share_1",
          previewTokenFromUrl: null,
          docRef,
          sharedOpenedMessage: "opened",
          sharedLoadFailedMessage: "failed",
          previewOpenedMessage: "preview",
          previewLoadFailedMessage: "preview-failed",
          onCloudLoadFailed: vi.fn(),
          onSettled: () => setSessionReady(true),
        });
        return { sessionReady, loads } satisfies BootstrapHarness;
      },
      { reactStrictMode: true }
    );

    await waitFor(() => expect(result.current.sessionReady).toBe(true));
    expect(loads).toBe(1);
    expect(loadShareById).toHaveBeenCalledTimes(1);
    expect(trackEventMock.mock.calls.filter((c) => c[0] === "project_reopened")).toHaveLength(1);
    expect(trackEventMock.mock.calls.filter((c) => c[0] === "design_started")).toHaveLength(0);
  });

  it("preview bootstrap: one load under Strict Mode and settles sessionReady", async () => {
    let loads = 0;
    const loadShareByPreviewToken = vi.fn(async (token: string) => {
      loads += 1;
      await new Promise((r) => setTimeout(r, 20));
      beginReopenedDesignSession({ userStatus: "guest" }, `preview:${token}`);
      return true;
    });

    const { result } = renderHook(
      () => {
        const [sessionReady, setSessionReady] = useState(false);
        const docRef = useRef({
          loadShareById: vi.fn(),
          loadShareByPreviewToken,
          showStatus: vi.fn(),
          markClean: vi.fn(),
        });
        useStudioUrlBootstrap({
          shareIdFromUrl: null,
          previewTokenFromUrl: "prev_tok",
          docRef,
          sharedOpenedMessage: "opened",
          sharedLoadFailedMessage: "failed",
          previewOpenedMessage: "preview-ok",
          previewLoadFailedMessage: "preview-failed",
          onCloudLoadFailed: vi.fn(),
          onSettled: () => setSessionReady(true),
        });
        return { sessionReady, loads } satisfies BootstrapHarness;
      },
      { reactStrictMode: true }
    );

    await waitFor(() => expect(result.current.sessionReady).toBe(true));
    expect(loads).toBe(1);
    expect(trackEventMock.mock.calls.filter((c) => c[0] === "project_reopened")).toHaveLength(1);
    expect(trackEventMock.mock.calls.filter((c) => c[0] === "design_started")).toHaveLength(0);
  });

  it("retries after failure when the effect re-runs for the same share id", async () => {
    let attempt = 0;
    const loadShareById = vi.fn(async () => {
      attempt += 1;
      await new Promise((r) => setTimeout(r, 10));
      if (attempt === 1) throw new Error("boom");
      beginReopenedDesignSession({ userStatus: "guest" }, "share_retry");
      return true;
    });
    const onCloudLoadFailed = vi.fn();

    const { result, unmount } = renderHook(
      ({ enabled }: { enabled: boolean }) => {
        const [sessionReady, setSessionReady] = useState(false);
        const docRef = useRef({
          loadShareById,
          loadShareByPreviewToken: vi.fn(),
          showStatus: vi.fn(),
          markClean: vi.fn(),
        });
        useStudioUrlBootstrap({
          shareIdFromUrl: enabled ? "share_retry" : null,
          previewTokenFromUrl: null,
          docRef,
          sharedOpenedMessage: "opened",
          sharedLoadFailedMessage: "failed",
          previewOpenedMessage: "preview",
          previewLoadFailedMessage: "preview-failed",
          onCloudLoadFailed,
          onSettled: () => setSessionReady(true),
        });
        return sessionReady;
      },
      { initialProps: { enabled: true }, reactStrictMode: true }
    );

    await waitFor(() => expect(result.current).toBe(true));
    expect(onCloudLoadFailed).toHaveBeenCalled();
    expect(attempt).toBe(1);

    // Remount with the same share id — failed key was cleared, so load retries.
    unmount();
    resetAnalyticsDedupeForTesting();
    trackEventMock.mockClear();

    const second = renderHook(
      () => {
        const [sessionReady, setSessionReady] = useState(false);
        const docRef = useRef({
          loadShareById,
          loadShareByPreviewToken: vi.fn(),
          showStatus: vi.fn(),
          markClean: vi.fn(),
        });
        useStudioUrlBootstrap({
          shareIdFromUrl: "share_retry",
          previewTokenFromUrl: null,
          docRef,
          sharedOpenedMessage: "opened",
          sharedLoadFailedMessage: "failed",
          previewOpenedMessage: "preview",
          previewLoadFailedMessage: "preview-failed",
          onCloudLoadFailed: vi.fn(),
          onSettled: () => setSessionReady(true),
        });
        return sessionReady;
      },
      { reactStrictMode: true }
    );

    await waitFor(() => expect(second.result.current).toBe(true));
    expect(attempt).toBe(2);
    expect(trackEventMock.mock.calls.filter((c) => c[0] === "project_reopened")).toHaveLength(1);
    second.unmount();
  });

  it("does not leave sessionReady false when the first Strict Mode effect is cancelled", async () => {
    let resolveLoad!: () => void;
    const loadGate = new Promise<void>((resolve) => {
      resolveLoad = resolve;
    });
    const loadShareById = vi.fn(async () => {
      await loadGate;
      beginReopenedDesignSession({ userStatus: "guest" }, "share_strict");
      return true;
    });

    const { result } = renderHook(
      () => {
        const [sessionReady, setSessionReady] = useState(false);
        const docRef = useRef({
          loadShareById,
          loadShareByPreviewToken: vi.fn(),
          showStatus: vi.fn(),
          markClean: vi.fn(),
        });
        useStudioUrlBootstrap({
          shareIdFromUrl: "share_strict",
          previewTokenFromUrl: null,
          docRef,
          sharedOpenedMessage: "opened",
          sharedLoadFailedMessage: "failed",
          previewOpenedMessage: "preview",
          previewLoadFailedMessage: "preview-failed",
          onCloudLoadFailed: vi.fn(),
          onSettled: () => setSessionReady(true),
        });
        return sessionReady;
      },
      { reactStrictMode: true }
    );

    // Let Strict Mode remount while the shared in-flight promise is still pending.
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current).toBe(false);

    await act(async () => {
      resolveLoad();
    });
    await waitFor(() => expect(result.current).toBe(true));
    expect(loadShareById).toHaveBeenCalledTimes(1);
  });

  it("unmount and remount with the same ID loads again and emits project_reopened per re-entry", async () => {
    let loads = 0;
    const loadShareById = vi.fn(async (shareId: string) => {
      loads += 1;
      await new Promise((r) => setTimeout(r, 15));
      beginReopenedDesignSession({ userStatus: "guest" }, shareId);
      return true;
    });

    const first = renderHook(
      () => {
        const [sessionReady, setSessionReady] = useState(false);
        const docRef = useRef({
          loadShareById,
          loadShareByPreviewToken: vi.fn(),
          showStatus: vi.fn(),
          markClean: vi.fn(),
        });
        useStudioUrlBootstrap({
          shareIdFromUrl: "share_reentry",
          previewTokenFromUrl: null,
          docRef,
          sharedOpenedMessage: "opened",
          sharedLoadFailedMessage: "failed",
          previewOpenedMessage: "preview",
          previewLoadFailedMessage: "preview-failed",
          onCloudLoadFailed: vi.fn(),
          onSettled: () => setSessionReady(true),
        });
        return sessionReady;
      },
      { reactStrictMode: true }
    );

    await waitFor(() => expect(first.result.current).toBe(true));
    expect(loads).toBe(1);
    expect(trackEventMock.mock.calls.filter((c) => c[0] === "project_reopened")).toHaveLength(1);
    first.unmount();

    // Past reopen dedupe window — genuine SPA return to /studio/A.
    const base = Date.now();
    const dateNow = vi.spyOn(Date, "now").mockImplementation(() => base + PROJECT_REOPEN_DEDUPE_MS + 50);
    trackEventMock.mockClear();

    const second = renderHook(
      () => {
        const [sessionReady, setSessionReady] = useState(false);
        const docRef = useRef({
          loadShareById,
          loadShareByPreviewToken: vi.fn(),
          showStatus: vi.fn(),
          markClean: vi.fn(),
        });
        useStudioUrlBootstrap({
          shareIdFromUrl: "share_reentry",
          previewTokenFromUrl: null,
          docRef,
          sharedOpenedMessage: "opened",
          sharedLoadFailedMessage: "failed",
          previewOpenedMessage: "preview",
          previewLoadFailedMessage: "preview-failed",
          onCloudLoadFailed: vi.fn(),
          onSettled: () => setSessionReady(true),
        });
        return sessionReady;
      },
      { reactStrictMode: true }
    );

    await waitFor(() => expect(second.result.current).toBe(true));
    expect(loads).toBe(2);
    expect(loadShareById).toHaveBeenCalledTimes(2);
    expect(trackEventMock.mock.calls.filter((c) => c[0] === "project_reopened")).toHaveLength(1);
    expect(trackEventMock.mock.calls.filter((c) => c[0] === "design_started")).toHaveLength(0);
    second.unmount();
    dateNow.mockRestore();
  });
});

describe("reopen vs new design session (hook-level contracts)", () => {
  it("reopening does not emit design_started; new session does", () => {
    beginReopenedDesignSession({ userStatus: "signed_in" }, "proj_a");
    expect(trackEventMock.mock.calls.map((c) => c[0])).toEqual(["project_reopened"]);

    beginTrackedDesignSession({ userStatus: "signed_in" });
    expect(trackEventMock.mock.calls.filter((c) => c[0] === "design_started")).toHaveLength(1);
  });
});
