import { describe, expect, it, vi } from "vitest";
import { createSharedFileObjectUrls } from "./faceObjectUrls";

function fakeFile(name: string): File {
  return { name, size: 8, type: "image/jpeg" } as File;
}

describe("createSharedFileObjectUrls", () => {
  it("reuses one object URL for the same source file and revokes it once", () => {
    const shared = fakeFile("dieline.jpg");
    const created: string[] = [];
    const revoked: string[] = [];
    const createObjectURL = vi.fn((file: File) => {
      const url = `blob:${file.name}:${created.length}`;
      created.push(url);
      return url;
    });
    const revokeObjectURL = vi.fn((url: string) => {
      revoked.push(url);
    });

    const { urls, revoke } = createSharedFileObjectUrls(
      { front: shared, back: shared, left: fakeFile("other.jpg") },
      createObjectURL,
      revokeObjectURL
    );

    expect(createObjectURL).toHaveBeenCalledTimes(2);
    expect(urls.front).toBe(urls.back);
    expect(urls.left).not.toBe(urls.front);
    revoke();
    expect(revoked).toHaveLength(2);
    expect(revoked).toContain(urls.front);
    expect(revoked).toContain(urls.left);
  });
});
