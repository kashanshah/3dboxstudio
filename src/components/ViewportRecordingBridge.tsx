import { useFrame } from "@react-three/fiber";
import { viewportRecordingCapture } from "../viewportRecordingCapture";
import { drawViewportRecordingOutroFrame } from "../viewportRecordingOutro";

/**
 * Renders the scene, then copies the WebGL buffer into the offscreen recording canvas.
 * useFrame runs before the default render; priority 1 takes over rendering so the copy
 * sees the current frame instead of a stale buffer (edge ghosting during motion).
 */
export function ViewportRecordingBridge() {
  useFrame((state) => {
    const bus = viewportRecordingCapture;
    if (!bus.active) return;
    const pair = bus.composite;
    if (!pair) return;

    const { canvas, ctx } = pair;

    if (bus.inOutro) {
      if (canvas.width > 0 && canvas.height > 0) {
        drawViewportRecordingOutroFrame(ctx, canvas.width, canvas.height);
      }
      if (performance.now() >= bus.outroEndAt) {
        const finish = bus.onOutroComplete;
        bus.onOutroComplete = null;
        finish?.();
      }
      return;
    }

    const glCanvas = state.gl.domElement;
    if (!glCanvas || glCanvas.width <= 0 || glCanvas.height <= 0) return;

    if (canvas.width !== glCanvas.width || canvas.height !== glCanvas.height) {
      canvas.width = glCanvas.width;
      canvas.height = glCanvas.height;
    }

    state.gl.setRenderTarget(null);
    state.gl.clear(true, true, true);
    state.gl.render(state.scene, state.camera);
    state.gl.getContext().finish();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(glCanvas, 0, 0);
  }, 1);

  return null;
}
