import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function mockWindow(pathname: string) {
  const dataLayer: unknown[] = [];
  vi.stubGlobal("window", {
    location: { pathname, href: `https://3dboxstudio.com${pathname}` },
    dataLayer,
  });
  return dataLayer;
}

describe("trackEvent admin exclusion", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST123");
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_DEBUG", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sends nothing on /admin", async () => {
    const dataLayer = mockWindow("/admin");
    const { trackEvent } = await import("@/lib/analytics/core");
    const logSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    trackEvent("studio_open", { entry_point: "direct" });

    expect(dataLayer).toHaveLength(0);
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("sends nothing on /admin/users", async () => {
    const dataLayer = mockWindow("/admin/users");
    const { trackEvent } = await import("@/lib/analytics/core");
    const logSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    trackEvent("export_completed", { export_format: "png" });

    expect(dataLayer).toHaveLength(0);
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("sends on permitted public paths", async () => {
    const dataLayer = mockWindow("/studio");
    const { trackEvent } = await import("@/lib/analytics/core");
    const logSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    trackEvent("studio_open", { entry_point: "homepage" });

    expect(dataLayer).toHaveLength(1);
    expect(dataLayer[0]).toEqual([
      "event",
      "studio_open",
      { entry_point: "homepage" },
    ]);
    expect(logSpy).toHaveBeenCalledOnce();
  });
});
