import { studioSharePath } from "./shareUrl";

const STORAGE_KEY = "3dboxstudio:recent-designs:v1";
const MAX_RECENT = 25;

export type RecentDesignSource = "opened" | "saved";

export type RecentDesignEntry = {
  id: string;
  url: string;
  name: string | null;
  lastOpenedAt: number;
  source: RecentDesignSource;
};

function shareUrlForId(id: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${studioSharePath(id)}`;
  }
  return studioSharePath(id);
}

function isEntry(x: unknown): x is RecentDesignEntry {
  if (typeof x !== "object" || x === null) return false;
  const e = x as RecentDesignEntry;
  return (
    typeof e.id === "string" &&
    typeof e.url === "string" &&
    typeof e.lastOpenedAt === "number" &&
    (e.source === "opened" || e.source === "saved") &&
    (e.name === undefined || e.name === null || typeof e.name === "string")
  );
}

export function readRecentDesigns(): RecentDesignEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntry).map((e) => ({ ...e, name: e.name ?? null })).sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
  } catch {
    return [];
  }
}

export function addRecentDesign(entry: {
  id: string;
  url?: string;
  name?: string | null;
  source: RecentDesignSource;
}): void {
  if (!/^[0-9A-Za-z]{10,24}$/.test(entry.id)) return;
  try {
    const url = entry.url ?? shareUrlForId(entry.id);
    const now = Date.now();
    const name = entry.name?.trim() ? entry.name.trim().slice(0, 120) : null;
    const previous = readRecentDesigns().find((e) => e.id === entry.id);
    const without = readRecentDesigns().filter((e) => e.id !== entry.id);
    const next: RecentDesignEntry[] = [
      {
        id: entry.id,
        url,
        name: name ?? previous?.name ?? null,
        lastOpenedAt: now,
        source: entry.source,
      },
      ...without,
    ].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota errors */
  }
}

export function updateRecentDesignName(id: string, name: string | null): void {
  try {
    const next = readRecentDesigns().map((e) => (e.id === id ? { ...e, name: name?.trim() ? name.trim().slice(0, 120) : null } : e));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function removeRecentDesign(id: string): void {
  try {
    const next = readRecentDesigns().filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function clearRecentDesigns(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function formatRecentTimestamp(ms: number): string {
  const diff = Date.now() - ms;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr} hr ago`;
  const day = Math.floor(hr / 24);
  if (day < 14) return `${day} day${day === 1 ? "" : "s"} ago`;
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
