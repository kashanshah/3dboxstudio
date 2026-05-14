import { SITE_ORIGIN_PUBLIC } from "../siteMeta";

export function getBuildOrigin(env: Record<string, string>): string {
  const fromEnv = env.VITE_SITE_ORIGIN;
  if (fromEnv && /^https?:\/\//i.test(fromEnv)) {
    return fromEnv.replace(/\/$/, "");
  }
  return SITE_ORIGIN_PUBLIC;
}
