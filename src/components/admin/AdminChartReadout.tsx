"use client";

import { useState, type ReactNode } from "react";

type BarHitProps = {
  tooltip: string;
  children: ReactNode;
  className?: string;
  onHoverChange: (tooltip: string | null) => void;
};

export function AdminChartBarHit({ tooltip, children, className, onHoverChange }: BarHitProps) {
  return (
    <div
      className={className}
      tabIndex={0}
      aria-label={tooltip}
      onMouseEnter={() => onHoverChange(tooltip)}
      onMouseLeave={() => onHoverChange(null)}
      onFocus={() => onHoverChange(tooltip)}
      onBlur={() => onHoverChange(null)}
    >
      {children}
    </div>
  );
}

type ReadoutProps = {
  value: string | null;
  placeholder?: string;
};

export function AdminChartReadout({ value, placeholder = "Hover a bar to see details" }: ReadoutProps) {
  return (
    <p className={`admin-chart-readout${value ? " is-active" : ""}`} aria-live="polite">
      {value ?? placeholder}
    </p>
  );
}

export function useChartHover() {
  return useState<string | null>(null);
}
