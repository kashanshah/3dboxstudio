import type { Metadata } from "next";
import AdminEmailTemplateViewer from "@/components/admin/AdminEmailTemplateViewer";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminSettingsPanel from "@/components/admin/AdminSettingsPanel";
import { getAdminSettings } from "@/server/admin/settings";

export const metadata: Metadata = {
  title: "Admin — Settings",
};

export default async function AdminSettingsPage() {
  const settings = await getAdminSettings();

  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="Configure admin notification delivery and preview the live email templates."
        itemName="setting"
      />
      <AdminSettingsPanel
        initialNotificationEmail={settings.notificationEmail}
        initialNotificationPreferences={settings.notificationPreferences}
      />
      <AdminEmailTemplateViewer />
    </>
  );
}
