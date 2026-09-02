import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function dataLayerCommand(entry: unknown): unknown[] {
  if (entry && typeof entry === "object" && "length" in entry) {
    return Array.from(entry as ArrayLike<unknown>);
  }
  return [];
}

describe("gtag initialization", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("disables automatic page_view at config time", async () => {
    const { buildGtagInitScript, buildGtagConfigOptions } = await import("@/lib/analytics/gtag");
    const script = buildGtagInitScript("G-TEST", buildGtagConfigOptions(false));
    expect(script).toContain('"send_page_view":false');
    expect(script).not.toContain("debug_mode");
    expect(script).toContain("window.gtag = window.gtag || function(){");
    expect(script).toContain(".push(arguments);");
  });

  it("enables debug_mode when debug mode is on", async () => {
    const { buildGtagInitScript, buildGtagConfigOptions } = await import("@/lib/analytics/gtag");
    const script = buildGtagInitScript("G-TEST", buildGtagConfigOptions(true));
    expect(script).toContain('"send_page_view":false');
    expect(script).toContain('"debug_mode":true');
  });
});

describe("GA_ENABLED policy", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not enable GA in development without debug flag", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST");
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_DEBUG", "");

    const { GA_ENABLED } = await import("@/lib/analytics/policy");
    expect(GA_ENABLED).toBe(false);
  });

  it("enables GA in development when NEXT_PUBLIC_ANALYTICS_DEBUG=true", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST");
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_DEBUG", "true");

    const { GA_ENABLED } = await import("@/lib/analytics/policy");
    expect(GA_ENABLED).toBe(true);
  });
});

describe("initial page_view control", () => {
  it("gtag config prevents automatic initial page_view; explicit tracker owns pageviews", async () => {
    const { buildGtagInitScript } = await import("@/lib/analytics/gtag");
    const script = buildGtagInitScript("G-TEST", { sendPageView: false, debugMode: false });
    const configCount = (script.match(/gtag\('config'/g) ?? []).length;
    expect(configCount).toBe(1);
    expect(script).toContain('"send_page_view":false');
  });
});

describe("pushGtag stub behavior", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST123");
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_DEBUG", "");
    vi.stubEnv("NODE_ENV", "production");
  });

  afterEach(async () => {
    const { resetGtagForTesting } = await import("@/lib/analytics/gtag");
    resetGtagForTesting();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("calls window.gtag with separate arguments, not dataLayer.push(array)", async () => {
    const dataLayer: IArguments[] = [];
    vi.stubGlobal("window", {
      location: { pathname: "/studio", href: "https://3dboxstudio.com/studio" },
      dataLayer,
    });

    const { pushGtag } = await import("@/lib/analytics/gtag");
    pushGtag("event", "studio_open", { entry_point: "direct" });

    expect((window as Window & { gtag?: (...args: unknown[]) => void }).gtag).toBeTypeOf("function");
    expect(dataLayer).toHaveLength(3);
    expect(dataLayerCommand(dataLayer[0])[0]).toBe("js");
    expect(dataLayerCommand(dataLayer[1])[0]).toBe("config");
    expect(dataLayerCommand(dataLayer[2])).toEqual([
      "event",
      "studio_open",
      { entry_point: "direct" },
    ]);
  });

  it("queues initialization before the first event", async () => {
    const dataLayer: IArguments[] = [];
    vi.stubGlobal("window", {
      location: { pathname: "/", href: "https://3dboxstudio.com/" },
      dataLayer,
    });

    const { pushGtag } = await import("@/lib/analytics/gtag");
    pushGtag("event", "page_view", { page_path: "/" });

    expect(dataLayer).toHaveLength(3);
    expect(dataLayerCommand(dataLayer[0])[0]).toBe("js");
    expect(dataLayerCommand(dataLayer[1])[0]).toBe("config");
    expect(dataLayerCommand(dataLayer[2])).toEqual(["event", "page_view", { page_path: "/" }]);
  });

  it("initializes only once when called repeatedly", async () => {
    const dataLayer: IArguments[] = [];
    vi.stubGlobal("window", {
      location: { pathname: "/", href: "https://3dboxstudio.com/" },
      dataLayer,
    });

    const { ensureGtagInitialized, pushGtag } = await import("@/lib/analytics/gtag");
    ensureGtagInitialized("G-TEST123");
    ensureGtagInitialized("G-TEST123");
    pushGtag("event", "studio_open", { entry_point: "direct" });

    const configEntries = dataLayer.filter((entry) => dataLayerCommand(entry)[0] === "config");
    const jsEntries = dataLayer.filter((entry) => dataLayerCommand(entry)[0] === "js");

    expect(jsEntries).toHaveLength(1);
    expect(configEntries).toHaveLength(1);
  });
});
