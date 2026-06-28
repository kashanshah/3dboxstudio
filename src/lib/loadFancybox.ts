import type { Fancybox as FancyboxType } from "@fancyapps/ui";

let loader: Promise<typeof FancyboxType> | null = null;

export function loadFancybox(): Promise<typeof FancyboxType> {
  if (!loader) {
    loader = import("@fancyapps/ui").then((mod) => mod.Fancybox);
  }
  return loader;
}
