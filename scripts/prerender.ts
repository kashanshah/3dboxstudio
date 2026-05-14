import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build, loadEnv } from "vite";
import type { PrerenderConfig } from "../prerender.config";
import { validatePrerenderConfig } from "../prerender.config";
import { getBuildOrigin } from "../src/seo/getBuildOrigin";
import { applyRouteHeadToHtml } from "../src/seo/routeHead";

const distDir = path.resolve("dist");
const serverOutDir = path.resolve("dist/.prerender-server");

function routeToOutputPath(route: string): string {
  if (route === "/") return "index.html";
  return `${route.slice(1)}/index.html`;
}

function injectAppHtml(template: string, appHtml: string): string {
  const rootOpen = '<div id="root">';
  const rootIndex = template.indexOf(rootOpen);
  if (rootIndex === -1) {
    throw new Error('Could not find <div id="root"> in the built HTML template.');
  }
  const rootCloseIndex = template.indexOf("</div>", rootIndex);
  if (rootCloseIndex === -1) {
    throw new Error("Could not find the closing </div> for #root in the built HTML template.");
  }
  return `${template.slice(0, rootIndex + rootOpen.length)}${appHtml}${template.slice(rootCloseIndex)}`;
}

async function writeRouteHtml(relativePath: string, html: string): Promise<void> {
  const outputPath = path.join(distDir, relativePath);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, html, "utf8");
}

export async function runRoutePrerender(config: PrerenderConfig): Promise<void> {
  validatePrerenderConfig(config);

  const templatePath = path.join(distDir, "index.html");
  const template = await fs.readFile(templatePath, "utf8");
  const origin = getBuildOrigin(loadEnv("production", process.cwd(), ""));

  await build({
    configFile: path.resolve("vite.ssr.config.ts"),
  });

  const serverEntry = path.join(serverOutDir, "entry-server.js");
  const { renderPrerenderRoute } = await import(pathToFileURL(serverEntry).href);

  for (const route of config.prerender) {
    const appHtml = renderPrerenderRoute(route);
    const html = applyRouteHeadToHtml(injectAppHtml(template, appHtml), route, origin);
    await writeRouteHtml(routeToOutputPath(route), html);
  }

  for (const route of config.clientOnly) {
    const html = applyRouteHeadToHtml(template, route, origin);
    await writeRouteHtml(routeToOutputPath(route), html);
  }

  await fs.rm(serverOutDir, { recursive: true, force: true });
}

const { prerenderConfig } = await import("../prerender.config");
await runRoutePrerender(prerenderConfig);
