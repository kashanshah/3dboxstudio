/**
 * Strict-Mode-safe URL bootstrap: share one in-flight load per key.
 * Entries are removed when the promise settles (success or failure) so a later
 * SPA navigation / remount can load the same id again.
 */

export type UrlBootstrapResult = "ok" | "error";

type CacheEntry = {
  promise: Promise<UrlBootstrapResult>;
};

const inflight = new Map<string, CacheEntry>();

export function resetUrlBootstrapCacheForTesting(): void {
  inflight.clear();
}

export function getUrlBootstrapCacheSizeForTesting(): number {
  return inflight.size;
}

/**
 * Concurrent callers (React Strict Mode double-mount) await the same promise.
 * After settle the key is removed — a later call runs the loader again.
 */
export function runUrlBootstrapOnce(
  key: string,
  loader: () => Promise<void>
): Promise<UrlBootstrapResult> {
  const existing = inflight.get(key);
  if (existing) {
    return existing.promise;
  }

  const entry: CacheEntry = {
    promise: Promise.resolve()
      .then(async () => {
        try {
          await loader();
          return "ok" as const;
        } catch {
          return "error" as const;
        }
      })
      .finally(() => {
        if (inflight.get(key) === entry) {
          inflight.delete(key);
        }
      }),
  };
  inflight.set(key, entry);
  return entry.promise;
}

export function shareBootstrapKey(shareId: string): string {
  return `share:${shareId}`;
}

export function previewBootstrapKey(previewToken: string): string {
  return `preview:${previewToken}`;
}
