"use client";

import { useEffect, useMemo, useState } from "react";
import StudioDialog from "../studio/StudioDialog";
import { useAuth } from "./AuthProvider";

export type AccountSettingsTab = "account" | "profile" | "password";

const MIN_PASSWORD_LENGTH = 8;

type AccountSettingsModalProps = {
  open: boolean;
  initialTab?: AccountSettingsTab;
  onClose: () => void;
  onStatus?: (message: string) => void;
};

const TABS: { id: AccountSettingsTab; label: string; hint: string }[] = [
  { id: "account", label: "Account", hint: "Email and verification" },
  { id: "profile", label: "Profile", hint: "Display name" },
  { id: "password", label: "Password", hint: "Change password" },
];

function formatMemberSince(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(date);
}

export default function AccountSettingsModal({
  open,
  initialTab = "account",
  onClose,
  onStatus,
}: AccountSettingsModalProps) {
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

  const memberSince = useMemo(() => formatMemberSince(user?.createdAt ?? ""), [user?.createdAt]);

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
    setSuccess("Profile updated.");
    onStatus?.("Profile updated.");
  };

  const savePassword = async () => {
    setError(null);
    setSuccess(null);
    if (!currentPassword) {
      setError("Enter your current password.");
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
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
    setSuccess("Password changed.");
    onStatus?.("Password changed.");
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
    setSuccess("Verification email sent. Check your inbox.");
    onStatus?.("Verification email sent. Check your inbox.");
  };

  const saveEmail = async () => {
    setError(null);
    setSuccess(null);
    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail) {
      setError("Enter a new email address.");
      return;
    }
    if (!emailPassword) {
      setError("Enter your current password to confirm this change.");
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
    setSuccess("Email updated. Check your inbox to verify the new address.");
    onStatus?.("Email updated. Check your inbox to verify the new address.");
    setShowEmailForm(false);
  };

  if (!user) return null;

  return (
    <StudioDialog title="Account settings" open={open} onClose={onClose} width={680}>
      <div className="studio-settings-layout">
        <nav className="studio-settings-tabs" role="tablist" aria-label="Account settings sections">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`settings-tab-${item.id}`}
              aria-selected={tab === item.id}
              aria-controls={`settings-panel-${item.id}`}
              className={`studio-settings-tab${tab === item.id ? " is-active" : ""}`}
              onClick={() => {
                setTab(item.id);
                setError(null);
                setSuccess(null);
                setShowEmailForm(false);
              }}
            >
              <span className="studio-settings-tab-label">{item.label}</span>
              <span className="studio-settings-tab-hint">{item.hint}</span>
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
              <h3 className="studio-settings-section-title">Account</h3>
              <p className="studio-dialog-hint studio-settings-section-lead">
                Your sign-in email and verification status.
              </p>

              <div className="studio-settings-field">
                <span className="studio-settings-field-label">Current email</span>
                <span className="studio-settings-field-value">{user.email}</span>
              </div>

              <div className="studio-settings-field">
                <span className="studio-settings-field-label">Verification</span>
                <span className="studio-settings-field-value">
                  {user.emailVerified ? (
                    <span className="studio-settings-badge studio-settings-badge--ok">Verified</span>
                  ) : (
                    <span className="studio-settings-badge studio-settings-badge--warn">Not verified</span>
                  )}
                </span>
              </div>

              {!user.emailVerified && (
                <p className="studio-dialog-hint">
                  Verify your email to save and share projects from the cloud.
                </p>
              )}

              <div className="studio-settings-divider" aria-hidden />

              {showEmailForm ? (
                <>
                  <h4 className="studio-settings-subsection-title">Change email</h4>
                  <p className="studio-dialog-hint studio-settings-section-lead">
                    Enter a new address and your current password. We&apos;ll send a verification link to the new email.
                  </p>

                  <label className="studio-dialog-label" htmlFor="settings-new-email">
                    New email
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

                  <label className="studio-dialog-label" htmlFor="settings-email-password">
                    Current password
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

                  <div className="studio-settings-actions">
                    <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void saveEmail()}>
                      {busy ? "Updating…" : "Update email"}
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
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <div className="studio-settings-actions">
                  <button type="button" className="btn" onClick={() => setShowEmailForm(true)}>
                    Update email
                  </button>
                  {!user.emailVerified && (
                    <button type="button" className="btn" disabled={resendBusy} onClick={() => void handleResend()}>
                      {resendBusy ? "Sending…" : "Resend verification email"}
                    </button>
                  )}
                </div>
              )}

              <div className="studio-settings-divider" aria-hidden />

              <div className="studio-settings-field">
                <span className="studio-settings-field-label">Member since</span>
                <span className="studio-settings-field-value">{memberSince}</span>
              </div>

              <div className="studio-settings-field">
                <span className="studio-settings-field-label">Account ID</span>
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
              <h3 className="studio-settings-section-title">Profile</h3>
              <p className="studio-dialog-hint studio-settings-section-lead">
                This name appears in the studio menu and on your saved projects.
              </p>

              <label className="studio-dialog-label" htmlFor="settings-name">
                Display name
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
              <p className="studio-dialog-hint">Leave blank to show your email initial in the menu avatar.</p>

              <div className="studio-settings-actions">
                <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void saveProfile()}>
                  {busy ? "Saving…" : "Save profile"}
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
              <h3 className="studio-settings-section-title">Change password</h3>
              <p className="studio-dialog-hint studio-settings-section-lead">
                Choose a strong password you do not use on other sites.
              </p>

              <label className="studio-dialog-label" htmlFor="settings-current-password">
                Current password
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

              <label className="studio-dialog-label" htmlFor="settings-new-password">
                New password
              </label>
              <input
                id="settings-new-password"
                className="studio-dialog-input"
                type="password"
                autoComplete="new-password"
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError(null);
                  setSuccess(null);
                }}
              />

              <label className="studio-dialog-label" htmlFor="settings-confirm-password">
                Confirm new password
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

              <div className="studio-settings-actions">
                <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void savePassword()}>
                  {busy ? "Updating…" : "Change password"}
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
