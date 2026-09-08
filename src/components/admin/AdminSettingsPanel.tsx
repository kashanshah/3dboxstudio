"use client";

import { useState, type FormEvent } from "react";
import type { AdminNotificationPreferences } from "@/server/admin/settings";

type AdminSettingsPanelProps = {
  initialNotificationEmail: string;
  initialNotificationPreferences: AdminNotificationPreferences;
};

const PREFERENCE_FIELDS: {
  key: keyof AdminNotificationPreferences;
  label: string;
  description: string;
}[] = [
  { key: "signup", label: "New sign ups", description: "Alert me when a new account is created." },
  { key: "export", label: "Exports", description: "Reserve export alert preferences for future export notifications." },
  {
    key: "contactMessage",
    label: "Contact form submissions",
    description: "Alert me when a new contact message is submitted.",
  },
  {
    key: "newsletterSubmission",
    label: "Newsletter submissions",
    description: "Alert me when newsletter intake/subscription records are created.",
  },
];

export default function AdminSettingsPanel({
  initialNotificationEmail,
  initialNotificationPreferences,
}: AdminSettingsPanelProps) {
  const [notificationEmail, setNotificationEmail] = useState(initialNotificationEmail);
  const [notificationPreferences, setNotificationPreferences] = useState(initialNotificationPreferences);
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
        body: JSON.stringify({ notificationEmail, notificationPreferences }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        notificationEmail?: string;
        notificationPreferences?: AdminNotificationPreferences;
      };

      if (!res.ok) {
        setError(body.error ?? "Could not save settings.");
        return;
      }

      setNotificationEmail(body.notificationEmail ?? notificationEmail);
      setNotificationPreferences(body.notificationPreferences ?? notificationPreferences);
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

        <fieldset className="admin-settings-group">
          <legend>Notification alerts</legend>
          <div className="admin-settings-toggles">
            {PREFERENCE_FIELDS.map((field) => (
              <label key={field.key} className="admin-settings-toggle">
                <input
                  type="checkbox"
                  checked={notificationPreferences[field.key]}
                  onChange={(event) =>
                    setNotificationPreferences((current) => ({
                      ...current,
                      [field.key]: event.target.checked,
                    }))
                  }
                />
                <span>
                  <strong>{field.label}</strong>
                  <small>{field.description}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

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
