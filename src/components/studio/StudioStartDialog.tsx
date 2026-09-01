"use client";

import StudioDialog from "./StudioDialog";
import type { AuthUser } from "@/lib/authTypes";

type StudioStartDialogProps = {
  open: boolean;
  user: AuthUser | null;
  onClose: () => void;
  onCreateNew: () => void;
  onOpenProject: () => void;
  onImport: () => void;
  onRequireSignUp: () => void;
};

export default function StudioStartDialog({
  open,
  user,
  onClose,
  onCreateNew,
  onOpenProject,
  onImport,
  onRequireSignUp,
}: StudioStartDialogProps) {
  const handleCreateNew = () => {
    if (!user) {
      onRequireSignUp();
      return;
    }
    onCreateNew();
  };

  const handleOpenProject = () => {
    if (!user) {
      onRequireSignUp();
      return;
    }
    onOpenProject();
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
      title="3D Box Studio"
      open={open}
      onClose={onClose}
      width={520}
      footer={
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Close
        </button>
      }
    >
      <p className="studio-dialog-lead">
        Start a new box design or open one of your saved projects.
      </p>

      <div className="studio-start-grid">
        <button type="button" className="studio-start-card" onClick={handleCreateNew}>
          <span className="studio-start-card-title">Create a new project</span>
          <span className="studio-start-card-desc">
            Jump straight into the designer. Your work saves to the cloud automatically.
          </span>
        </button>

        <button type="button" className="studio-start-card" onClick={handleOpenProject}>
          <span className="studio-start-card-title">Open a project</span>
          <span className="studio-start-card-desc">
            Browse and reopen the projects saved to your account.
          </span>
        </button>
      </div>

      <p className="studio-dialog-hint">
        Prefer working offline? You can also{" "}
        <button type="button" className="studio-auth-switch" onClick={handleImport}>
          import a JSON file
        </button>{" "}
        from a previous export.
      </p>
    </StudioDialog>
  );
}
