"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { AuthUser } from "@/lib/authTypes";
import { DEFAULT_UNTITLED_SHARE_NAME, shareNameError } from "@/lib/shareName";
import StudioDialog from "./StudioDialog";

type ProjectSummary = {
  id: string;
  previewToken: string;
  name: string | null;
  updatedAt: string;
  createdAt: string;
  thumbnailUrl: string | null;
};

type StudioProjectsPanelProps = {
  open: boolean;
  user: AuthUser | null;
  onSignIn: () => void;
  onOpenProject: (id: string) => void;
  onStatus: (message: string) => void;
  emptyMessage?: string;
  listClassName?: string;
};

function formatUpdated(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function StudioProjectsPanel({
  open,
  user,
  onSignIn,
  onOpenProject,
  onStatus,
  emptyMessage,
  listClassName = "studio-projects-list",
}: StudioProjectsPanelProps) {
  const t = useTranslations("studio.projects");
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [renameProject, setRenameProject] = useState<ProjectSummary | null>(null);
  const [renameInput, setRenameInput] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [deleteProject, setDeleteProject] = useState<ProjectSummary | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        setError(
          typeof data === "object" && data !== null && typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : t("errors.load")
        );
        setProjects([]);
        return;
      }
      const list = (data as { projects?: ProjectSummary[] }).projects ?? [];
      setProjects(list);
    } catch {
      setError(t("errors.network"));
    } finally {
      setLoading(false);
    }
  }, [t, user]);

  useEffect(() => {
    if (open && user) void load();
    if (!open) {
      setProjects([]);
      setError(null);
      setLoading(false);
      setRenameProject(null);
      setDeleteProject(null);
    }
  }, [open, user, load]);

  const openRenameDialog = useCallback((project: ProjectSummary) => {
    setRenameProject(project);
    setRenameInput(project.name ?? "");
    setRenameError(null);
  }, []);

  const closeRenameDialog = useCallback(() => {
    setRenameProject(null);
    setRenameInput("");
    setRenameError(null);
  }, []);

  const submitRename = useCallback(async () => {
    if (!renameProject) return;
    const validationError = shareNameError(renameInput);
    if (validationError) {
      setRenameError(validationError);
      return;
    }

    setBusyId(renameProject.id);
    try {
      const res = await fetch(`/api/shares/${encodeURIComponent(renameProject.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameInput.trim() }),
      });
      if (!res.ok) {
        onStatus(t("errors.rename"));
        return;
      }
      const nextName = renameInput.trim() || null;
      setProjects((prev) =>
        prev.map((p) => (p.id === renameProject.id ? { ...p, name: nextName } : p))
      );
      onStatus(t("status.renamed"));
      closeRenameDialog();
    } finally {
      setBusyId(null);
    }
  }, [closeRenameDialog, onStatus, renameInput, renameProject, t]);

  const submitDelete = useCallback(async () => {
    if (!deleteProject) return;
    setBusyId(deleteProject.id);
    try {
      const res = await fetch(`/api/shares/${encodeURIComponent(deleteProject.id)}`, { method: "DELETE" });
      if (!res.ok) {
        onStatus(t("errors.delete"));
        return;
      }
      setProjects((prev) => prev.filter((p) => p.id !== deleteProject.id));
      onStatus(t("status.deleted"));
      setDeleteProject(null);
    } finally {
      setBusyId(null);
    }
  }, [deleteProject, onStatus, t]);

  if (!user) {
    return (
      <div className="studio-open-projects-guest">
        <p className="studio-dialog-hint">
          {t("signInHint")}
        </p>
        <button type="button" className="btn" onClick={onSignIn}>
          {t("signIn")}
        </button>
      </div>
    );
  }

  if (loading) {
    return <p className="studio-dialog-hint">{t("loading")}</p>;
  }

  if (error) {
    return (
      <p className="studio-dialog-error" role="alert">
        {error}
      </p>
    );
  }

  if (projects.length === 0) {
    return (
      <p className="studio-dialog-hint">
        {emptyMessage ?? t("empty")}
      </p>
    );
  }

  return (
    <>
      <ul className={listClassName}>
        {projects.map((project) => (
          <li key={project.id} className="studio-projects-item">
            <div className="studio-projects-thumb" aria-hidden>
              {project.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={project.thumbnailUrl} alt="" loading="lazy" />
              ) : (
                <span className="studio-projects-thumb-empty">3D</span>
              )}
            </div>
            <div className="studio-projects-main">
              <span className="studio-projects-name">{project.name ?? DEFAULT_UNTITLED_SHARE_NAME}</span>
              <span className="studio-projects-meta">{t("updated", { date: formatUpdated(project.updatedAt) })}</span>
            </div>
            <div className="studio-projects-actions">
              <button
                type="button"
                className="btn btn-primary"
                disabled={busyId === project.id}
                onClick={() => onOpenProject(project.id)}
              >
                {t("open")}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={busyId === project.id}
                onClick={() => openRenameDialog(project)}
              >
                {t("rename")}
              </button>
              <button
                type="button"
                className="btn btn-ghost studio-projects-delete"
                disabled={busyId === project.id}
                onClick={() => setDeleteProject(project)}
              >
                {t("delete")}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <StudioDialog
        title={t("renameProjectTitle")}
        open={renameProject !== null}
        onClose={closeRenameDialog}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={closeRenameDialog}>
              {t("cancel")}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busyId !== null}
              onClick={() => void submitRename()}
            >
              {busyId ? t("saving") : t("rename")}
            </button>
          </>
        }
      >
        <p className="studio-dialog-lead">{t("renameLead")}</p>
        <label className="studio-dialog-label" htmlFor="studio-project-rename-input">
          {t("projectName")}
        </label>
        <input
          id="studio-project-rename-input"
          className="studio-dialog-input"
          type="text"
          placeholder={t("renamePlaceholder")}
          value={renameInput}
          maxLength={120}
          onChange={(e) => {
            setRenameInput(e.target.value);
            setRenameError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submitRename();
          }}
          autoFocus
        />
        {renameError && (
          <p className="studio-dialog-error" role="alert">
            {renameError}
          </p>
        )}
      </StudioDialog>

      <StudioDialog
        title={t("deleteProjectTitle")}
        open={deleteProject !== null}
        onClose={() => setDeleteProject(null)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setDeleteProject(null)}>
              {t("cancel")}
            </button>
            <button
              type="button"
              className="btn btn-primary studio-projects-delete"
              disabled={busyId !== null}
              onClick={() => void submitDelete()}
            >
              {busyId ? t("deleting") : t("deleteProject")}
            </button>
          </>
        }
      >
        <p className="studio-dialog-lead">
          {t.rich("deleteLead", {
            strong: (chunks) => <strong>{chunks}</strong>,
            project: deleteProject?.name ? `“${deleteProject.name}”` : t("thisProject"),
          })}
        </p>
        <p className="studio-dialog-hint">{t("deleteHint")}</p>
      </StudioDialog>
    </>
  );
}
