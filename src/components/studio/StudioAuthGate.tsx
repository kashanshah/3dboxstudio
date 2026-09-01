"use client";

import Link from "next/link";

type StudioAuthGateProps = {
  onSignUp: () => void;
  onSignIn: () => void;
};

export default function StudioAuthGate({ onSignUp, onSignIn }: StudioAuthGateProps) {
  return (
    <div className="studio-auth-gate" role="region" aria-labelledby="studio-auth-gate-title">
      <div className="studio-auth-gate-card">
        <p className="studio-auth-gate-eyebrow">3D Box Studio</p>
        <h1 id="studio-auth-gate-title" className="studio-auth-gate-title">
          Create a free account to start designing
        </h1>
        <p className="studio-auth-gate-lead">
          Sign up to open the 3D box designer—set dimensions, materials, openings, and
          per-face artwork. Save to the cloud, share preview links, and export PNG mockups.
          Email verification is optional for now.
        </p>
        <div className="studio-auth-gate-actions">
          <button type="button" className="btn btn-primary" onClick={onSignUp}>
            Create free account
          </button>
          <button type="button" className="btn btn-ghost" onClick={onSignIn}>
            Sign in
          </button>
        </div>
        <p className="studio-auth-gate-hint">
          Shared project links and view-only previews stay open without an account.
          Temporary email addresses (YOPmail, Mailinator, etc.) are not accepted.
        </p>
        <p className="studio-auth-gate-home">
          <Link href="/" className="studio-auth-gate-home-link">
            ← Back to homepage
          </Link>
        </p>
      </div>
    </div>
  );
}
