"use client";

import { useState, type FormEvent } from "react";

type AdminSettingsPanelProps = {
  initialNotificationEmail: string;
};

export default function AdminSettingsPanel({ initialNotificationEmail }: AdminSettingsPanelProps) {
  const [notificationEmail, setNotificationEmail] = useState(initialNotificationEmail);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationEmail }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; notificationEmail?: string };

      if (!res.ok) {
        setError(body.error ?? "Could not save settings.");
        return;
      }

      setNotificationEmail(body.notificationEmail ?? notificationEmail);
      setSuccess("Settings saved.");
    } catch {
      setError("Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2>Notifications</h2>
        <p className="admin-panel-meta">Used for contact alerts and other admin emails</p>
      </div>
      <form className="admin-settings-form" onSubmit={onSubmit}>
        {error ? <p className="admin-error">{error}</p> : null}
        {success ? <p className="admin-success">{success}</p> : null}

        <label className="admin-settings-field" htmlFor="admin-notification-email">
          <span>Admin notification email</span>
          <input
            id="admin-notification-email"
            type="email"
            autoComplete="email"
            value={notificationEmail}
            onChange={(event) => setNotificationEmail(event.target.value)}
            placeholder="notifications@example.com"
            required
          />
        </label>

        <div className="admin-settings-actions">
          <button className="admin-btn" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save settings"}
          </button>
          <p className="admin-muted">
            This overrides the fallback `ADMIN_EMAIL` environment value for Resend notifications.
          </p>
        </div>
      </form>
    </div>
  );
}
