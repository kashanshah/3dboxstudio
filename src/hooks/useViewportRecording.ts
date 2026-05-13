import { useCallback, useEffect, useRef, useState } from "react";

export type ViewportRecordingPhase = "idle" | "countdown" | "recording";

const COUNTDOWN_START = 3;
const MAX_RECORD_MS = 15_000;
/** Extra tail card appended to every export (matches primary button gradient + panel tone). */
const OUTRO_MS = 1000;
const CREDIT_LINE = "Made with";
const CREDIT_URL = "www.3dBoxStudio.com";

function pickRecorderMime(): string | undefined {
  const candidates = [
    "video/mp4;codecs=avc1.42E01E",
    "video/mp4;codecs=avc1.4D401E",
    "video/mp4",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return undefined;
}

function extensionForMime(mime: string): string {
  if (mime.includes("mp4")) return "mp4";
  return "webm";
}

function downloadBlob(blob: Blob, extension: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `box-preview-presentation-${Date.now()}.${extension}`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Same stops as `.btn-primary` plus a touch of `--panel` at the bottom edge. */
function drawOutroFrame(ctx: CanvasRenderingContext2D, w: number, h: number) {
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
  const line1 = Math.round(Math.max(32, Math.min(32, w / 24)));
  const line2 = Math.round(Math.max(24, Math.min(26, w / 20)));
  const gap = line1 * 0.55;
  ctx.font = `600 ${line1}px system-ui, "DM Sans", sans-serif`;
  ctx.fillText(CREDIT_LINE, w / 2, h / 2 - gap);
  ctx.font = `700 ${line2}px system-ui, "DM Sans", sans-serif`;
  ctx.fillText(CREDIT_URL, w / 2, h / 2 + gap * 0.65);
}

export function useViewportRecording() {
  const [phase, setPhase] = useState<ViewportRecordingPhase>("idle");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recordRemainingSec, setRecordRemainingSec] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownIntervalRef = useRef<number | undefined>(undefined);
  const maxDurationTimeoutRef = useRef<number | undefined>(undefined);
  const tickIntervalRef = useRef<number | undefined>(undefined);
  const endingRef = useRef(false);

  const getCanvasRef = useRef<() => HTMLCanvasElement | null>(() => null);
  const compositeRef = useRef<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null>(null);
  const paintRafRef = useRef<number | null>(null);
  const inOutroRef = useRef(false);
  const outroEndAtRef = useRef(0);

  const clearCountdownInterval = useCallback(() => {
    if (countdownIntervalRef.current !== undefined) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = undefined;
    }
  }, []);

  const clearRecordingTimers = useCallback(() => {
    if (maxDurationTimeoutRef.current !== undefined) {
      window.clearTimeout(maxDurationTimeoutRef.current);
      maxDurationTimeoutRef.current = undefined;
    }
    if (tickIntervalRef.current !== undefined) {
      window.clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = undefined;
    }
  }, []);

  const stopPaintLoop = useCallback(() => {
    if (paintRafRef.current !== null) {
      cancelAnimationFrame(paintRafRef.current);
      paintRafRef.current = null;
    }
  }, []);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const disposeComposite = useCallback(() => {
    compositeRef.current = null;
  }, []);

  const cleanupCapture = useCallback(() => {
    stopPaintLoop();
    disposeComposite();
    cleanupStream();
    inOutroRef.current = false;
  }, [cleanupStream, disposeComposite, stopPaintLoop]);

  const finalizeStop = useCallback(() => {
    clearRecordingTimers();
    setRecordRemainingSec(null);
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === "inactive") {
      endingRef.current = false;
      cleanupCapture();
      setPhase("idle");
      return;
    }
    if (inOutroRef.current) return;
    inOutroRef.current = true;
    outroEndAtRef.current = performance.now() + OUTRO_MS;
  }, [clearRecordingTimers, cleanupCapture]);

  const stop = useCallback(() => {
    if (phase !== "recording") return;
    if (endingRef.current) return;
    endingRef.current = true;
    finalizeStop();
  }, [phase, finalizeStop]);

  useEffect(
    () => () => {
      clearCountdownInterval();
      clearRecordingTimers();
      stopPaintLoop();
      disposeComposite();
      cleanupStream();
      const mr = mediaRecorderRef.current;
      if (mr && mr.state !== "inactive") {
        try {
          mr.stop();
        } catch {
          /* ignore */
        }
      }
    },
    [clearCountdownInterval, clearRecordingTimers, cleanupStream, disposeComposite, stopPaintLoop]
  );

  const cancelCountdown = useCallback(() => {
    clearCountdownInterval();
    setCountdown(null);
    setPhase("idle");
  }, [clearCountdownInterval]);

  const beginCapture = useCallback(
    (getCanvas: () => HTMLCanvasElement | null) => {
      getCanvasRef.current = getCanvas;
      const glCanvas = getCanvas();
      if (!glCanvas?.captureStream) {
        setError("Could not access the 3D canvas for recording.");
        setPhase("idle");
        return;
      }

      const composite = document.createElement("canvas");
      const ctx = composite.getContext("2d", { alpha: false, desynchronized: true });
      if (!ctx) {
        setError("Could not prepare the recording surface.");
        setPhase("idle");
        return;
      }

      composite.width = glCanvas.width;
      composite.height = glCanvas.height;
      compositeRef.current = { canvas: composite, ctx };

      let stream: MediaStream;
      try {
        // Prefer display-like cadence; 30fps + damped orbit looked like trailing/smear on motion.
        stream = composite.captureStream(60);
      } catch {
        try {
          stream = composite.captureStream(30);
        } catch {
          setError("Recording this view is not supported in your browser.");
          compositeRef.current = null;
          setPhase("idle");
          return;
        }
      }

      streamRef.current = stream;
      chunksRef.current = [];
      const preferredMime = pickRecorderMime();

      let recorder: MediaRecorder;
      try {
        recorder = preferredMime
          ? new MediaRecorder(stream, { mimeType: preferredMime, videoBitsPerSecond: 10_000_000 })
          : new MediaRecorder(stream);
      } catch {
        try {
          recorder = new MediaRecorder(stream);
        } catch {
          setError("Could not start the video recorder.");
          cleanupCapture();
          setPhase("idle");
          return;
        }
      }

      endingRef.current = false;
      inOutroRef.current = false;

      const paint = () => {
        const pair = compositeRef.current;
        const mr = mediaRecorderRef.current;
        if (!pair || !mr || mr.state === "inactive") {
          stopPaintLoop();
          return;
        }
        const { canvas, ctx: c2d } = pair;
        const gl = getCanvasRef.current();
        const now = performance.now();

        if (inOutroRef.current) {
          if (canvas.width > 0 && canvas.height > 0) {
            drawOutroFrame(c2d, canvas.width, canvas.height);
          }
          if (now >= outroEndAtRef.current) {
            stopPaintLoop();
            try {
              mr.stop();
            } catch {
              /* ignore */
            }
            return;
          }
        } else if (gl && gl.width > 0 && gl.height > 0) {
          if (canvas.width !== gl.width || canvas.height !== gl.height) {
            canvas.width = gl.width;
            canvas.height = gl.height;
          }
          c2d.drawImage(gl, 0, 0);
        }

        paintRafRef.current = requestAnimationFrame(paint);
      };

      paintRafRef.current = requestAnimationFrame(paint);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        cleanupCapture();
        mediaRecorderRef.current = null;
        const mime = recorder.mimeType || "video/webm";
        const blob = new Blob(chunksRef.current, { type: mime });
        chunksRef.current = [];
        downloadBlob(blob, extensionForMime(mime));
        endingRef.current = false;
        setPhase("idle");
      };

      mediaRecorderRef.current = recorder;
      try {
        recorder.start(200);
      } catch {
        setError("Could not start recording.");
        stopPaintLoop();
        disposeComposite();
        cleanupStream();
        mediaRecorderRef.current = null;
        setPhase("idle");
        return;
      }

      setPhase("recording");
      const startedAt = performance.now();
      const updateRemaining = () => {
        const elapsed = (performance.now() - startedAt) / 1000;
        const left = Math.max(0, Math.ceil(MAX_RECORD_MS / 1000 - elapsed));
        setRecordRemainingSec(left);
      };
      updateRemaining();
      tickIntervalRef.current = window.setInterval(updateRemaining, 250);

      maxDurationTimeoutRef.current = window.setTimeout(() => {
        if (endingRef.current) return;
        endingRef.current = true;
        finalizeStop();
      }, MAX_RECORD_MS);
    },
    [cleanupCapture, disposeComposite, finalizeStop, stopPaintLoop]
  );

  const start = useCallback(
    (getCanvas: () => HTMLCanvasElement | null) => {
      setError(null);
      if (phase !== "idle") return;

      const canvas = getCanvas();
      if (!canvas) {
        setError("The 3D view is not ready yet. Wait a moment and try again.");
        return;
      }
      if (typeof canvas.captureStream !== "function") {
        setError("This browser does not support recording the 3D canvas.");
        return;
      }

      setPhase("countdown");
      let n = COUNTDOWN_START;
      setCountdown(n);

      countdownIntervalRef.current = window.setInterval(() => {
        n -= 1;
        if (n <= 0) {
          clearCountdownInterval();
          setCountdown(null);
          beginCapture(getCanvas);
        } else {
          setCountdown(n);
        }
      }, 1000);
    },
    [phase, beginCapture, clearCountdownInterval]
  );

  return {
    phase,
    countdown,
    recordRemainingSec,
    error,
    start,
    stop,
    cancelCountdown,
  };
}
