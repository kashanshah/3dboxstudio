"use client";

import Link from "next/link";
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
      title="3D Box Studio"
      open={open}
      onClose={onClose}
      width={560}
      footer={
        <>
          <Link href="/" className="btn btn-ghost">
            Go to website
          </Link>
          <button type="button" className="btn btn-primary" onClick={handleCreateNew}>
            Create new design
          </button>
        </>
      }
    >
      <p className="studio-dialog-lead">
        Pick up where you left off, or start a fresh box design.
      </p>

      <div className="studio-start-projects">
        <h3 className="studio-open-section-title">Your saved designs</h3>
        <StudioProjectsPanel
          open={open}
          user={user}
          onSignIn={onSignIn}
          onOpenProject={handleOpenProject}
          onStatus={onStatus}
          emptyMessage="You haven't saved any designs yet. Create a new design — artwork uploads auto-save to the cloud."
          listClassName="studio-projects-list studio-projects-list--start"
        />
      </div>

      <p className="studio-dialog-hint">
        Prefer working offline?{" "}
        <button type="button" className="studio-auth-switch" onClick={handleImport}>
          Import a JSON file
        </button>{" "}
        from a previous export.
      </p>
    </StudioDialog>
  );
}
