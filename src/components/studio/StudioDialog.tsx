"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { trapFocus } from "@/lib/focusTrap";

type StudioDialogProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
  description?: string;
};

export default function StudioDialog({
  title,
  open,
  onClose,
  children,
  footer,
  width = 440,
  description,
}: StudioDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open || !dialogRef.current) return;
    return trapFocus(dialogRef.current, onClose);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="studio-dialog-overlay" role="presentation" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className="studio-dialog"
        style={{ width: `min(${width}px, 100%)` }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
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
          <div id={titleId} className="studio-dialog-title">
            {title}
          </div>
        </div>
        <div className="studio-dialog-body">
          {description && (
            <p id={descriptionId} className="visually-hidden">
              {description}
            </p>
          )}
          {children}
        </div>
        {footer && <div className="studio-dialog-footer">{footer}</div>}
      </div>
    </div>
  );
}
