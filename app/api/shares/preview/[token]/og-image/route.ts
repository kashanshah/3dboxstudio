import { NextResponse } from "next/server";
import { getSharePreviewOgImage } from "@/server/shareService";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const image = await getSharePreviewOgImage(token);
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
    console.error("GET /api/shares/preview/[token]/og-image failed:", e);
    return NextResponse.json({ error: "Could not load preview image." }, { status: 500 });
  }
}
