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
  buildTemplateSelectedParams,
  trackArtworkUploaded,
  trackDesignCustomized,
  trackDesignStarted,
  trackExportClicked,
  trackExportCompleted,
  trackExportFailed,
  trackProjectReopened,
  trackProjectSaved,
  trackSignup,
  trackStudioOpen,
  trackTemplateSelected,
} from "@/lib/analytics/events";
import { pathnameToLocale } from "@/lib/analytics/mappers";
import { resetDesignSession } from "@/lib/analytics/session";

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

function createBrowserWindow(pathname: string) {
  return {
    location: { pathname, href: `https://www.3dboxstudio.com${pathname}` },
  };
}

beforeEach(() => {
  vi.stubGlobal("window", createBrowserWindow("/fr/studio"));
  vi.stubGlobal("document", { referrer: "" });
  vi.stubGlobal("localStorage", createStorage());
  vi.stubGlobal("sessionStorage", createStorage());
  trackEventMock.mockClear();
  localStorage.clear();
  sessionStorage.clear();
  resetDesignSession();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("pathnameToLocale", () => {
  it("maps supported locale-prefixed paths and defaults English to en", () => {
    expect(pathnameToLocale("/")).toBe("en");
    expect(pathnameToLocale("/studio")).toBe("en");
    expect(pathnameToLocale("/es/studio")).toBe("es");
    expect(pathnameToLocale("/fr/blog")).toBe("fr");
    expect(pathnameToLocale("/de")).toBe("de");
    expect(pathnameToLocale("/zh/contact")).toBe("zh");
  });
});

describe("buildTemplateSelectedParams", () => {
  it("records the newly selected template, not stale React state", () => {
    const params = buildTemplateSelectedParams("mailer", {
      templateType: "cube",
      boxType: "cube",
      userStatus: "signed_in",
    });

    expect(params.template_type).toBe("mailer");
    expect(params.template_name).toBe("mailer");
    expect(params.box_type).toBe("mailer");
    expect(params.user_status).toBe("signed_in");
    expect(params.locale).toBe("fr");
  });

  it("changing from template A to template B records template B", () => {
    const fromA = buildTemplateSelectedParams("cube", {
      templateType: "custom",
      boxType: "custom",
    });
    expect(fromA.template_type).toBe("cube");

    const fromB = buildTemplateSelectedParams("mailer", {
      templateType: "cube",
      boxType: "cube",
    });
    expect(fromB.template_type).toBe("mailer");
    expect(fromB.box_type).toBe("mailer");
  });
});

describe("analytics locale propagation", () => {
  it("adds locale to signup and Studio conversion events without changing event names", () => {
    trackSignup({ method: "email", landingPage: "/fr", conversionPage: "/fr/studio" });
    trackStudioOpen({ userStatus: "guest" });
    trackDesignStarted({ userStatus: "guest" });
    trackTemplateSelected("mailer", { userStatus: "signed_in" });
    trackArtworkUploaded(
      "front",
      { type: "image/png", size: 5 } as File,
      undefined,
      { userStatus: "signed_in" },
    );
    trackDesignCustomized("artwork", { userStatus: "signed_in" });
    trackExportClicked("png", "viewport", { userStatus: "signed_in" });
    trackExportCompleted("png", "viewport", { userStatus: "signed_in" });
    trackExportFailed("png", "download_failed", { userStatus: "signed_in" });
    trackProjectSaved({ userStatus: "signed_in" });
    trackProjectReopened({ userStatus: "signed_in" });

    const names = trackEventMock.mock.calls.map((call) => call[0]);
    expect(names).toEqual([
      "sign_up",
      "studio_open",
      "design_started",
      "template_selected",
      "artwork_uploaded",
      "design_customized",
      "export_clicked",
      "export_completed",
      "export_failed",
      "project_saved",
      "project_reopened",
    ]);

    for (const [, params] of trackEventMock.mock.calls) {
      expect(params).toEqual(expect.objectContaining({ locale: "fr" }));
    }
  });

  it("defaults locale to en on non-prefixed routes", () => {
    vi.stubGlobal("window", createBrowserWindow("/studio"));

    trackSignup({ method: "google" });
    trackProjectSaved({ userStatus: "guest" });

    expect(trackEventMock.mock.calls[0]).toEqual([
      "sign_up",
      expect.objectContaining({ method: "google", locale: "en" }),
    ]);
    expect(trackEventMock.mock.calls[1]).toEqual([
      "project_saved",
      expect.objectContaining({ user_status: "guest", locale: "en" }),
    ]);
  });
});
