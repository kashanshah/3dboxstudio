import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { upgradeEnPrefixRedirect } from "./src/i18n/enPrefixRedirect";
import { routing } from "./src/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export { isDefaultLocalePrefixPath, upgradeEnPrefixRedirect } from "./src/i18n/enPrefixRedirect";

export function middleware(request: NextRequest) {
  const response = handleI18nRouting(request);
  return upgradeEnPrefixRedirect(request, response);
}

export default middleware;

export const config = {
  // Match all pathnames except api, admin, Next internals, and static files.
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
