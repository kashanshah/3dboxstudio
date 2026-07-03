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
};

export default function StudioStartDialog({
  open,
  user,
  onClose,
  onCreateNew,
  onOpenProject,
  onImport,
}: StudioStartDialogProps) {
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
        <button type="button" className="studio-start-card" onClick={onCreateNew}>
          <span className="studio-start-card-title">Create a new project</span>
          <span className="studio-start-card-desc">
            Jump straight into the designer. You can save it to the cloud once you sign in.
          </span>
        </button>

        <button type="button" className="studio-start-card" onClick={onOpenProject}>
          <span className="studio-start-card-title">Open a project</span>
          <span className="studio-start-card-desc">
            {user
              ? "Browse and reopen the projects saved to your account."
              : "Sign in to browse and reopen your saved projects."}
          </span>
        </button>
      </div>

      <p className="studio-dialog-hint">
        Prefer working offline? You can also{" "}
        <button type="button" className="studio-auth-switch" onClick={onImport}>
          import a JSON file
        </button>
        . Anonymous designs work fully — only cloud saving and sharing require an account.
      </p>
    </StudioDialog>
  );
}
