import { describe, expect, it } from "vitest";
import { validateFaceArtworkFile } from "./faceArtworkUpload";

function file(name: string, type: string, size: number): File {
  return { name, type, size } as File;
}

describe("validateFaceArtworkFile", () => {
  it("rejects unsupported types even when the client-supplied MIME looks generic", () => {
    expect(validateFaceArtworkFile(file("art.svg", "image/svg+xml", 1000))?.kind).toBe("unsupported");
    expect(validateFaceArtworkFile(file("notes.txt", "text/plain", 1000))?.kind).toBe("unsupported");
  });

  it("accepts jpg/png/webp by MIME or extension and enforces the size cap", () => {
    expect(validateFaceArtworkFile(file("panel.jpg", "image/jpeg", 1000))).toBeNull();
    expect(validateFaceArtworkFile(file("panel.PNG", "", 1000))).toBeNull();
    expect(validateFaceArtworkFile(file("huge.jpg", "image/jpeg", 3 * 1024 * 1024))?.kind).toBe("too_large");
  });
});
