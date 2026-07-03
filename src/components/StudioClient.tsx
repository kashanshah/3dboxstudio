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

export default function StudioClient() {
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
      <StudioPage />
    </Suspense>
  );
}
