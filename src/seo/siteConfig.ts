/** Set `VITE_SITE_ORIGIN` in `.env` for canonical URLs & JSON-LD (production: https://www.3dboxstudio.com). */
export function getSiteOrigin(): string {
  const fromEnv = import.meta.env.VITE_SITE_ORIGIN as string | undefined;
  if (fromEnv && /^https?:\/\//i.test(fromEnv)) {
    return fromEnv.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
}
