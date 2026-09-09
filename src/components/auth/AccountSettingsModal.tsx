"use client";

import { useEffect, useMemo, useState } from "react";
import StudioDialog from "../studio/StudioDialog";
import { useAuth } from "./AuthProvider";
import { useTranslations, useLocale } from "next-intl";

export type AccountSettingsTab = "account" | "profile" | "password";

const MIN_PASSWORD_LENGTH = 8;

type AccountSettingsModalProps = {
  open: boolean;
  initialTab?: AccountSettingsTab;
  onClose: () => void;
  onStatus?: (message: string) => void;
};

const TABS: AccountSettingsTab[] = ["account", "profile", "password"];

function formatMemberSince(iso: string, locale: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(date);
}

export default function AccountSettingsModal({
  open,
  initialTab = "account",
  onClose,
  onStatus,
}: AccountSettingsModalProps) {
  const t = useTranslations("studio.settings");
  const locale = useLocale();
  const { user, updateProfile, updateEmail, changePassword, resendVerification } = useAuth();
  const [tab, setTab] = useState<AccountSettingsTab>(initialTab);
  const [name, setName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    setName(user?.name ?? "");
    setNewEmail("");
    setEmailPassword("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(null);
    setShowEmailForm(false);
  }, [open, initialTab, user?.name]);

  const memberSince = useMemo(() => formatMemberSince(user?.createdAt ?? "", locale), [user?.createdAt, locale]);

  const saveProfile = async () => {
    setError(null);
    setSuccess(null);
    setBusy(true);
    const result = await updateProfile(name);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(t("profileUpdated"));
    onStatus?.(t("profileUpdated"));
  };

  const savePassword = async () => {
    if (!user) return;
    setError(null);
    setSuccess(null);
    if (user.hasPassword && !currentPassword) {
      setError(t("enterCurrentPassword"));
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(t("newPasswordMinimum", { count: MIN_PASSWORD_LENGTH }));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("passwordsMismatch"));
      return;
    }
    setBusy(true);
    const result = await changePassword(currentPassword, newPassword);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSuccess(user.hasPassword ? t("passwordChanged") : t("passwordSet"));
    onStatus?.(user.hasPassword ? t("passwordChanged") : t("passwordSet"));
  };

  const handleResend = async () => {
    setError(null);
    setSuccess(null);
    setResendBusy(true);
    const result = await resendVerification();
    setResendBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(t("verificationSent"));
    onStatus?.(t("verificationSent"));
  };

  const saveEmail = async () => {
    if (!user) return;
    setError(null);
    setSuccess(null);
    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail) {
      setError(t("enterNewEmail"));
      return;
    }
    if (user.hasPassword && !emailPassword) {
      setError(t("confirmWithPassword"));
      return;
    }
    setBusy(true);
    const result = await updateEmail(trimmedEmail, emailPassword);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNewEmail("");
    setEmailPassword("");
    setSuccess(t("emailUpdated"));
    onStatus?.(t("emailUpdated"));
    setShowEmailForm(false);
  };

  if (!user) return null;

  return (
    <StudioDialog title={t("title")} open={open} onClose={onClose} width={680}>
      <div className="studio-settings-layout">
        <nav className="studio-settings-tabs" role="tablist" aria-label={t("sections")}>
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              id={`settings-tab-${item}`}
              aria-selected={tab === item}
              aria-controls={`settings-panel-${item}`}
              className={`studio-settings-tab${tab === item ? " is-active" : ""}`}
              onClick={() => {
                setTab(item);
                setError(null);
                setSuccess(null);
                setShowEmailForm(false);
              }}
            >
              <span className="studio-settings-tab-label">{t(`tabs.${item}.label`)}</span>
              <span className="studio-settings-tab-hint">{t(`tabs.${item}.hint`)}</span>
            </button>
          ))}
        </nav>

        <div className="studio-settings-panel">
          {tab === "account" && (
            <div
              role="tabpanel"
              id="settings-panel-account"
              aria-labelledby="settings-tab-account"
              className="studio-settings-section"
            >
              <h3 className="studio-settings-section-title">{t("account")}</h3>
              <p className="studio-dialog-hint studio-settings-section-lead">
                {t("accountLead")}
              </p>

              <div className="studio-settings-field">
                <span className="studio-settings-field-label">{t("currentEmail")}</span>
                <span className="studio-settings-field-value">{user.email}</span>
              </div>

              <div className="studio-settings-field">
                <span className="studio-settings-field-label">{t("verification")}</span>
                <span className="studio-settings-field-value">
                  {user.emailVerified ? (
                    <span className="studio-settings-badge studio-settings-badge--ok">{t("verified")}</span>
                  ) : (
                    <span className="studio-settings-badge studio-settings-badge--warn">{t("notVerified")}</span>
                  )}
                </span>
              </div>

              {!user.emailVerified && (
                <p className="studio-dialog-hint">
                  {t("verifyHint")}
                </p>
              )}

              <div className="studio-settings-divider" aria-hidden />

              {showEmailForm ? (
                <>
                  <h4 className="studio-settings-subsection-title">{t("changeEmail")}</h4>
                  <p className="studio-dialog-hint studio-settings-section-lead">
                    {user.hasPassword
                      ? t("changeEmailPasswordLead")
                      : t("changeEmailLead")}
                  </p>

                  <label className="studio-dialog-label" htmlFor="settings-new-email">
                    {t("newEmail")}
                  </label>
                  <input
                    id="settings-new-email"
                    className="studio-dialog-input"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={newEmail}
                    onChange={(e) => {
                      setNewEmail(e.target.value);
                      setError(null);
                      setSuccess(null);
                    }}
                  />

                  {user.hasPassword && (
                    <>
                      <label className="studio-dialog-label" htmlFor="settings-email-password">
                        {t("currentPassword")}
                      </label>
                      <input
                        id="settings-email-password"
                        className="studio-dialog-input"
                        type="password"
                        autoComplete="current-password"
                        value={emailPassword}
                        onChange={(e) => {
                          setEmailPassword(e.target.value);
                          setError(null);
                          setSuccess(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void saveEmail();
                        }}
                      />
                    </>
                  )}

                  <div className="studio-settings-actions">
                    <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void saveEmail()}>
                      {busy ? t("updating") : t("updateEmail")}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={busy}
                      onClick={() => {
                        setShowEmailForm(false);
                        setNewEmail("");
                        setEmailPassword("");
                        setError(null);
                      }}
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </>
              ) : (
                <div className="studio-settings-actions">
                  <button type="button" className="btn" onClick={() => setShowEmailForm(true)}>
                    {t("updateEmail")}
                  </button>
                  {!user.emailVerified && (
                    <button type="button" className="btn" disabled={resendBusy} onClick={() => void handleResend()}>
                      {resendBusy ? t("sending") : t("resendVerification")}
                    </button>
                  )}
                </div>
              )}

              <div className="studio-settings-divider" aria-hidden />

              <div className="studio-settings-field">
                <span className="studio-settings-field-label">{t("memberSince")}</span>
                <span className="studio-settings-field-value">{memberSince}</span>
              </div>

              <div className="studio-settings-field">
                <span className="studio-settings-field-label">{t("accountId")}</span>
                <span className="studio-settings-field-value studio-settings-mono">{user.id}</span>
              </div>
            </div>
          )}

          {tab === "profile" && (
            <div
              role="tabpanel"
              id="settings-panel-profile"
              aria-labelledby="settings-tab-profile"
              className="studio-settings-section"
            >
              <h3 className="studio-settings-section-title">{t("profile")}</h3>
              <p className="studio-dialog-hint studio-settings-section-lead">
                {t("profileLead")}
              </p>

              <div className="mb-3">
              <label className="studio-dialog-label" htmlFor="settings-name">
                {t("displayName")}
              </label>
              <input
                id="settings-name"
                className="studio-dialog-input"
                type="text"
                autoComplete="name"
                maxLength={80}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                  setSuccess(null);
                }}
              />
              <p className="studio-dialog-hint">{t("displayNameHint")}</p>
              </div>

              <div className="studio-settings-actions">
                <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void saveProfile()}>
                  {busy ? t("saving") : t("saveProfile")}
                </button>
              </div>
            </div>
          )}

          {tab === "password" && (
            <div
              role="tabpanel"
              id="settings-panel-password"
              aria-labelledby="settings-tab-password"
              className="studio-settings-section"
            >
              <h3 className="studio-settings-section-title">
                {user.hasPassword ? t("changePassword") : t("setAPassword")}
              </h3>
              <p className="studio-dialog-hint studio-settings-section-lead">
                {user.hasPassword
                  ? t("passwordLead")
                  : t("setPasswordLead")}
              </p>

              {user.hasPassword && (
              <div className="mb-3">
              <label className="studio-dialog-label" htmlFor="settings-current-password">
                {t("currentPassword")}
              </label>
              <input
                id="settings-current-password"
                className="studio-dialog-input"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setError(null);
                  setSuccess(null);
                }}
              />
              </div>
              )}

              <div className="mb-3">
              <label className="studio-dialog-label" htmlFor="settings-new-password">
                {t("newPassword")}
              </label>
              <input
                id="settings-new-password"
                className="studio-dialog-input"
                type="password"
                autoComplete="new-password"
                placeholder={t("atLeastCharacters", { count: MIN_PASSWORD_LENGTH })}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError(null);
                  setSuccess(null);
                }}
              />
              </div>

              <div className="mb-3">
              <label className="studio-dialog-label" htmlFor="settings-confirm-password">
                {t("confirmNewPassword")}
              </label>
              <input
                id="settings-confirm-password"
                className="studio-dialog-input"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError(null);
                  setSuccess(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void savePassword();
                }}
              />
              </div>
              <div className="studio-settings-actions">
                <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void savePassword()}>
                  {busy ? t("updating") : user.hasPassword ? t("changePassword") : t("setPassword")}
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="studio-dialog-error" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="studio-settings-success" role="status">
              {success}
            </p>
          )}
        </div>
      </div>
    </StudioDialog>
  );
}
