import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getUrlBootstrapCacheSizeForTesting,
  previewBootstrapKey,
  resetUrlBootstrapCacheForTesting,
  runUrlBootstrapOnce,
  shareBootstrapKey,
} from "@/lib/studioUrlBootstrap";

beforeEach(() => {
  resetUrlBootstrapCacheForTesting();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("runUrlBootstrapOnce", () => {
  it("runs the loader once when called concurrently (Strict Mode)", async () => {
    let loads = 0;
    const loader = vi.fn(async () => {
      loads += 1;
      await new Promise((r) => setTimeout(r, 20));
    });

    const key = shareBootstrapKey("abc");
    const [a, b] = await Promise.all([
      runUrlBootstrapOnce(key, loader),
      runUrlBootstrapOnce(key, loader),
    ]);

    expect(a).toBe("ok");
    expect(b).toBe("ok");
    expect(loads).toBe(1);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("allows retry after failure", async () => {
    let attempt = 0;
    const loader = vi.fn(async () => {
      attempt += 1;
      if (attempt === 1) throw new Error("network");
    });

    const key = previewBootstrapKey("tok");
    expect(await runUrlBootstrapOnce(key, loader)).toBe("error");
    expect(getUrlBootstrapCacheSizeForTesting()).toBe(0);
    expect(await runUrlBootstrapOnce(key, loader)).toBe("ok");
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("does not re-run after success", async () => {
    const loader = vi.fn(async () => undefined);
    const key = shareBootstrapKey("done");
    expect(await runUrlBootstrapOnce(key, loader)).toBe("ok");
    expect(await runUrlBootstrapOnce(key, loader)).toBe("ok");
    expect(loader).toHaveBeenCalledTimes(1);
  });
});
