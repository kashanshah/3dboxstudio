"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { AuthUser } from "@/lib/authTypes";
import StudioDialog from "./StudioDialog";
import StudioProjectsPanel from "./StudioProjectsPanel";

type StudioStartDialogProps = {
  open: boolean;
  user: AuthUser | null;
  onClose: () => void;
  onCreateNew: () => void;
  onOpenProject: (id: string) => void;
  onImport: () => void;
  onRequireSignUp: () => void;
  onSignIn: () => void;
  onStatus: (message: string) => void;
};

export default function StudioStartDialog({
  open,
  user,
  onClose,
  onCreateNew,
  onOpenProject,
  onImport,
  onRequireSignUp,
  onSignIn,
  onStatus,
}: StudioStartDialogProps) {
  const t = useTranslations("studio.startDialog");
  const handleCreateNew = () => {
    if (!user) {
      onRequireSignUp();
      return;
    }
    onCreateNew();
  };

  const handleOpenProject = (id: string) => {
    if (!user) {
      onRequireSignUp();
      return;
    }
    onOpenProject(id);
  };

  const handleImport = () => {
    if (!user) {
      onRequireSignUp();
      return;
    }
    onImport();
  };

  return (
    <StudioDialog
      title={t("title")}
      open={open}
      onClose={onClose}
      width={560}
      footer={
        <>
          <Link href="/" className="btn btn-ghost">
            {t("goToWebsite")}
          </Link>
          <button type="button" className="btn btn-primary" onClick={handleCreateNew}>
            {t("createNew")}
          </button>
        </>
      }
    >
      <p className="studio-dialog-lead">
        {t("lead")}
      </p>

      <div className="studio-start-projects">
        <h3 className="studio-open-section-title">{t("savedDesigns")}</h3>
        <StudioProjectsPanel
          open={open}
          user={user}
          onSignIn={onSignIn}
          onOpenProject={handleOpenProject}
          onStatus={onStatus}
          emptyMessage={t("empty")}
          listClassName="studio-projects-list studio-projects-list--start"
        />
      </div>

      <p className="studio-dialog-hint">
        {t("offlineBefore")}{" "}
        <button type="button" className="studio-auth-switch" onClick={handleImport}>
          {t("importJson")}
        </button>{" "}
        {t("offlineAfter")}
      </p>
    </StudioDialog>
  );
}
