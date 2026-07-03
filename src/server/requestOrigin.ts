import { getSiteOrigin } from "@/lib/siteOrigin";

/**
 * Best-effort request origin so emailed links point at the environment the user is on
 * (e.g. localhost in dev). Falls back to the configured canonical site origin.
 */
export function originFromRequest(req: Request): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host) {
    const proto = req.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
    return `${proto}://${host}`.replace(/\/$/, "");
  }
  return getSiteOrigin();
}
