let preloaded = false;

/** Warm the studio client chunk before navigation (e.g. on CTA hover). */
export function preloadStudioChunk(): void {
  if (preloaded || typeof window === "undefined") return;
  preloaded = true;
  void import("@/views/StudioPage");
}
