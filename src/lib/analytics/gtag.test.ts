import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildGtagConfigOptions, buildGtagInitScript } from "@/lib/analytics/gtag";

describe("gtag initialization", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("disables automatic page_view at config time", () => {
    const script = buildGtagInitScript("G-TEST", buildGtagConfigOptions(false));
    expect(script).toContain('"send_page_view":false');
    expect(script).not.toContain("debug_mode");
  });

  it("enables debug_mode when debug mode is on", () => {
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
  it("gtag config prevents automatic initial page_view; explicit tracker owns pageviews", () => {
    const script = buildGtagInitScript("G-TEST", { sendPageView: false, debugMode: false });
    const configCount = (script.match(/gtag\('config'/g) ?? []).length;
    expect(configCount).toBe(1);
    expect(script).toContain('"send_page_view":false');
  });
});
