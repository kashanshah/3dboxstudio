"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import StudioDialog from "@/components/studio/StudioDialog";
import {
  clampCrop,
  clampRotationDeg,
  clampZoom,
  coverCropPercent,
  createSideImagePlacement,
  defaultZoom,
  type SideImageCrop,
  type SideImagePlacement,
} from "@/lib/faceImageCrop";
import type { SourceImageRecord } from "@/lib/sourceImages";

/**
 * react-easy-crop: locked aspect ratio, drag-to-reposition, pinch/scroll zoom,
 * restore via initialCroppedAreaPercentages, and percent-space crop output.
 * Fits the existing React 19 studio without adding a second image editor.
 */
export type FaceImageCropApplyResult = {
  placement: SideImagePlacement;
};

type FaceImageCropModalProps = {
  open: boolean;
  faceName: string;
  source: SourceImageRecord | null;
  aspectRatio: number;
  initialPlacement?: SideImagePlacement | null;
  onCancel: () => void;
  onApply: (result: FaceImageCropApplyResult) => void;
};

export default function FaceImageCropModal({
  open,
  faceName,
  source,
  aspectRatio,
  initialPlacement = null,
  onCancel,
  onApply,
}: FaceImageCropModalProps) {
  const zoomLabelId = useId();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(initialPlacement?.zoom ?? defaultZoom());
  const [rotation, setRotation] = useState(initialPlacement?.rotation ?? 0);
  const [croppedArea, setCroppedArea] = useState<SideImageCrop | null>(
    initialPlacement ? clampCrop(initialPlacement.crop) : null
  );
  const [cropperKey, setCropperKey] = useState(0);
  const [restoreCrop, setRestoreCrop] = useState<SideImageCrop | undefined>(
    initialPlacement ? clampCrop(initialPlacement.crop) : undefined
  );

  const safeAspect = aspectRatio > 0 && Number.isFinite(aspectRatio) ? aspectRatio : 1;
  const sourceId = source?.id ?? "";
  const restoreFingerprint = initialPlacement
    ? `${initialPlacement.sourceImageId}:${initialPlacement.crop.x}:${initialPlacement.crop.y}:${initialPlacement.crop.width}:${initialPlacement.crop.height}:${initialPlacement.zoom}:${initialPlacement.rotation ?? 0}`
    : "new";

  useEffect(() => {
    if (!open || !source?.file) {
      setImageUrl(null);
      return;
    }
    const url = URL.createObjectURL(source.file);
    setImageUrl(url);
    setLoadState("loading");
    setCrop({ x: 0, y: 0 });
    setZoom(initialPlacement?.zoom ?? defaultZoom());
    setRotation(initialPlacement?.rotation ?? 0);
    setCroppedArea(initialPlacement ? clampCrop(initialPlacement.crop) : null);
    setRestoreCrop(initialPlacement ? clampCrop(initialPlacement.crop) : undefined);
    setCropperKey((n) => n + 1);
    return () => {
      URL.revokeObjectURL(url);
    };
    // Re-init when a different source or saved crop is opened, not on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sourceId, restoreFingerprint]);

  const handleCropComplete = useCallback((area: Area) => {
    setCroppedArea(
      clampCrop({
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height,
        unit: "percent",
      })
    );
  }, []);

  const handleReset = useCallback(() => {
    if (!source) return;
    const cover = coverCropPercent(source.naturalWidth, source.naturalHeight, safeAspect);
    setCrop({ x: 0, y: 0 });
    setZoom(defaultZoom());
    setRotation(0);
    setCroppedArea(cover);
    setRestoreCrop(undefined);
    setCropperKey((n) => n + 1);
  }, [safeAspect, source]);

  const handleApply = useCallback(() => {
    if (!source || !croppedArea || loadState !== "ready") return;
    onApply({
      placement: createSideImagePlacement(
        source.id,
        croppedArea,
        safeAspect,
        clampZoom(zoom),
        clampRotationDeg(rotation)
      ),
    });
  }, [croppedArea, loadState, onApply, rotation, safeAspect, source, zoom]);

  const applyDisabled = !source || loadState !== "ready" || !croppedArea;

  return (
    <StudioDialog
      title={`Crop image for ${faceName}`}
      open={open}
      onClose={onCancel}
      width={720}
      description="Drag to reposition and use zoom to fit this side."
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn" onClick={handleReset} disabled={!source || loadState === "error"}>
            Reset
          </button>
          <button type="button" className="btn btn-primary" onClick={handleApply} disabled={applyDisabled}>
            Apply
          </button>
        </>
      }
    >
      <p className="studio-dialog-lead">Drag to reposition and use zoom to fit this side.</p>
      <div className="face-image-crop-stage" aria-busy={loadState === "loading"}>
        {imageUrl && loadState !== "error" && (
          <Cropper
            key={`${source?.id ?? "crop"}-${cropperKey}`}
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={safeAspect}
            minZoom={1}
            maxZoom={8}
            objectFit="contain"
            showGrid
            restrictPosition
            zoomWithScroll
            initialCroppedAreaPercentages={restoreCrop}
            mediaProps={{
              alt: `Artwork for ${faceName}`,
              onError: () => setLoadState("error"),
            }}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
            onMediaLoaded={() => setLoadState("ready")}
            classes={{
              containerClassName: "face-image-crop-container",
              mediaClassName: "face-image-crop-media",
              cropAreaClassName: "face-image-crop-area",
            }}
            style={{
              containerStyle: { background: "var(--panel-collapse-bg)" },
            }}
          />
        )}
        {loadState === "loading" && (
          <div className="face-image-crop-status" role="status">
            Loading image…
          </div>
        )}
        {loadState === "error" && (
          <div className="face-image-crop-status face-image-crop-status--error" role="alert">
            This image could not be displayed. It may be corrupt or in an unsupported format.
          </div>
        )}
      </div>
      <div className="face-image-crop-controls">
        <label id={zoomLabelId} htmlFor="face-image-crop-zoom">
          Zoom
        </label>
        <input
          id="face-image-crop-zoom"
          type="range"
          min={1}
          max={8}
          step={0.05}
          value={zoom}
          aria-labelledby={zoomLabelId}
          disabled={loadState !== "ready"}
          onChange={(e) => setZoom(Number(e.target.value))}
        />
      </div>
    </StudioDialog>
  );
}
