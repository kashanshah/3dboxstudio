import { SITE_ORIGIN_PUBLIC } from "@/siteMeta";

/** Server-safe canonical origin (NEXT_PUBLIC_SITE_ORIGIN or production default). */
export function getSiteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_ORIGIN;
  if (fromEnv && /^https?:\/\//i.test(fromEnv)) {
    return fromEnv.replace(/\/$/, "");
  }
  return SITE_ORIGIN_PUBLIC;
}
