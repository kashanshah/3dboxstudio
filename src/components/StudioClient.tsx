"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

function StudioLoading() {
  const t = useTranslations("studio.editor");
  return <div className="studio-loading">{t("loadingStudio")}</div>;
}

const StudioPage = dynamic(() => import("@/views/StudioPage"), {
  ssr: false,
  loading: StudioLoading,
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
      fallback={<StudioLoading />}
    >
      <StudioPage
        initialShareId={initialShareId}
        initialPreviewToken={initialPreviewToken}
        viewOnly={viewOnly}
      />
    </Suspense>
  );
}
