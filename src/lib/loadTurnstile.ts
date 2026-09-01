import { TURNSTILE_SCRIPT_SRC } from "@/lib/turnstile";

type TurnstileApi = NonNullable<Window["turnstile"]>;

let loader: Promise<TurnstileApi> | null = null;

function waitForApi(turnstile: TurnstileApi): Promise<TurnstileApi> {
  return new Promise((resolve) => {
    if (typeof turnstile.ready !== "function") {
      resolve(turnstile);
      return;
    }
    turnstile.ready(() => resolve(turnstile));
  });
}

export function loadTurnstile(): Promise<TurnstileApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Turnstile is browser-only"));
  }
  if (window.turnstile) return waitForApi(window.turnstile);
  if (loader) return loader;

  loader = new Promise((resolve, reject) => {
    const fail = () => {
      loader = null;
      reject(new Error("Turnstile failed to load"));
    };

    const onReady = () => {
      if (!window.turnstile) {
        fail();
        return;
      }
      void waitForApi(window.turnstile).then(resolve, fail);
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TURNSTILE_SCRIPT_SRC}"]`,
    );
    if (existing) {
      if (window.turnstile) {
        void waitForApi(window.turnstile).then(resolve, fail);
        return;
      }
      existing.addEventListener("load", onReady, { once: true });
      existing.addEventListener("error", fail, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.onload = onReady;
    script.onerror = fail;
    document.head.appendChild(script);
  });

  return loader;
}
