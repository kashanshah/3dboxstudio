"use client";

import { useEffect, useRef } from "react";

type LandingHeroVideoProps = {
  src: string;
  poster: string;
  width: number;
  height: number;
  alt: string;
};

export default function LandingHeroVideo({
  src,
  poster,
  width,
  height,
  alt,
}: LandingHeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          if (!video.src) {
            video.src = src;
          }
          void video.play().catch(() => {});
          return;
        }
        video.pause();
      },
      { threshold: 0.2 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [src]);

  return (
    <video
      ref={videoRef}
      className="landing-hero-visual-video"
      poster={poster}
      width={width}
      height={height}
      muted
      loop
      playsInline
      aria-label={alt}
      preload="none"
    />
  );
}
