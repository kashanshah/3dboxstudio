import { useCallback, useEffect, useRef, useState } from "react";

export type ViewportRecordingPhase = "idle" | "countdown" | "recording";

const COUNTDOWN_START = 3;
const MAX_RECORD_MS = 15_000;

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

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const finalizeStop = useCallback(() => {
    clearRecordingTimers();
    setRecordRemainingSec(null);
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === "inactive") {
      endingRef.current = false;
      cleanupStream();
      setPhase("idle");
      return;
    }
    mr.stop();
  }, [clearRecordingTimers, cleanupStream]);

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
    [clearCountdownInterval, clearRecordingTimers, cleanupStream]
  );

  const cancelCountdown = useCallback(() => {
    clearCountdownInterval();
    setCountdown(null);
    setPhase("idle");
  }, [clearCountdownInterval]);

  const beginCapture = useCallback(
    (getCanvas: () => HTMLCanvasElement | null) => {
      const canvas = getCanvas();
      if (!canvas?.captureStream) {
        setError("Could not access the 3D canvas for recording.");
        setPhase("idle");
        return;
      }

      let stream: MediaStream;
      try {
        stream = canvas.captureStream(30);
      } catch {
        setError("Recording this view is not supported in your browser.");
        setPhase("idle");
        return;
      }

      streamRef.current = stream;
      chunksRef.current = [];
      const preferredMime = pickRecorderMime();

      let recorder: MediaRecorder;
      try {
        recorder = preferredMime
          ? new MediaRecorder(stream, { mimeType: preferredMime, videoBitsPerSecond: 6_000_000 })
          : new MediaRecorder(stream);
      } catch {
        try {
          recorder = new MediaRecorder(stream);
        } catch {
          setError("Could not start the video recorder.");
          cleanupStream();
          setPhase("idle");
          return;
        }
      }

      endingRef.current = false;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        cleanupStream();
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
        cleanupStream();
        mediaRecorderRef.current = null;
        setPhase("idle");
        return;
      }

      setPhase("recording");
      const startedAt = performance.now();
      const updateRemaining = () => {
        const elapsed = (performance.now() - startedAt) / 1000;
        const left = Math.max(0, Math.ceil((MAX_RECORD_MS / 1000) - elapsed));
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
    [cleanupStream, finalizeStop]
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
