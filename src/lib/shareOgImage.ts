/** Max longest edge for OG preview captures sent on save (keeps payloads reasonable). */
export const SHARE_OG_MAX_DIMENSION = 1200;

export type ShareOgImagePayload = {
  base64Png: string;
  width: number;
  height: number;
};

export function downscaleCanvasToOgPng(canvas: HTMLCanvasElement, maxDimension = SHARE_OG_MAX_DIMENSION): ShareOgImagePayload | null {
  const longest = Math.max(canvas.width, canvas.height);
  const scale = longest > maxDimension ? maxDimension / longest : 1;
  const width = Math.max(1, Math.round(canvas.width * scale));
  const height = Math.max(1, Math.round(canvas.height * scale));

  const target =
    scale < 1
      ? (() => {
          const out = document.createElement("canvas");
          out.width = width;
          out.height = height;
          const ctx = out.getContext("2d");
          if (!ctx) return null;
          ctx.drawImage(canvas, 0, 0, width, height);
          return out;
        })()
      : canvas;

  if (!target) return null;

  const dataUrl = target.toDataURL("image/png", 0.92);
  const base64Png = dataUrl.split(",")[1];
  if (!base64Png) return null;

  return { base64Png, width: target.width, height: target.height };
}
