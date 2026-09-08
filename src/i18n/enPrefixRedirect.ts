import { NextRequest, NextResponse } from "next/server";

/** True when the request path is the default locale with a superfluous `/en` prefix. */
export function isDefaultLocalePrefixPath(pathname: string): boolean {
  return pathname === "/en" || pathname.startsWith("/en/");
}

/**
 * next-intl uses temporary redirects when stripping `/en` under `as-needed`.
 * For SEO we upgrade those to permanent 308 while preserving Location/query.
 */
export function upgradeEnPrefixRedirect(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  if (response.status !== 307 && response.status !== 302) {
    return response;
  }
  if (!isDefaultLocalePrefixPath(request.nextUrl.pathname)) {
    return response;
  }
  const location = response.headers.get("location");
  if (!location) {
    return response;
  }
  return NextResponse.redirect(new URL(location, request.url), 308);
}
