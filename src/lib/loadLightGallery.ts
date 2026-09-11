import type { LightGallerySettings } from "lightgallery/lg-settings";
import type { LightGallery } from "lightgallery/lightgallery";

type LightGalleryFn = (
  el: HTMLElement,
  options?: LightGallerySettings
) => LightGallery;

let loader: Promise<LightGalleryFn> | null = null;

export function loadLightGallery(): Promise<LightGalleryFn> {
  if (!loader) {
    loader = Promise.all([
      import("lightgallery"),
      import("lightgallery/plugins/zoom"),
      import("lightgallery/css/lightgallery.css"),
      import("lightgallery/css/lg-zoom.css"),
    ]).then(([lgMod, zoomMod]) => {
      const lightGallery = lgMod.default;
      const lgZoom = zoomMod.default;
      return (el: HTMLElement, options: LightGallerySettings = {}) =>
        lightGallery(el, {
          ...options,
          plugins: [...(options.plugins ?? []), lgZoom],
        });
    });
  }
  return loader;
}

export type LightGallerySlide = {
  src: string;
  thumb?: string;
  subHtml?: string;
};

let activeInstance: LightGallery | null = null;
let activeHost: HTMLElement | null = null;

/** Open a one-off lightGallery lightbox for the given slides. */
export async function openLightGallery(
  slides: LightGallerySlide[],
  startIndex = 0
): Promise<void> {
  if (slides.length === 0 || typeof document === "undefined") return;

  const lightGallery = await loadLightGallery();

  if (activeInstance) {
    activeInstance.destroy();
    activeInstance = null;
  }
  if (activeHost) {
    activeHost.remove();
    activeHost = null;
  }

  const host = document.createElement("div");
  host.className = "admin-lightgallery-host";
  host.setAttribute("aria-hidden", "true");
  document.body.appendChild(host);
  activeHost = host;

  const instance = lightGallery(host, {
    dynamic: true,
    dynamicEl: slides,
    index: startIndex,
    download: false,
    counter: slides.length > 1,
    // Temporary key for evaluation; replace with a commercial license key in production.
    licenseKey: "0000-0000-000-0000",
    speed: 300,
    mobileSettings: {
      controls: true,
      showCloseIcon: true,
      download: false,
    },
  });

  activeInstance = instance;

  host.addEventListener("lgAfterClose", () => {
    instance.destroy();
    host.remove();
    if (activeInstance === instance) activeInstance = null;
    if (activeHost === host) activeHost = null;
  });

  instance.openGallery(startIndex);
}
