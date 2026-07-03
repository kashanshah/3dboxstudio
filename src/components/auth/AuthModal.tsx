"use client";

import { useEffect, useState } from "react";
import StudioDialog from "../studio/StudioDialog";
import { useAuth } from "./AuthProvider";

type AuthMode = "signin" | "signup";

type AuthModalProps = {
  open: boolean;
  initialMode?: AuthMode;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function AuthModal({ open, initialMode = "signin", onClose, onSuccess }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError(null);
      setPassword("");
    }
  }, [open, initialMode]);

  const submit = async () => {
    setError(null);
    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }
    if (mode === "signup" && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    const result =
      mode === "signin"
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, name.trim());
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSuccess?.();
    onClose();
  };

  return (
    <StudioDialog
      title={mode === "signin" ? "Sign in" : "Create your account"}
      open={open}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void submit()}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </>
      }
    >
      <p className="studio-dialog-lead">
        {mode === "signin"
          ? "Sign in to open, save, and share your projects."
          : "Create a free account to save your projects to the cloud. We'll email you a link to verify your address."}
      </p>

      {mode === "signup" && (
        <>
          <label className="studio-dialog-label" htmlFor="auth-name">
            Name <span className="studio-dialog-optional">(optional)</span>
          </label>
          <input
            id="auth-name"
            className="studio-dialog-input"
            type="text"
            autoComplete="name"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
          />
        </>
      )}

      <label className="studio-dialog-label" htmlFor="auth-email">
        Email
      </label>
      <input
        id="auth-email"
        className="studio-dialog-input"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError(null);
        }}
        autoFocus
      />

      <label className="studio-dialog-label" htmlFor="auth-password">
        Password
      </label>
      <input
        id="auth-password"
        className="studio-dialog-input"
        type="password"
        autoComplete={mode === "signin" ? "current-password" : "new-password"}
        placeholder={mode === "signup" ? "At least 8 characters" : ""}
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
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

      <p className="studio-dialog-hint">
        {mode === "signin" ? (
          <>
            No account yet?{" "}
            <button type="button" className="studio-auth-switch" onClick={() => setMode("signup")}>
              Create one
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button type="button" className="studio-auth-switch" onClick={() => setMode("signin")}>
              Sign in
            </button>
          </>
        )}
      </p>
    </StudioDialog>
  );
}
