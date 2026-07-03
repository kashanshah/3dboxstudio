/** Max longest edge for OG preview captures uploaded on save. */
export const SHARE_OG_MAX_DIMENSION = 1200;

export type ShareOgImageBlob = {
  blob: Blob;
  width: number;
  height: number;
};

function prepareOgCanvas(canvas: HTMLCanvasElement, maxDimension = SHARE_OG_MAX_DIMENSION): HTMLCanvasElement | null {
  const longest = Math.max(canvas.width, canvas.height);
  const scale = longest > maxDimension ? maxDimension / longest : 1;
  const width = Math.max(1, Math.round(canvas.width * scale));
  const height = Math.max(1, Math.round(canvas.height * scale));

  if (scale >= 1) return canvas;

  const out = document.createElement("canvas");
  out.width = width;
  out.height = height;
  const ctx = out.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(canvas, 0, 0, width, height);
  return out;
}

export function captureCanvasOgBlob(canvas: HTMLCanvasElement, maxDimension = SHARE_OG_MAX_DIMENSION): Promise<ShareOgImageBlob | null> {
  const target = prepareOgCanvas(canvas, maxDimension);
  if (!target) return Promise.resolve(null);

  return new Promise((resolve) => {
    target.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        resolve({ blob, width: target.width, height: target.height });
      },
      "image/png",
      0.92
    );
  });
}

export async function uploadShareOgImageToCloud(shareId: string, image: ShareOgImageBlob): Promise<void> {
  const res = await fetch(`/api/shares/${encodeURIComponent(shareId)}/og-image`, {
    method: "PUT",
    headers: {
      "Content-Type": "image/png",
      "X-Share-Og-Image-Width": String(image.width),
      "X-Share-Og-Image-Height": String(image.height),
    },
    body: image.blob,
  });

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      typeof data === "object" && data !== null && "error" in data && typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Could not upload preview image.";
    throw new Error(message);
  }
}
