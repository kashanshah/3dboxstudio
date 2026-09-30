import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { deleteProject, ProjectError, renameProject } from "@/server/projectService";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Please sign in to update a project." }, { status: 401 });
    const { id } = await context.params;
    const body: unknown = await req.json().catch(() => null);
    const name = typeof body === "object" && body !== null && typeof (body as { name?: unknown }).name === "string"
      ? (body as { name: string }).name
      : "";
    return NextResponse.json(await renameProject(user.id, id, name));
  } catch (e) {
    if (e instanceof ProjectError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("PATCH /api/projects/[id] failed:", e);
    return NextResponse.json({ error: "Could not rename project." }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Please sign in to delete a project." }, { status: 401 });
    const { id } = await context.params;
    const body: unknown = await req.json().catch(() => null);
    const destinationProjectId =
      typeof body === "object" && body !== null && typeof (body as { destinationProjectId?: unknown }).destinationProjectId === "string"
        ? (body as { destinationProjectId: string }).destinationProjectId
        : null;
    const result = await deleteProject(user.id, id, destinationProjectId);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof ProjectError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("DELETE /api/projects/[id] failed:", e);
    return NextResponse.json({ error: "Could not delete project." }, { status: 500 });
  }
}
