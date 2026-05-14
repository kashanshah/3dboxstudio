export type PrerenderConfig = {
  /** Routes rendered to static HTML at build time for crawlers and first paint. */
  prerender: readonly string[];
  /** Routes that stay client-rendered; each gets a shell HTML file for direct visits. */
  clientOnly: readonly string[];
};

export const prerenderConfig: PrerenderConfig = {
  prerender: ["/"],
  clientOnly: ["/studio"],
};

export function validatePrerenderConfig(config: PrerenderConfig): void {
  const seen = new Set<string>();
  for (const route of [...config.prerender, ...config.clientOnly]) {
    if (!route.startsWith("/") || route.length === 0) {
      throw new Error(`Invalid route "${route}". Routes must start with "/".`);
    }
    if (route.length > 1 && route.endsWith("/")) {
      throw new Error(`Invalid route "${route}". Remove trailing slashes.`);
    }
    if (seen.has(route)) {
      throw new Error(`Route "${route}" is listed more than once.`);
    }
    seen.add(route);
  }

  const overlap = config.prerender.filter((route) => config.clientOnly.includes(route));
  if (overlap.length > 0) {
    throw new Error(
      `Routes cannot be both prerendered and client-only: ${overlap.join(", ")}`,
    );
  }
}
