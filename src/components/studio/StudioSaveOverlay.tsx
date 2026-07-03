"use client";

type StudioSaveOverlayProps = {
  message: string;
};

export default function StudioSaveOverlay({ message }: StudioSaveOverlayProps) {
  return (
    <div className="studio-save-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="studio-save-overlay-card">
        <div className="studio-save-overlay-spinner" aria-hidden />
        <p className="studio-save-overlay-message">{message}</p>
      </div>
    </div>
  );
}
