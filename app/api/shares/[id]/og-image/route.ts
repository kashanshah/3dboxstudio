import { NextResponse } from "next/server";
import { getShareOgImage } from "@/server/shareService";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

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
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (e) {
    console.error("GET /api/shares/[id]/og-image failed:", e);
    return NextResponse.json({ error: "Could not load preview image." }, { status: 500 });
  }
}
