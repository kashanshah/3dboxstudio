import { NextResponse } from "next/server";
import { assertCanCreateShare } from "@/server/shareAuth";
import { ShareError, deleteShare, getShare, renameShare, updateShare } from "@/server/shareService";
import { moveDesignToProject, ProjectError } from "@/server/projectService";
import { parseShareSaveRequest } from "@/server/shareSaveRequest";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: Request, context: RouteContext) {
  try {
    const userId = await assertCanCreateShare(req);
    const { id } = await context.params;
    const rawBody = await req.text();
    if (!rawBody.trim()) {
      return NextResponse.json({ error: "Request body is empty." }, { status: 400 });
    }
    const { designJson } = parseShareSaveRequest(req, rawBody);
    const result = await updateShare(id, designJson, userId);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof ShareError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("PUT /api/shares/[id] failed:", e);
    const message =
      e instanceof Error && e.message.includes("is not configured")
        ? "Share is not configured on this server."
        : "Could not update share.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const userId = await assertCanCreateShare(req);
    const { id } = await context.params;
    const body: unknown = await req.json().catch(() => null);
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Expected a JSON request body." }, { status: 400 });
    }

    const hasName = "name" in body && typeof (body as { name?: unknown }).name === "string";
    const hasProjectId = "projectId" in body && typeof (body as { projectId?: unknown }).projectId === "string";
    if (!hasName && !hasProjectId) {
      return NextResponse.json({ error: "Expected a name or projectId field." }, { status: 400 });
    }

    let result: { id: string; name?: string | null; updatedAt?: string; projectId?: string } = { id };
    if (hasName) {
      result = { ...result, ...(await renameShare(id, (body as { name: string }).name, userId)) };
    }
    if (hasProjectId) {
      const projectId = (body as { projectId: string }).projectId;
      await moveDesignToProject(userId, id, projectId);
      result.projectId = projectId;
    }
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof ShareError || e instanceof ProjectError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("PATCH /api/shares/[id] failed:", e);
    const message =
      e instanceof Error && e.message.includes("is not configured")
        ? "Share is not configured on this server."
        : "Could not rename share.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const userId = await assertCanCreateShare(req);
    const { id } = await context.params;
    await deleteShare(id, userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ShareError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("DELETE /api/shares/[id] failed:", e);
    return NextResponse.json({ error: "Could not delete project." }, { status: 500 });
  }
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = await getShare(id);
    if (!payload) {
      return NextResponse.json({ error: "Share not found or expired." }, { status: 404 });
    }
    return NextResponse.json(payload);
  } catch (e) {
    console.error("GET /api/shares/[id] failed:", e);
    const message =
      e instanceof Error && e.message.includes("is not configured")
        ? "Share is not configured on this server."
        : "Could not load shared design.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
