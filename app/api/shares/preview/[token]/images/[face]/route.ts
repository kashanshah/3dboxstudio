import { NextResponse } from "next/server";
import { getSharePreviewFaceImage } from "@/server/shareService";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ token: string; face: string }> };

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { token, face } = await context.params;
    const image = await getSharePreviewFaceImage(token, face);
    if (!image) {
      return NextResponse.json({ error: "Image not found." }, { status: 404 });
    }
    return new NextResponse(image.body, {
      status: 200,
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    console.error("GET /api/shares/preview/[token]/images/[face] failed:", e);
    return NextResponse.json({ error: "Could not load image." }, { status: 500 });
  }
}
