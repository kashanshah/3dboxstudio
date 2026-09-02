import { describe, expect, it } from "vitest";
import {
  buildPathKey,
  clearRouteOnLeave,
  createRouteTrackerState,
  markRouteEventsEmitted,
  shouldEmitRouteEvents,
} from "@/lib/analytics/routeTracking";

describe("route tracking deduplication", () => {
  it("emits once per navigation and again on return visits (A → B → A)", () => {
    let state = createRouteTrackerState();
    const pathA = buildPathKey("/blog/article", "");
    const pathB = buildPathKey("/studio", "");

    expect(shouldEmitRouteEvents(state, pathA)).toBe(true);
    state = markRouteEventsEmitted(state, pathA);

    expect(shouldEmitRouteEvents(state, pathA)).toBe(false);

    state = clearRouteOnLeave(state, pathA);
    expect(shouldEmitRouteEvents(state, pathB)).toBe(true);
    state = markRouteEventsEmitted(state, pathB);
    state = clearRouteOnLeave(state, pathB);

    expect(shouldEmitRouteEvents(state, pathA)).toBe(true);
  });

  it("does not duplicate within the same navigation (Strict Mode simulation)", () => {
    let state = createRouteTrackerState();
    const pathKey = buildPathKey("/", "");

    expect(shouldEmitRouteEvents(state, pathKey)).toBe(true);
    state = markRouteEventsEmitted(state, pathKey);

    // Second pass for the same navigation before leaving — suppressed.
    expect(shouldEmitRouteEvents(state, pathKey)).toBe(false);
  });
});
