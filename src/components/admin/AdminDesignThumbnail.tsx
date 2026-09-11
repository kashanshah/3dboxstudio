"use client";

import { openLightGallery, type LightGallerySlide } from "@/lib/loadLightGallery";

type AdminDesignThumbnailProps = {
  src: string;
  label: string;
  slides: LightGallerySlide[];
  startIndex: number;
};

export default function AdminDesignThumbnail({
  src,
  label,
  slides,
  startIndex,
}: AdminDesignThumbnailProps) {
  return (
    <button
      type="button"
      className="admin-design-thumb"
      title={`Enlarge preview for ${label}`}
      aria-label={`Enlarge preview for ${label}`}
      onClick={() => {
        void openLightGallery(slides, startIndex);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" loading="lazy" />
    </button>
  );
}
