/** Pure route-tracking helpers (page_view + page_context deduplication). */

export function buildPathKey(pathname: string, search: string): string {
  const query = search.trim();
  return query ? `${pathname}?${query}` : pathname;
}

export type RouteTrackerState = {
  /** Path key emitted for the current in-flight navigation. */
  lastEmittedKey: string | null;
};

export function createRouteTrackerState(): RouteTrackerState {
  return { lastEmittedKey: null };
}

/** Returns true when this navigation should emit route events. */
export function shouldEmitRouteEvents(state: RouteTrackerState, pathKey: string): boolean {
  return state.lastEmittedKey !== pathKey;
}

export function markRouteEventsEmitted(_state: RouteTrackerState, pathKey: string): RouteTrackerState {
  return { lastEmittedKey: pathKey };
}

/** Called when leaving a route so a later return visit can emit again. */
export function clearRouteOnLeave(state: RouteTrackerState, pathKey: string): RouteTrackerState {
  if (state.lastEmittedKey !== pathKey) return state;
  return { lastEmittedKey: null };
}
