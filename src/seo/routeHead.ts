import { buildLandingHeadHtml } from "./landingHead";
import { buildStudioHeadHtml } from "./studioHead";

export function buildRouteHeadHtml(route: string, origin: string): string {
  switch (route) {
    case "/":
      return buildLandingHeadHtml(origin);
    case "/studio":
      return buildStudioHeadHtml(origin);
    default:
      throw new Error(`No head markup configured for route "${route}".`);
  }
}

export function applyRouteHeadToHtml(html: string, route: string, origin: string): string {
  const headMarkup = buildRouteHeadHtml(route, origin);
  const withoutTitle = html.replace(/<title>[\s\S]*?<\/title>\s*/i, "");
  const withoutDescription = withoutTitle.replace(
    /<meta\s+name="description"[^>]*>\s*/i,
    "",
  );
  const withoutThemeColor = withoutDescription.replace(
    /<meta\s+name="theme-color"[^>]*>\s*/i,
    "",
  );
  return withoutThemeColor.replace("</head>", `    ${headMarkup}\n  </head>`);
}
