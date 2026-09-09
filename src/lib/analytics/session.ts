/**
 * In-memory + sessionStorage guards for per-design-session milestone events.
 * Prevents duplicate fires from React Strict Mode, rerenders, and hydration.
 */

const STORAGE_PREFIX = "sb_analytics_";

type MilestoneStore = {
  designStarted: boolean;
  customization: Set<string>;
  designSessionId: string;
};

let memoryStore: MilestoneStore | null = null;

/** Short-window dedupe for project_reopened (Strict Mode + effect storms). */
let lastReopenedKey: string | null = null;
let lastReopenedAt = 0;
const REOPEN_DEDUPE_MS = 3000;

/** Suppresses Strict Mode double-invoke of beginTrackedDesignSession. */
let lastDesignSessionClaimAt = 0;
const DESIGN_SESSION_CLAIM_MS = 100;

/** Cooldown for studio_error so autosave/load loops cannot spam the same failure. */
const studioErrorLastAt = new Map<string, number>();
const STUDIO_ERROR_COOLDOWN_MS = 10_000;

function readStore(): MilestoneStore {
  if (memoryStore) return memoryStore;

  if (typeof window === "undefined") {
    memoryStore = {
      designStarted: false,
      customization: new Set(),
      designSessionId: "ssr",
    };
    return memoryStore;
  }

  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}milestones`);
    if (raw) {
      const parsed = JSON.parse(raw) as {
        designStarted?: boolean;
        customization?: string[];
        designSessionId?: string;
      };
      memoryStore = {
        designStarted: Boolean(parsed.designStarted),
        customization: new Set(parsed.customization ?? []),
        designSessionId: parsed.designSessionId ?? createDesignSessionId(),
      };
      return memoryStore;
    }
  } catch {
    /* ignore corrupt storage */
  }

  memoryStore = {
    designStarted: false,
    customization: new Set(),
    designSessionId: createDesignSessionId(),
  };
  persistStore(memoryStore);
  return memoryStore;
}

function persistStore(store: MilestoneStore): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      `${STORAGE_PREFIX}milestones`,
      JSON.stringify({
        designStarted: store.designStarted,
        customization: [...store.customization],
        designSessionId: store.designSessionId,
      })
    );
  } catch {
    /* quota or private mode */
  }
}

function createDesignSessionId(): string {
  return `ds_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Start a new design-session milestone window (customization + design_started). */
export function resetDesignSession(): void {
  const store = readStore();
  store.designStarted = false;
  store.customization = new Set();
  store.designSessionId = createDesignSessionId();
  persistStore(store);
}

/**
 * Returns true the first time in the current design session.
 * Safe under Strict Mode double-invokes that do not call resetDesignSession().
 */
export function markDesignStarted(): boolean {
  const store = readStore();
  if (store.designStarted) return false;
  store.designStarted = true;
  persistStore(store);
  return true;
}

/**
 * Claim a new design session and mark design_started.
 * Strict Mode double-invokes within DESIGN_SESSION_CLAIM_MS do not reset again
 * (second call becomes a no-op via markDesignStarted).
 */
export function claimNewDesignSession(): boolean {
  const now = Date.now();
  if (now - lastDesignSessionClaimAt < DESIGN_SESSION_CLAIM_MS) {
    return markDesignStarted();
  }
  lastDesignSessionClaimAt = now;
  resetDesignSession();
  return markDesignStarted();
}

/**
 * Fresh internal design-session window for an opened existing project.
 * Resets customization category dedupe and rotates designSessionId, but marks
 * design_started as already satisfied so `design_started` will not emit.
 */
export function resetExistingDesignSession(): void {
  const store = readStore();
  store.designStarted = true;
  store.customization = new Set();
  store.designSessionId = createDesignSessionId();
  persistStore(store);
}

/**
 * Prepare milestones for an opened existing project without emitting design_started.
 * Returns false when the projectKey was recently opened (Strict Mode / effect storm).
 */
export function claimReopenedDesignSession(projectKey: string): boolean {
  if (!markProjectReopenedOnce(projectKey)) return false;
  resetExistingDesignSession();
  return true;
}

export function markCustomization(category: string): boolean {
  const store = readStore();
  if (store.customization.has(category)) return false;
  store.customization.add(category);
  persistStore(store);
  return true;
}

/**
 * Returns true when this project open should emit `project_reopened`.
 * Dedupes identical keys within a short window (Strict Mode + effect re-entry).
 * A later intentional open of the same project (after the window) still emits.
 */
export function markProjectReopenedOnce(projectKey: string): boolean {
  const key = projectKey.trim();
  if (!key) return false;
  const now = Date.now();
  if (lastReopenedKey === key && now - lastReopenedAt < REOPEN_DEDUPE_MS) {
    return false;
  }
  lastReopenedKey = key;
  lastReopenedAt = now;
  return true;
}

/**
 * Returns true when this studio_error should be sent.
 * Same category+stage is rate-limited so continuous autosave/load failures
 * do not flood GA4.
 */
export function markStudioErrorOnce(
  errorCategory: string,
  stage: string,
  now = Date.now()
): boolean {
  const key = `${errorCategory}:${stage}`;
  const last = studioErrorLastAt.get(key) ?? 0;
  if (now - last < STUDIO_ERROR_COOLDOWN_MS) return false;
  studioErrorLastAt.set(key, now);
  return true;
}

/** Test helper — clears in-memory dedupe clocks. */
export function resetAnalyticsDedupeForTesting(): void {
  lastReopenedKey = null;
  lastReopenedAt = 0;
  lastDesignSessionClaimAt = 0;
  studioErrorLastAt.clear();
  memoryStore = null;
}

const FIRST_EXPORT_KEY = `${STORAGE_PREFIX}has_exported`;

export function markFirstExport(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem(FIRST_EXPORT_KEY) === "1") return false;
    localStorage.setItem(FIRST_EXPORT_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

export function hasExportedBefore(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(FIRST_EXPORT_KEY) === "1";
  } catch {
    return false;
  }
}

export const PROJECT_REOPEN_DEDUPE_MS = REOPEN_DEDUPE_MS;
export const STUDIO_ERROR_COOLDOWN_MS_EXPORT = STUDIO_ERROR_COOLDOWN_MS;
