"use client";

import BoxDesigner from "../BoxDesigner";
import { AuthProvider } from "@/components/auth/AuthProvider";

export default function StudioPage({
  initialShareId = null,
  initialPreviewToken = null,
  viewOnly = false,
}: {
  initialShareId?: string | null;
  initialPreviewToken?: string | null;
  viewOnly?: boolean;
}) {
  return (
    <AuthProvider>
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", minHeight: 480 }}>
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <BoxDesigner
            initialShareId={initialShareId}
            initialPreviewToken={initialPreviewToken}
            viewOnly={viewOnly}
          />
        </div>
      </div>
    </AuthProvider>
  );
}
