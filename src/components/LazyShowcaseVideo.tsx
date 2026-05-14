import { useEffect, useRef } from "react";

type LazyShowcaseVideoProps = {
  src: string;
  ariaLabel: string;
};

export default function LazyShowcaseVideo({ src, ariaLabel }: LazyShowcaseVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        if (!video.src) {
          video.src = src;
        }
        observer.disconnect();
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [src]);

  return (
    <video
      ref={videoRef}
      className="landing-showcase-tile-video"
      controls
      playsInline
      loop
      preload="none"
      aria-label={ariaLabel}
    />
  );
}
