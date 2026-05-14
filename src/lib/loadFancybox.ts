import type { Fancybox as FancyboxType } from "@fancyapps/ui";

let loader: Promise<typeof FancyboxType> | null = null;

export function loadFancybox(): Promise<typeof FancyboxType> {
  if (!loader) {
    loader = Promise.all([
      import("@fancyapps/ui"),
      import("@fancyapps/ui/dist/fancybox/fancybox.css"),
    ]).then(([mod]) => mod.Fancybox);
  }
  return loader;
}
