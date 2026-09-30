import { customAlphabet } from "nanoid";
import { getSql } from "./db";

const createProjectId = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 14);

export const DEFAULT_PROJECT_NAME = "My Project";

export type StudioProjectSummary = {
  id: string;
  name: string;
  isDefault: boolean;
  designCount: number;
  sceneCount: number;
  createdAt: string;
  updatedAt: string;
};

export class ProjectError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ProjectError";
    this.status = status;
  }
}

export async function ensureDefaultProject(userId: string): Promise<string> {
  const sql = getSql();
  const existing = (await sql`
    SELECT id
    FROM projects
    WHERE user_id = ${userId} AND is_default = TRUE
    LIMIT 1
  `) as { id: string }[];
  if (existing[0]?.id) return existing[0].id;

  const id = createProjectId();
  try {
    const rows = (await sql`
      INSERT INTO projects (id, user_id, name, is_default)
      VALUES (${id}, ${userId}, ${DEFAULT_PROJECT_NAME}, TRUE)
      ON CONFLICT DO NOTHING
      RETURNING id
    `) as { id: string }[];
    if (rows[0]?.id) return rows[0].id;
  } catch {
    // Another request may have created the default project concurrently.
  }

  const retry = (await sql`
    SELECT id
    FROM projects
    WHERE user_id = ${userId} AND is_default = TRUE
    LIMIT 1
  `) as { id: string }[];
  if (!retry[0]?.id) throw new ProjectError("Could not create the default project.", 500);
  return retry[0].id;
}

export async function resolveOwnedProjectId(userId: string, requestedProjectId?: string | null): Promise<string> {
  if (!requestedProjectId) return ensureDefaultProject(userId);
  const sql = getSql();
  const rows = (await sql`
    SELECT id FROM projects WHERE id = ${requestedProjectId} AND user_id = ${userId} LIMIT 1
  `) as { id: string }[];
  return rows[0]?.id ?? ensureDefaultProject(userId);
}

export async function listProjects(userId: string): Promise<StudioProjectSummary[]> {
  await ensureDefaultProject(userId);
  const sql = getSql();
  const rows = (await sql`
    SELECT
      p.id,
      p.name,
      p.is_default,
      p.created_at,
      GREATEST(
        p.updated_at,
        COALESCE(MAX(d.updated_at), p.updated_at),
        COALESCE(MAX(s.updated_at), p.updated_at)
      ) AS updated_at,
      COUNT(DISTINCT d.id)::int AS design_count,
      COUNT(DISTINCT s.id)::int AS scene_count
    FROM projects p
    LEFT JOIN shared_designs d
      ON d.project_id = p.id
      AND (d.expires_at IS NULL OR d.expires_at > NOW())
    LEFT JOIN scenes s ON s.project_id = p.id
    WHERE p.user_id = ${userId}
    GROUP BY p.id
    ORDER BY p.is_default DESC, updated_at DESC
  `) as {
    id: string;
    name: string;
    is_default: boolean;
    created_at: string;
    updated_at: string;
    design_count: number;
    scene_count: number;
  }[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    isDefault: row.is_default,
    designCount: Number(row.design_count ?? 0),
    sceneCount: Number(row.scene_count ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createProject(userId: string, rawName: string): Promise<StudioProjectSummary> {
  const name = rawName.trim().slice(0, 120);
  if (!name) throw new ProjectError("Enter a project name.", 400);
  const sql = getSql();
  const id = createProjectId();
  const rows = (await sql`
    INSERT INTO projects (id, user_id, name, is_default)
    VALUES (${id}, ${userId}, ${name}, FALSE)
    RETURNING id, name, is_default, created_at, updated_at
  `) as {
    id: string;
    name: string;
    is_default: boolean;
    created_at: string;
    updated_at: string;
  }[];

  const row = rows[0];
  if (!row) throw new ProjectError("Could not create project.", 500);
  return {
    id: row.id,
    name: row.name,
    isDefault: row.is_default,
    designCount: 0,
    sceneCount: 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function renameProject(userId: string, projectId: string, rawName: string): Promise<{ id: string; name: string }> {
  const name = rawName.trim().slice(0, 120);
  if (!name) throw new ProjectError("Enter a project name.", 400);
  const sql = getSql();
  const rows = (await sql`
    UPDATE projects
    SET name = ${name}, updated_at = NOW()
    WHERE id = ${projectId} AND user_id = ${userId}
    RETURNING id, name
  `) as { id: string; name: string }[];
  if (!rows[0]) throw new ProjectError("Project not found.", 404);
  return rows[0];
}

export async function moveDesignToProject(userId: string, designId: string, projectId: string): Promise<void> {
  const destinationId = await resolveOwnedProjectId(userId, projectId);
  const sql = getSql();
  const rows = (await sql`
    UPDATE shared_designs
    SET project_id = ${destinationId}, updated_at = NOW()
    WHERE id = ${designId} AND user_id = ${userId}
    RETURNING id
  `) as { id: string }[];
  if (!rows[0]) throw new ProjectError("Design not found.", 404);
  await sql`UPDATE projects SET updated_at = NOW() WHERE id = ${destinationId}`;
}

export async function deleteProject(
  userId: string,
  projectId: string,
  destinationProjectId?: string | null
): Promise<{ movedToProjectId: string }> {
  const sql = getSql();
  const existing = (await sql`
    SELECT id, is_default FROM projects WHERE id = ${projectId} AND user_id = ${userId} LIMIT 1
  `) as { id: string; is_default: boolean }[];
  if (!existing[0]) throw new ProjectError("Project not found.", 404);
  if (existing[0].is_default) throw new ProjectError("My Project cannot be deleted.", 400);

  const fallbackId = destinationProjectId
    ? await resolveOwnedProjectId(userId, destinationProjectId)
    : await ensureDefaultProject(userId);
  if (fallbackId === projectId) throw new ProjectError("Choose a different destination project.", 400);

  await sql`UPDATE shared_designs SET project_id = ${fallbackId}, updated_at = NOW() WHERE user_id = ${userId} AND project_id = ${projectId}`;
  await sql`UPDATE scenes SET project_id = ${fallbackId}, updated_at = NOW() WHERE user_id = ${userId} AND project_id = ${projectId}`;
  await sql`DELETE FROM projects WHERE id = ${projectId} AND user_id = ${userId} AND is_default = FALSE`;
  await sql`UPDATE projects SET updated_at = NOW() WHERE id = ${fallbackId}`;
  return { movedToProjectId: fallbackId };
}
