"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuthUser } from "@/lib/authTypes";
import StudioDialog from "./StudioDialog";

export type StudioProjectOption = {
  id: string;
  name: string;
  isDefault: boolean;
  designCount: number;
  sceneCount: number;
  updatedAt: string;
  createdAt: string;
};

type Props = {
  user: AuthUser | null;
  value: string | null;
  onChange: (projectId: string | null) => void;
  label?: string;
  disabled?: boolean;
};

export default function StudioProjectSelect({
  user,
  value,
  onChange,
  label = "Project",
  disabled = false,
}: Props) {
  const [projects, setProjects] = useState<StudioProjectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setProjects([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) throw new Error("Could not load projects.");
      const list = (data as { projects?: StudioProjectOption[] })?.projects ?? [];
      setProjects(list);
      const valid = value && list.some((project) => project.id === value);
      if (!valid) {
        const fallback = list.find((project) => project.isDefault) ?? list[0] ?? null;
        onChange(fallback?.id ?? null);
      }
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [onChange, user, value]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(
    () => projects.find((project) => project.id === value) ?? null,
    [projects, value]
  );

  const create = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a project name.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          typeof data === "object" && data !== null && typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Could not create project.";
        throw new Error(message);
      }
      const project = (data as { project?: StudioProjectOption }).project;
      if (!project) throw new Error("Could not create project.");
      setProjects((current) => [project, ...current]);
      onChange(project.id);
      setName("");
      setCreateOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create project.");
    } finally {
      setCreating(false);
    }
  }, [name, onChange]);

  if (!user) return null;

  return (
    <>
      <div className="studio-project-select">
        <label className="studio-dialog-label" htmlFor="studio-project-select">
          {label}
        </label>
        <div className="studio-project-select-row">
          <select
            id="studio-project-select"
            className="studio-dialog-input"
            value={selected?.id ?? ""}
            disabled={disabled || loading}
            onChange={(event) => onChange(event.target.value || null)}
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}{project.isDefault ? " · Default" : ""}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={disabled}
            onClick={() => {
              setError(null);
              setName("");
              setCreateOpen(true);
            }}
          >
            New project
          </button>
        </div>
        {selected ? (
          <p className="studio-dialog-hint">
            {selected.designCount} design{selected.designCount === 1 ? "" : "s"} · {selected.sceneCount} scene{selected.sceneCount === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>

      <StudioDialog
        title="New project"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" disabled={creating} onClick={() => void create()}>
              {creating ? "Creating…" : "Create project"}
            </button>
          </>
        }
      >
        <p className="studio-dialog-lead">Create an umbrella for related box designs and scenes.</p>
        <label className="studio-dialog-label" htmlFor="studio-new-project-name">Project name</label>
        <input
          id="studio-new-project-name"
          className="studio-dialog-input"
          type="text"
          maxLength={120}
          autoFocus
          value={name}
          placeholder="e.g. Holiday Campaign"
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") void create();
          }}
        />
        {error ? <p className="studio-dialog-error" role="alert">{error}</p> : null}
      </StudioDialog>
    </>
  );
}
