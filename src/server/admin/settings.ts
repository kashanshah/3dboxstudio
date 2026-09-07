import { getSql } from "@/server/db";

export type AdminSettings = {
  notificationEmail: string;
};

type AdminSettingRow = {
  key: string;
  value: unknown;
};

const NOTIFICATION_EMAIL_KEY = "notification_email";

export async function getAdminSettings(): Promise<AdminSettings> {
  const sql = getSql();
  const rows = (await sql`
    SELECT key, value
    FROM admin_settings
    WHERE key = ${NOTIFICATION_EMAIL_KEY}
  `) as AdminSettingRow[];

  const notification = rows.find((row) => row.key === NOTIFICATION_EMAIL_KEY)?.value as
    | { email?: unknown }
    | undefined;

  return {
    notificationEmail:
      typeof notification?.email === "string" && notification.email.trim() ? notification.email.trim() : "",
  };
}

export async function setAdminNotificationEmail(email: string): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO admin_settings (key, value, updated_at)
    VALUES (${NOTIFICATION_EMAIL_KEY}, ${JSON.stringify({ email })}::jsonb, NOW())
    ON CONFLICT (key)
    DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;
}
