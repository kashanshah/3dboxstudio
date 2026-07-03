"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ResetInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError(null);
    if (!token) {
      setError("This reset link is missing its token.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        setError(
          typeof data === "object" && data !== null && typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Could not reset your password."
        );
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="verify-card">
        <div className="verify-icon verify-icon--success" aria-hidden>
          ✓
        </div>
        <h1 className="verify-title">Password updated</h1>
        <p className="verify-message">
          Your password has been reset and you're now signed in. Other devices have been signed out.
        </p>
        <Link className="btn btn-primary verify-cta" href="/studio">
          Go to the studio
        </Link>
      </div>
    );
  }

  return (
    <div className="verify-card verify-card--form">
      <h1 className="verify-title">Choose a new password</h1>
      <p className="verify-message">Enter a new password for your 3D Box Studio account.</p>

      {!token && (
        <p className="studio-dialog-error" role="alert">
          This reset link is missing its token. Request a new one from the studio.
        </p>
      )}

      <label className="studio-dialog-label" htmlFor="reset-password">
        New password
      </label>
      <input
        id="reset-password"
        className="studio-dialog-input"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setError(null);
        }}
      />

      <label className="studio-dialog-label" htmlFor="reset-confirm">
        Confirm password
      </label>
      <input
        id="reset-confirm"
        className="studio-dialog-input"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => {
          setConfirm(e.target.value);
          setError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") void submit();
        }}
      />

      {error && (
        <p className="studio-dialog-error" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        className="btn btn-primary verify-cta"
        disabled={busy || !token}
        onClick={() => void submit()}
      >
        {busy ? "Updating…" : "Reset password"}
      </button>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="verify-page">
      <Suspense fallback={<div className="verify-card"><p className="verify-message">Loading…</p></div>}>
        <ResetInner />
      </Suspense>
    </div>
  );
}
