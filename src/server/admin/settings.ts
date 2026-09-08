import { getSql } from "@/server/db";

export type AdminNotificationPreferenceKey =
  | "signup"
  | "export"
  | "contactMessage"
  | "newsletterSubmission";

export type AdminNotificationPreferences = Record<AdminNotificationPreferenceKey, boolean>;

export type AdminSettings = {
  notificationEmail: string;
  notificationPreferences: AdminNotificationPreferences;
};

type AdminSettingRow = {
  key: string;
  value: unknown;
};

const NOTIFICATION_EMAIL_KEY = "notification_email";
const NOTIFICATION_PREFERENCES_KEY = "notification_preferences";

export const DEFAULT_ADMIN_NOTIFICATION_PREFERENCES: AdminNotificationPreferences = {
  signup: true,
  export: true,
  contactMessage: true,
  newsletterSubmission: true,
};

function sanitizePreferences(value: unknown): AdminNotificationPreferences {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    signup:
      typeof raw.signup === "boolean" ? raw.signup : DEFAULT_ADMIN_NOTIFICATION_PREFERENCES.signup,
    export:
      typeof raw.export === "boolean" ? raw.export : DEFAULT_ADMIN_NOTIFICATION_PREFERENCES.export,
    contactMessage:
      typeof raw.contactMessage === "boolean"
        ? raw.contactMessage
        : DEFAULT_ADMIN_NOTIFICATION_PREFERENCES.contactMessage,
    newsletterSubmission:
      typeof raw.newsletterSubmission === "boolean"
        ? raw.newsletterSubmission
        : DEFAULT_ADMIN_NOTIFICATION_PREFERENCES.newsletterSubmission,
  };
}

export async function getAdminSettings(): Promise<AdminSettings> {
  const sql = getSql();
  const rows = (await sql`
    SELECT key, value
    FROM admin_settings
    WHERE key IN (${NOTIFICATION_EMAIL_KEY}, ${NOTIFICATION_PREFERENCES_KEY})
  `) as AdminSettingRow[];

  const notification = rows.find((row) => row.key === NOTIFICATION_EMAIL_KEY)?.value as
    | { email?: unknown }
    | undefined;
  const preferences = rows.find((row) => row.key === NOTIFICATION_PREFERENCES_KEY)?.value;

  return {
    notificationEmail:
      typeof notification?.email === "string" && notification.email.trim() ? notification.email.trim() : "",
    notificationPreferences: sanitizePreferences(preferences),
  };
}

export async function setAdminSettings(settings: AdminSettings): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO admin_settings (key, value, updated_at)
    VALUES (${NOTIFICATION_EMAIL_KEY}, ${JSON.stringify({ email: settings.notificationEmail })}::jsonb, NOW())
    ON CONFLICT (key)
    DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;
  await sql`
    INSERT INTO admin_settings (key, value, updated_at)
    VALUES (
      ${NOTIFICATION_PREFERENCES_KEY},
      ${JSON.stringify(settings.notificationPreferences)}::jsonb,
      NOW()
    )
    ON CONFLICT (key)
    DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;
}

export function isAdminNotificationEnabled(
  settings: Pick<AdminSettings, "notificationPreferences">,
  key: AdminNotificationPreferenceKey
): boolean {
  return settings.notificationPreferences[key];
}
