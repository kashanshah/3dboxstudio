import { buildLandingHeadHtml } from "./landingHead";
import { buildStudioHeadHtml } from "./studioHead";

export type RouteHeadOptions = {
  ogImageVersion?: string;
  updatedTime?: string;
  facebookAppId?: string;
};

export function buildRouteHeadHtml(
  route: string,
  origin: string,
  options?: RouteHeadOptions,
): string {
  switch (route) {
    case "/":
      return buildLandingHeadHtml(origin, options);
    case "/studio":
      return buildStudioHeadHtml(origin);
    default:
      throw new Error(`No head markup configured for route "${route}".`);
  }
}

function stripExistingSocialMeta(html: string): string {
  return html
    .replace(/\s*<meta[^>]+property="og:[^"]*"[^>]*>\s*/gi, "")
    .replace(/\s*<meta[^>]+property="fb:[^"]*"[^>]*>\s*/gi, "")
    .replace(/\s*<meta[^>]+name="twitter:[^"]*"[^>]*>\s*/gi, "")
    .replace(/\s*<link[^>]+rel="canonical"[^>]*>\s*/gi, "");
}

export function applyRouteHeadToHtml(
  html: string,
  route: string,
  origin: string,
  options?: RouteHeadOptions,
): string {
  const headMarkup = buildRouteHeadHtml(route, origin, options);
  const withoutTitle = html.replace(/<title>[\s\S]*?<\/title>\s*/i, "");
  const withoutDescription = withoutTitle.replace(
    /<meta\s+name="description"[^>]*>\s*/i,
    "",
  );
  const withoutThemeColor = withoutDescription.replace(
    /<meta\s+name="theme-color"[^>]*>\s*/i,
    "",
  );
  const withoutSocial = stripExistingSocialMeta(withoutThemeColor);
  return withoutSocial.replace("</head>", `    ${headMarkup}\n  </head>`);
}
