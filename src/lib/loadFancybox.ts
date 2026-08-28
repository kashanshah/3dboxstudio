import type { Fancybox as FancyboxType } from "@fancyapps/ui";

let loader: Promise<typeof FancyboxType> | null = null;

export function loadFancybox(): Promise<typeof FancyboxType> {
  if (!loader) {
    loader = import("@fancyapps/ui").then(async (mod) => {
      await import("@fancyapps/ui/dist/fancybox/fancybox.css");
      return mod.Fancybox;
    });
  }
  return loader;
}
