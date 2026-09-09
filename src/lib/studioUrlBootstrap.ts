/**
 * Strict-Mode-safe URL bootstrap: one in-flight load per key, share the same
 * promise across effect remounts, drop failed keys so a later attempt can retry.
 */

export type UrlBootstrapResult = "ok" | "error";

type CacheEntry = {
  promise: Promise<UrlBootstrapResult>;
  status: "inflight" | "ok" | "error";
};

const cache = new Map<string, CacheEntry>();

export function resetUrlBootstrapCacheForTesting(): void {
  cache.clear();
}

export function getUrlBootstrapCacheSizeForTesting(): number {
  return cache.size;
}

/**
 * Run `loader` at most once per `key` while a request is in flight or has succeeded.
 * Concurrent callers (React Strict Mode double-mount) await the same promise.
 * On failure the key is removed so a subsequent call can retry.
 */
export function runUrlBootstrapOnce(
  key: string,
  loader: () => Promise<void>
): Promise<UrlBootstrapResult> {
  const existing = cache.get(key);
  if (existing && existing.status !== "error") {
    return existing.promise;
  }

  const entry: CacheEntry = {
    status: "inflight",
    promise: Promise.resolve().then(async () => {
      try {
        await loader();
        entry.status = "ok";
        return "ok" as const;
      } catch {
        entry.status = "error";
        cache.delete(key);
        return "error" as const;
      }
    }),
  };
  cache.set(key, entry);
  return entry.promise;
}

export function shareBootstrapKey(shareId: string): string {
  return `share:${shareId}`;
}

export function previewBootstrapKey(previewToken: string): string {
  return `preview:${previewToken}`;
}
