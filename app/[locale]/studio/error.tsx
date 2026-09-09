"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function StudioRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("studio.routeError");
  return (
    <div className="studio-error-fallback studio-error-fallback--page" role="alert">
      <div className="studio-error-fallback-card">
        <h1 className="studio-error-fallback-title">{t("title")}</h1>
        <p className="studio-error-fallback-lead">
          {t("lead")}
        </p>
        {error.message && (
          <p className="studio-error-fallback-detail">
            <code>{error.message}</code>
          </p>
        )}
        <div className="studio-error-fallback-actions">
          <button type="button" className="btn btn-primary" onClick={() => reset()}>
            {t("tryAgain")}
          </button>
          <Link href="/studio" className="btn">
            {t("reload")}
          </Link>
          <Link href="/" className="btn btn-ghost">
            {t("backHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
