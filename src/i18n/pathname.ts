import { locales } from "@/i18n/config";

/** Strip a leading locale prefix (`/fr/...` → `/...`) for analytics and shared path helpers. */
export function stripLocalePrefix(pathname: string): string {
  const path = pathname.split("?")[0] || "/";
  for (const locale of locales) {
    if (locale === "en") continue;
    if (path === `/${locale}`) return "/";
    if (path.startsWith(`/${locale}/`)) {
      const rest = path.slice(locale.length + 1);
      return rest || "/";
    }
  }
  return path || "/";
}
