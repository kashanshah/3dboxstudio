"use client";

import { useEffect, useState } from "react";

/** Lighter WebGL settings on phones/tablets and when reduced motion is requested. */
export function usePerformanceMode(): boolean {
  const [performanceMode, setPerformanceMode] = useState(false);

  useEffect(() => {
    const widthMq = window.matchMedia("(max-width: 960px)");
    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const sync = () => {
      setPerformanceMode(widthMq.matches || motionMq.matches);
    };

    sync();
    widthMq.addEventListener("change", sync);
    motionMq.addEventListener("change", sync);
    return () => {
      widthMq.removeEventListener("change", sync);
      motionMq.removeEventListener("change", sync);
    };
  }, []);

  return performanceMode;
}
