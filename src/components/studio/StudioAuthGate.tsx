"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

type StudioAuthGateProps = {
  onSignUp: () => void;
  onSignIn: () => void;
  oauthError?: string | null;
};

export default function StudioAuthGate({ onSignUp, onSignIn, oauthError }: StudioAuthGateProps) {
  const t = useTranslations("studio.authGate");
  return (
    <div className="studio-auth-gate" role="region" aria-labelledby="studio-auth-gate-title">
      <div className="studio-auth-gate-card">
        <p className="studio-auth-gate-eyebrow">{t("eyebrow")}</p>
        <h1 id="studio-auth-gate-title" className="studio-auth-gate-title">
          {t("title")}
        </h1>
        <p className="studio-auth-gate-lead">
          {t("lead")}
        </p>
        {oauthError && (
          <p className="studio-auth-gate-error" role="alert">
            {oauthError}
          </p>
        )}
        <div className="studio-auth-gate-actions">
          <GoogleSignInButton className="studio-auth-gate-google mb-3" />
          <button type="button" className="btn btn-primary" onClick={onSignUp}>
            {t("createAccount")}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onSignIn}>
            {t("signInEmail")}
          </button>
        </div>
        <p className="studio-auth-gate-hint">
          {t("hint")}
        </p>
        <p className="studio-auth-gate-home">
          <Link href="/" className="studio-auth-gate-home-link">
            {t("backHome")}
          </Link>
        </p>
      </div>
    </div>
  );
}
