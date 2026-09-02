/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetGtagForTesting } from "@/lib/analytics/gtag";

type GtagWindow = Window & {
  dataLayer?: IArguments[];
  gtag?: (...args: unknown[]) => void;
};

function asGtagWindow(win: Window = window): GtagWindow {
  return win as GtagWindow;
}

function dataLayerCommand(entry: unknown): unknown[] {
  if (entry && typeof entry === "object" && "length" in entry) {
    return Array.from(entry as ArrayLike<unknown>);
  }
  return [];
}

describe("gtag browser integration", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST123");
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_DEBUG", "false");
    resetGtagForTesting();
    delete asGtagWindow().dataLayer;
    delete asGtagWindow().gtag;
    window.history.replaceState({}, "", "/studio");
  });

  afterEach(() => {
    resetGtagForTesting();
    vi.unstubAllEnvs();
  });

  it("uses the Google-compatible arguments queue and orders init before events", async () => {
    const { trackEvent } = await import("@/lib/analytics/core");
    const { trackPageView } = await import("@/lib/analytics/pageview");
    const { trackExportClicked, trackExportCompleted } = await import("@/lib/analytics/events");

    trackPageView("/studio");
    expect(asGtagWindow().gtag).toBeTypeOf("function");
    trackEvent("studio_open", { entry_point: "homepage" });
    trackExportClicked("png", "viewport", { userStatus: "signed_in" });
    trackExportCompleted("png", "viewport", { userStatus: "signed_in" });

    const dataLayer = asGtagWindow().dataLayer ?? [];
    const commands = dataLayer.map((entry) => dataLayerCommand(entry));

    expect(commands[0][0]).toBe("js");
    expect(commands[1][0]).toBe("config");
    expect(commands[1][1]).toBe("G-TEST123");
    expect(commands[1][2]).toMatchObject({ send_page_view: false });

    const eventNames = commands.filter((cmd) => cmd[0] === "event").map((cmd) => cmd[1]);
    expect(eventNames).toEqual(["page_view", "studio_open", "export_clicked", "export_completed"]);

    const pageView = commands.find((cmd) => cmd[0] === "event" && cmd[1] === "page_view");
    expect(pageView?.[2]).toMatchObject({
      page_path: "/studio",
      page_location: expect.stringContaining("/studio"),
    });

    const configCommands = commands.filter((cmd) => cmd[0] === "config");
    expect(configCommands).toHaveLength(1);
  });

  it("does not enqueue events on admin routes", async () => {
    window.history.replaceState({}, "", "/admin/users");
    const { trackEvent } = await import("@/lib/analytics/core");
    const { trackPageView } = await import("@/lib/analytics/pageview");

    trackPageView("/admin/users");
    trackEvent("export_completed", { export_format: "png" });

    expect(asGtagWindow().dataLayer).toBeUndefined();
    expect(asGtagWindow().gtag).toBeUndefined();
  });

  it("calls window.gtag directly with discrete arguments for export events", async () => {
    const { ensureGtagInitialized } = await import("@/lib/analytics/gtag");
    ensureGtagInitialized();
    const win = asGtagWindow();
    const baseGtag = win.gtag!;
    const gtagSpy = vi.fn((...args: unknown[]) => baseGtag(...args));
    win.gtag = gtagSpy;

    const { trackExportClicked, trackExportCompleted } = await import("@/lib/analytics/events");

    trackExportClicked("png", "viewport", { userStatus: "guest" });
    trackExportCompleted("png", "viewport", { userStatus: "guest" });

    const exportCalls = gtagSpy.mock.calls.filter((call) => call[0] === "event");
    expect(exportCalls).toHaveLength(2);
    expect(exportCalls[0]).toEqual([
      "event",
      "export_clicked",
      expect.objectContaining({ export_format: "png", user_status: "guest" }),
    ]);
    expect(exportCalls[1]).toEqual([
      "event",
      "export_completed",
      expect.objectContaining({ export_format: "png", user_status: "guest" }),
    ]);
  });
});
