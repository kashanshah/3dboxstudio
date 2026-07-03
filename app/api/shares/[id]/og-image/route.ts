import { NextResponse } from "next/server";
import { assertCanCreateShare } from "@/server/shareAuth";
import { ShareError, getShareOgImage, updateShareOgImage } from "@/server/shareService";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: Request, context: RouteContext) {
  try {
    await assertCanCreateShare(req);
    const { id } = await context.params;
    const width = Number(req.headers.get("X-Share-Og-Image-Width"));
    const height = Number(req.headers.get("X-Share-Og-Image-Height"));
    const buffer = Buffer.from(await req.arrayBuffer());

    const result = await updateShareOgImage(id, buffer, width, height);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof ShareError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("PUT /api/shares/[id]/og-image failed:", e);
    const message =
      e instanceof Error && e.message.includes("is not configured")
        ? "Share is not configured on this server."
        : "Could not upload preview image.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const image = await getShareOgImage(id);
    if (!image) {
      return NextResponse.json({ error: "Preview image not found." }, { status: 404 });
    }

    return new NextResponse(image.body, {
      status: 200,
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    console.error("GET /api/shares/[id]/og-image failed:", e);
    return NextResponse.json({ error: "Could not load preview image." }, { status: 500 });
  }
}
