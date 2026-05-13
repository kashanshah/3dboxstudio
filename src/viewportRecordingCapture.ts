export type ViewportRecordingComposite = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
};

/** Shared bridge between the recording hook and the R3F render loop. */
export const viewportRecordingCapture = {
  active: false,
  composite: null as ViewportRecordingComposite | null,
  inOutro: false,
  outroEndAt: 0,
  onOutroComplete: null as (() => void) | null,
};

export function resetViewportRecordingCapture() {
  viewportRecordingCapture.active = false;
  viewportRecordingCapture.composite = null;
  viewportRecordingCapture.inOutro = false;
  viewportRecordingCapture.outroEndAt = 0;
  viewportRecordingCapture.onOutroComplete = null;
}
