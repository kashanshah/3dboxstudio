import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { getEnglishBlogRedirect } from "./src/i18n/blogRouting";
import { upgradeEnPrefixRedirect } from "./src/i18n/enPrefixRedirect";
import { routing } from "./src/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export { isDefaultLocalePrefixPath, upgradeEnPrefixRedirect } from "./src/i18n/enPrefixRedirect";

export function middleware(request: NextRequest) {
  const blogRedirect = getEnglishBlogRedirect(request.nextUrl.pathname);
  if (blogRedirect) {
    const target = request.nextUrl.clone();
    target.pathname = blogRedirect;
    return NextResponse.redirect(target, 308);
  }
  const response = handleI18nRouting(request);
  return upgradeEnPrefixRedirect(request, response);
}

export default middleware;

export const config = {
  // Match all pathnames except api, admin, Next internals, and static files.
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
