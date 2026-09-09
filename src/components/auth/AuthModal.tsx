"use client";

import { useEffect, useState } from "react";
import StudioDialog from "../studio/StudioDialog";
import { useAuth } from "./AuthProvider";
import GoogleSignInButton from "./GoogleSignInButton";
import { useTranslations } from "next-intl";

type AuthMode = "signin" | "signup" | "forgot";

type AuthModalProps = {
  open: boolean;
  initialMode?: "signin" | "signup";
  onClose: () => void;
  onSuccess?: () => void;
};

export default function AuthModal({ open, initialMode = "signin", onClose, onSuccess }: AuthModalProps) {
  const t = useTranslations("studio.auth");
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
      setError(t("enterEmail"));
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
      setNotice(t("resetSent"));
      return;
    }

    if (mode === "signup" && password.length < 8) {
      setError(t("passwordMinimum"));
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
    ? t("pleaseWait")
    : mode === "signin"
      ? t("signIn")
      : mode === "signup"
        ? t("createAccount")
        : t("sendResetLink");

  return (
    <StudioDialog
      title={t(`titles.${mode}`)}
      open={open}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {t("cancel")}
          </button>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void submit()}>
            {submitLabel}
          </button>
        </>
      }
    >
      <p className="studio-dialog-lead">
        {mode === "signin"
          ? t("signInLead")
          : mode === "signup"
            ? t("signUpLead")
            : t("forgotLead")}
      </p>

      {mode !== "forgot" && (
        <>
          <GoogleSignInButton className="mb-5" disabled={busy} />
          <div className="block studio-auth-divider mb-3" role="separator">
            <span>{t("or")}</span>
          </div>
        </>
      )}

      {mode === "signup" && (
        <div className="mb-3">
          <label className="studio-dialog-label" htmlFor="auth-name">
            {t("name")} <span className="studio-dialog-optional">{t("optional")}</span>
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
        </div>
      )}

      <div className="mb-3">
      <label className="studio-dialog-label" htmlFor="auth-email">
        {t("email")}
      </label>
      <input
        id="auth-email"
        className="studio-dialog-input"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError(null);
        }}
        autoFocus
      />
      </div>

      {mode !== "forgot" && (
        <div className="mb-3">
          <label className="studio-dialog-label" htmlFor="auth-password">
            {t("password")}
          </label>
          <input
            id="auth-password"
            className="studio-dialog-input"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            placeholder={mode === "signup" ? t("atLeastEight") : ""}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
          />
        </div>
      )}

      {mode === "signin" && (
        <div className="studio-auth-forgot-row">
          <button type="button" className="studio-auth-switch" onClick={() => switchMode("forgot")}>
            {t("forgotPassword")}
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
            {t("noAccount")} {" "}
            <button type="button" className="studio-auth-switch" onClick={() => switchMode("signup")}>
              {t("createOne")}
            </button>
          </>
        )}
        {mode === "signup" && (
          <div className="mb-3">
            {t("alreadyAccount")} {" "}
            <button type="button" className="studio-auth-switch" onClick={() => switchMode("signin")}>
              {t("signIn")}
            </button>
          </div>
        )}
        {mode === "forgot" && (
          <div className="mb-3">
            {t("remembered")} {" "}
            <button type="button" className="studio-auth-switch" onClick={() => switchMode("signin")}>
              {t("backToSignIn")}
            </button>
          </div>
        )}
      </p>
    </StudioDialog>
  );
}
