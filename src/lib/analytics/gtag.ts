import { GA_DEBUG, GA_MEASUREMENT_ID } from "./policy";

export const GA_DATA_LAYER = "dataLayer";

export type GtagConfigOptions = {
  sendPageView: boolean;
  debugMode: boolean;
};

type GtagWindow = Window & {
  dataLayer?: IArguments[];
  gtag?: (...args: unknown[]) => void;
};

let configured = false;

export function buildGtagConfigOptions(debugMode: boolean): GtagConfigOptions {
  return {
    sendPageView: false,
    debugMode,
  };
}

function getGtagWindow(): GtagWindow | undefined {
  if (typeof window === "undefined") return undefined;
  return window as GtagWindow;
}

/** Install Google's standard dataLayer + gtag queue stub (arguments object, not a rest array). */
export function installGtagStub(): void {
  const w = getGtagWindow();
  if (!w) return;

  w[GA_DATA_LAYER] = w[GA_DATA_LAYER] ?? [];

  if (!w.gtag) {
    w.gtag = function gtag() {
      // Google gtag queues the `arguments` object — rest params would break GA4 consumption.
      // eslint-disable-next-line prefer-rest-params
      w[GA_DATA_LAYER]!.push(arguments);
    };
  }
}

function buildConfigPayload(options: GtagConfigOptions = buildGtagConfigOptions(GA_DEBUG)) {
  return {
    send_page_view: options.sendPageView,
    ...(options.debugMode ? { debug_mode: true } : {}),
  };
}

/**
 * Queue gtag('js') + gtag('config', …) exactly once before any events.
 * Safe to call from the loader and from pushGtag.
 */
export function ensureGtagInitialized(
  gaId: string = GA_MEASUREMENT_ID,
  options: GtagConfigOptions = buildGtagConfigOptions(GA_DEBUG)
): boolean {
  const w = getGtagWindow();
  if (!w || !gaId) return false;

  installGtagStub();

  if (configured) return true;

  w.gtag!("js", new Date());
  w.gtag!("config", gaId, buildConfigPayload(options));
  configured = true;
  return true;
}

/** Inline script kept for documentation parity; prefer ensureGtagInitialized in app code. */
export function buildGtagInitScript(
  gaId: string = GA_MEASUREMENT_ID,
  options: GtagConfigOptions = buildGtagConfigOptions(GA_DEBUG)
): string {
  const config = buildConfigPayload(options);

  return `
window['${GA_DATA_LAYER}'] = window['${GA_DATA_LAYER}'] || [];
window.gtag = window.gtag || function(){window['${GA_DATA_LAYER}'].push(arguments);};
gtag('js', new Date());
gtag('config', '${gaId}', ${JSON.stringify(config)});
`.trim();
}

export function pushGtag(...args: unknown[]): void {
  const w = getGtagWindow();
  if (!w || !GA_MEASUREMENT_ID) return;

  ensureGtagInitialized();
  w.gtag!(...args);
}

export function isGtagInitialized(): boolean {
  return configured;
}

/** Test-only reset for module-level init guard. */
export function resetGtagForTesting(): void {
  configured = false;
  const w = getGtagWindow();
  if (!w) return;
  delete w.gtag;
  delete w[GA_DATA_LAYER];
}
