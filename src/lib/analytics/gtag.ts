import { GA_DEBUG, GA_MEASUREMENT_ID } from "./policy";

export const GA_DATA_LAYER = "dataLayer";

export type GtagConfigOptions = {
  sendPageView: boolean;
  debugMode: boolean;
};

export function buildGtagConfigOptions(debugMode: boolean): GtagConfigOptions {
  return {
    sendPageView: false,
    debugMode,
  };
}

/** Inline script for a single gtag.js initialization (send_page_view disabled). */
export function buildGtagInitScript(
  gaId: string = GA_MEASUREMENT_ID,
  options: GtagConfigOptions = buildGtagConfigOptions(GA_DEBUG)
): string {
  const config = {
    send_page_view: options.sendPageView,
    ...(options.debugMode ? { debug_mode: true } : {}),
  };

  return `
window['${GA_DATA_LAYER}'] = window['${GA_DATA_LAYER}'] || [];
function gtag(){window['${GA_DATA_LAYER}'].push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}', ${JSON.stringify(config)});
`.trim();
}

export function pushGtag(...args: unknown[]): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push(args);
}

export function isGtagInitialized(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { dataLayer?: unknown[] };
  return Array.isArray(w.dataLayer);
}
