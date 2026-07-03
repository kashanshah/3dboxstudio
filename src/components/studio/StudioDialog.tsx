"use client";

import { useEffect, type ReactNode } from "react";

type StudioDialogProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
};

export default function StudioDialog({ title, open, onClose, children, footer, width = 440 }: StudioDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="studio-dialog-overlay" role="presentation" onMouseDown={onClose}>
      <div
        className="studio-dialog"
        style={{ width: `min(${width}px, 100%)` }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="studio-dialog-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="studio-dialog-titlebar">
          <div className="studio-dialog-traffic" aria-hidden>
            <button
              type="button"
              className="studio-dialog-dot studio-dialog-dot--close"
              aria-label="Close"
              onClick={onClose}
            />
            <span className="studio-dialog-dot studio-dialog-dot--min" />
            <span className="studio-dialog-dot studio-dialog-dot--max" />
          </div>
          <div id="studio-dialog-title" className="studio-dialog-title">
            {title}
          </div>
        </div>
        <div className="studio-dialog-body">{children}</div>
        {footer && <div className="studio-dialog-footer">{footer}</div>}
      </div>
    </div>
  );
}
