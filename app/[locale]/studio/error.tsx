"use client";

import Link from "next/link";

export default function StudioRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="studio-error-fallback studio-error-fallback--page" role="alert">
      <div className="studio-error-fallback-card">
        <h1 className="studio-error-fallback-title">Something went wrong in the studio</h1>
        <p className="studio-error-fallback-lead">
          The 3D Box Studio page hit an unexpected error. Your design may still be recoverable from a share link or JSON
          export.
        </p>
        {error.message && (
          <p className="studio-error-fallback-detail">
            <code>{error.message}</code>
          </p>
        )}
        <div className="studio-error-fallback-actions">
          <button type="button" className="btn btn-primary" onClick={() => reset()}>
            Try again
          </button>
          <Link href="/studio" className="btn">
            Reload studio
          </Link>
          <Link href="/" className="btn btn-ghost">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
