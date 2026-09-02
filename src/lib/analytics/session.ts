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

export function resetDesignSession(): void {
  const store = readStore();
  store.designStarted = false;
  store.customization = new Set();
  store.designSessionId = createDesignSessionId();
  persistStore(store);
}

export function markDesignStarted(): boolean {
  const store = readStore();
  if (store.designStarted) return false;
  store.designStarted = true;
  persistStore(store);
  return true;
}

export function markCustomization(category: string): boolean {
  const store = readStore();
  if (store.customization.has(category)) return false;
  store.customization.add(category);
  persistStore(store);
  return true;
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
