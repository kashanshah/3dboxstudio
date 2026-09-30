import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { createProject, listProjects, ProjectError } from "@/server/projectService";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in to view your projects." }, { status: 401 });
    }
    return NextResponse.json({ projects: await listProjects(user.id) });
  } catch (e) {
    console.error("GET /api/projects failed:", e);
    return NextResponse.json({ error: "Could not load your projects." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Please sign in to create a project." }, { status: 401 });
    const body: unknown = await req.json().catch(() => null);
    const name = typeof body === "object" && body !== null && typeof (body as { name?: unknown }).name === "string"
      ? (body as { name: string }).name
      : "";
    return NextResponse.json({ project: await createProject(user.id, name) }, { status: 201 });
  } catch (e) {
    if (e instanceof ProjectError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("POST /api/projects failed:", e);
    return NextResponse.json({ error: "Could not create project." }, { status: 500 });
  }
}
