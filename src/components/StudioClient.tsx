"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

const StudioPage = dynamic(() => import("@/views/StudioPage"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0c0e12",
        color: "#8b93a4",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      Loading 3D Box Studio…
    </div>
  ),
});

type StudioClientProps = {
  initialShareId?: string | null;
  initialPreviewToken?: string | null;
  viewOnly?: boolean;
};

export default function StudioClient({
  initialShareId = null,
  initialPreviewToken = null,
  viewOnly = false,
}: StudioClientProps) {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "#0c0e12",
            color: "#8b93a4",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Loading 3D Box Studio…
        </div>
      }
    >
      <StudioPage
        initialShareId={initialShareId}
        initialPreviewToken={initialPreviewToken}
        viewOnly={viewOnly}
      />
    </Suspense>
  );
}
