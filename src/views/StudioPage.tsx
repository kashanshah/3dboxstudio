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
      <div className="studio-shell-page">
        <BoxDesigner
          initialShareId={initialShareId}
          initialPreviewToken={initialPreviewToken}
          viewOnly={viewOnly}
        />
      </div>
    </AuthProvider>
  );
}
