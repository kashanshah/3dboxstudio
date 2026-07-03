"use client";

import { useEffect, useState } from "react";
import StudioDialog from "../studio/StudioDialog";
import { useAuth } from "./AuthProvider";

type AuthMode = "signin" | "signup" | "forgot";

type AuthModalProps = {
  open: boolean;
  initialMode?: "signin" | "signup";
  onClose: () => void;
  onSuccess?: () => void;
};

const titles: Record<AuthMode, string> = {
  signin: "Sign in",
  signup: "Create your account",
  forgot: "Reset your password",
};

export default function AuthModal({ open, initialMode = "signin", onClose, onSuccess }: AuthModalProps) {
  const { signIn, signUp, forgotPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError(null);
      setNotice(null);
      setPassword("");
    }
  }, [open, initialMode]);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setNotice(null);
  };

  const submit = async () => {
    setError(null);
    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }

    if (mode === "forgot") {
      setBusy(true);
      const result = await forgotPassword(email.trim());
      setBusy(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNotice("If an account exists for that email, we've sent a password reset link. Check your inbox.");
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

  const submitLabel = busy
    ? "Please wait…"
    : mode === "signin"
      ? "Sign in"
      : mode === "signup"
        ? "Create account"
        : "Send reset link";

  return (
    <StudioDialog
      title={titles[mode]}
      open={open}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void submit()}>
            {submitLabel}
          </button>
        </>
      }
    >
      <p className="studio-dialog-lead">
        {mode === "signin"
          ? "Sign in to open, save, and share your projects."
          : mode === "signup"
            ? "Create a free account to save your projects to the cloud. We'll email you a link to verify your address."
            : "Enter your account email and we'll send you a link to choose a new password."}
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

      {mode !== "forgot" && (
        <>
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
        </>
      )}

      {mode === "signin" && (
        <div className="studio-auth-forgot-row">
          <button type="button" className="studio-auth-switch" onClick={() => switchMode("forgot")}>
            Forgot password?
          </button>
        </div>
      )}

      {error && (
        <p className="studio-dialog-error" role="alert">
          {error}
        </p>
      )}

      {notice && (
        <p className="studio-dialog-notice" role="status">
          {notice}
        </p>
      )}

      <p className="studio-dialog-hint">
        {mode === "signin" && (
          <>
            No account yet?{" "}
            <button type="button" className="studio-auth-switch" onClick={() => switchMode("signup")}>
              Create one
            </button>
          </>
        )}
        {mode === "signup" && (
          <>
            Already have an account?{" "}
            <button type="button" className="studio-auth-switch" onClick={() => switchMode("signin")}>
              Sign in
            </button>
          </>
        )}
        {mode === "forgot" && (
          <>
            Remembered it?{" "}
            <button type="button" className="studio-auth-switch" onClick={() => switchMode("signin")}>
              Back to sign in
            </button>
          </>
        )}
      </p>
    </StudioDialog>
  );
}
