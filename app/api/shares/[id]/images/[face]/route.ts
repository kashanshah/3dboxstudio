import { NextResponse } from "next/server";
import { getShareFaceImage } from "@/server/shareService";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string; face: string }> };

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id, face } = await context.params;
    const image = await getShareFaceImage(id, face);
    if (!image) {
      return NextResponse.json({ error: "Image not found." }, { status: 404 });
    }
    return new NextResponse(Buffer.from(image.body), {
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    console.error("GET /api/shares/[id]/images/[face] failed:", e);
    return NextResponse.json({ error: "Could not load image." }, { status: 500 });
  }
}
