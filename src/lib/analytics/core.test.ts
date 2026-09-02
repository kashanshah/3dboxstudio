import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function dataLayerCommand(entry: unknown): unknown[] {
  if (entry && typeof entry === "object" && "length" in entry) {
    return Array.from(entry as ArrayLike<unknown>);
  }
  return [];
}

function createBrowserWindow(pathname: string) {
  const dataLayer: IArguments[] = [];
  return {
    location: { pathname, href: `https://3dboxstudio.com${pathname}` },
    dataLayer,
  };
}

describe("trackEvent admin exclusion", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST123");
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_DEBUG", "true");
  });

  afterEach(async () => {
    const { resetGtagForTesting } = await import("@/lib/analytics/gtag");
    resetGtagForTesting();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sends nothing on /admin", async () => {
    vi.stubGlobal("window", createBrowserWindow("/admin"));
    const { trackEvent } = await import("@/lib/analytics/core");
    const logSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    trackEvent("studio_open", { entry_point: "direct" });

    expect((window as Window & { dataLayer?: IArguments[] }).dataLayer).toHaveLength(0);
    expect((window as Window & { gtag?: unknown }).gtag).toBeUndefined();
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("sends nothing on /admin/users", async () => {
    vi.stubGlobal("window", createBrowserWindow("/admin/users"));
    const { trackEvent } = await import("@/lib/analytics/core");
    const logSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    trackEvent("export_completed", { export_format: "png" });

    expect((window as Window & { dataLayer?: IArguments[] }).dataLayer).toHaveLength(0);
    expect((window as Window & { gtag?: unknown }).gtag).toBeUndefined();
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("routes permitted events through window.gtag with three arguments", async () => {
    const win = createBrowserWindow("/studio");
    vi.stubGlobal("window", win);
    const { trackEvent } = await import("@/lib/analytics/core");
    const logSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    trackEvent("studio_open", { entry_point: "homepage" });

    const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
    expect(gtag).toBeTypeOf("function");

    const eventEntries = win.dataLayer.filter((entry) => dataLayerCommand(entry)[0] === "event");
    expect(eventEntries).toHaveLength(1);
    expect(dataLayerCommand(eventEntries[0])).toEqual([
      "event",
      "studio_open",
      { entry_point: "homepage" },
    ]);

    const initEntries = win.dataLayer.filter((entry) => {
      const cmd = dataLayerCommand(entry)[0];
      return cmd === "js" || cmd === "config";
    });
    expect(initEntries).toHaveLength(2);
    expect(logSpy).toHaveBeenCalledOnce();
  });
});
