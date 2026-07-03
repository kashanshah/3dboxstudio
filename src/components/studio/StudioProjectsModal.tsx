"use client";

import { useCallback, useEffect, useState } from "react";
import StudioDialog from "./StudioDialog";

type ProjectSummary = {
  id: string;
  previewToken: string;
  name: string | null;
  updatedAt: string;
  createdAt: string;
  thumbnailUrl: string | null;
};

type StudioProjectsModalProps = {
  open: boolean;
  onClose: () => void;
  onOpenProject: (id: string) => void;
  onStatus: (message: string) => void;
};

function formatUpdated(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function StudioProjectsModal({ open, onClose, onOpenProject, onStatus }: StudioProjectsModalProps) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        setError(
          typeof data === "object" && data !== null && typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Could not load your projects."
        );
        setProjects([]);
        return;
      }
      const list = (data as { projects?: ProjectSummary[] }).projects ?? [];
      setProjects(list);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const renameProject = useCallback(
    async (project: ProjectSummary) => {
      const next = window.prompt("Rename project", project.name ?? "");
      if (next === null) return;
      setBusyId(project.id);
      try {
        const res = await fetch(`/api/shares/${encodeURIComponent(project.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: next.trim() }),
        });
        if (!res.ok) {
          onStatus("Could not rename project.");
          return;
        }
        setProjects((prev) =>
          prev.map((p) => (p.id === project.id ? { ...p, name: next.trim() || null } : p))
        );
        onStatus("Project renamed.");
      } finally {
        setBusyId(null);
      }
    },
    [onStatus]
  );

  const deleteProject = useCallback(
    async (project: ProjectSummary) => {
      const label = project.name ? `“${project.name}”` : "this project";
      if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
      setBusyId(project.id);
      try {
        const res = await fetch(`/api/shares/${encodeURIComponent(project.id)}`, { method: "DELETE" });
        if (!res.ok) {
          onStatus("Could not delete project.");
          return;
        }
        setProjects((prev) => prev.filter((p) => p.id !== project.id));
        onStatus("Project deleted.");
      } finally {
        setBusyId(null);
      }
    },
    [onStatus]
  );

  return (
    <StudioDialog
      title="My Projects"
      open={open}
      onClose={onClose}
      width={560}
      footer={
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Close
        </button>
      }
    >
      {loading ? (
        <p className="studio-dialog-hint">Loading your projects…</p>
      ) : error ? (
        <p className="studio-dialog-error" role="alert">
          {error}
        </p>
      ) : projects.length === 0 ? (
        <p className="studio-dialog-hint">
          You haven't saved any projects yet. Design a box, then use <strong>File → Save As</strong> to store it here.
        </p>
      ) : (
        <ul className="studio-projects-list">
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
                <span className="studio-projects-name">{project.name ?? "Untitled design"}</span>
                <span className="studio-projects-meta">Updated {formatUpdated(project.updatedAt)}</span>
              </div>
              <div className="studio-projects-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busyId === project.id}
                  onClick={() => onOpenProject(project.id)}
                >
                  Open
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={busyId === project.id}
                  onClick={() => void renameProject(project)}
                >
                  Rename
                </button>
                <button
                  type="button"
                  className="btn btn-ghost studio-projects-delete"
                  disabled={busyId === project.id}
                  onClick={() => void deleteProject(project)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </StudioDialog>
  );
}
