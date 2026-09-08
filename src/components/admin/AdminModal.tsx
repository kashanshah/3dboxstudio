"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { trapFocus } from "@/lib/focusTrap";

type AdminModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  closeLabel?: string;
  width?: number;
  children: ReactNode;
};

export default function AdminModal({
  open,
  onClose,
  title,
  eyebrow,
  closeLabel = "Close modal",
  width = 860,
  children,
}: AdminModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

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
    <div className="admin-modal-overlay" role="presentation" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{ width: `min(${width}px, 100%)` }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="admin-modal-header">
          <div>
            {eyebrow ? <p className="admin-modal-eyebrow">{eyebrow}</p> : null}
            <h3 id={titleId}>{title}</h3>
          </div>
          <button type="button" className="admin-modal-close" aria-label={closeLabel} onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
