"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type VerifyState = "verifying" | "success" | "error";

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<VerifyState>("verifying");
  const [message, setMessage] = useState("Verifying your email…");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!token) {
      setState("error");
      setMessage("This verification link is missing its token.");
      return;
    }

    void (async () => {
      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data: unknown = await res.json().catch(() => null);
        const ok = res.ok && typeof data === "object" && data !== null && (data as { ok?: unknown }).ok === true;
        if (ok) {
          setState("success");
          setMessage("Your email is verified. You can now save and share your projects.");
        } else {
          setState("error");
          setMessage(
            typeof data === "object" && data !== null && typeof (data as { error?: unknown }).error === "string"
              ? (data as { error: string }).error
              : "We couldn't verify this link."
          );
        }
      } catch {
        setState("error");
        setMessage("Network error while verifying. Please try again.");
      }
    })();
  }, [token]);

  return (
    <div className="verify-card">
      <div className={`verify-icon verify-icon--${state}`} aria-hidden>
        {state === "success" ? "✓" : state === "error" ? "!" : "…"}
      </div>
      <h1 className="verify-title">
        {state === "success" ? "Email verified" : state === "error" ? "Verification failed" : "Verifying…"}
      </h1>
      <p className="verify-message">{message}</p>
      <Link className="btn btn-primary verify-cta" href="/studio">
        {state === "success" ? "Go to the studio" : "Back to the studio"}
      </Link>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="verify-page">
      <Suspense fallback={<div className="verify-card"><p className="verify-message">Loading…</p></div>}>
        <VerifyInner />
      </Suspense>
    </div>
  );
}
