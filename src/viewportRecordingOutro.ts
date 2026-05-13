const CREDIT_LINE = "Made with";
const CREDIT_URL = "www.3dBoxStudio.com";
const OUTRO_LOGO_SRC = "/logo-mark.svg";

let outroLogo: HTMLImageElement | null = null;
let outroLogoReady = false;

export function preloadViewportRecordingOutroAssets() {
  if (typeof window === "undefined" || outroLogo) return;
  const img = new Image();
  img.decoding = "async";
  img.onload = () => {
    outroLogoReady = true;
  };
  img.onerror = () => {
    outroLogo = null;
    outroLogoReady = false;
  };
  img.src = OUTRO_LOGO_SRC;
  outroLogo = img;
}

/** Same stops as `.btn-primary` plus a touch of `--panel` at the bottom edge. */
export function drawViewportRecordingOutroFrame(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#4aa3ff");
  g.addColorStop(0.55, "#3d9eff");
  g.addColorStop(0.88, "#2563a8");
  g.addColorStop(1, "#141820");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#f8fafc";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const line1 = Math.round(Math.max(44, Math.min(72, w / 16)));
  const line2 = Math.round(Math.max(36, Math.min(58, w / 13)));
  const gap = line1 * 0.55;
  const line2Gap = gap * 0.65;
  const logoSize = Math.round(Math.max(56, Math.min(112, w / 10)));
  const logoGap = line1 * 0.35;
  const hasLogo = outroLogoReady && outroLogo !== null && outroLogo.naturalWidth > 0;
  const blockHeight = (hasLogo ? logoSize + logoGap : 0) + line1 + gap + line2;
  let yTop = h / 2 - blockHeight / 2;

  if (hasLogo && outroLogo) {
    ctx.drawImage(outroLogo, w / 2 - logoSize / 2, yTop, logoSize, logoSize);
    yTop += logoSize + logoGap;
  }

  ctx.font = `600 ${line1}px system-ui, "DM Sans", sans-serif`;
  ctx.fillText(CREDIT_LINE, w / 2, yTop + line1 / 2);
  ctx.font = `700 ${line2}px system-ui, "DM Sans", sans-serif`;
  ctx.fillText(CREDIT_URL, w / 2, yTop + line1 + line2Gap + line2 / 2);
}
