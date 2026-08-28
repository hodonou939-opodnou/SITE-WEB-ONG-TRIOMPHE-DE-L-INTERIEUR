// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { InvalidAmbassadorPhotoError, uploadAmbassadorPhoto } from "./photo";
import { createAdminClient } from "@/lib/supabase/admin";

// 1x1 PNG, transparent pixel.
const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

function buildFile(type: string, name: string, bytes: Buffer = Buffer.from(TINY_PNG_BASE64, "base64")) {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe("uploadAmbassadorPhoto", () => {
  const uploadedPaths: string[] = [];

  afterEach(async () => {
    if (uploadedPaths.length === 0) return;
    const supabase = createAdminClient();
    await supabase.storage.from("ambassador-photos").remove(uploadedPaths.splice(0));
  });

  it("uploads a valid PNG to the public bucket and returns a fetchable public URL", async () => {
    const file = buildFile("image/png", "photo.png");
    const url = await uploadAmbassadorPhoto(file);

    expect(url).toContain("/storage/v1/object/public/ambassador-photos/");
    uploadedPaths.push(new URL(url).pathname.split("/ambassador-photos/")[1]);

    const res = await fetch(url);
    expect(res.status).toBe(200);
  });

  it("rejects an unsupported file type without uploading anything", async () => {
    const file = buildFile("application/pdf", "not-a-photo.pdf");
    await expect(uploadAmbassadorPhoto(file)).rejects.toBeInstanceOf(InvalidAmbassadorPhotoError);
  });

  it("rejects a file over the 5MB size limit", async () => {
    const oversized = Buffer.alloc(5 * 1024 * 1024 + 1);
    const file = buildFile("image/png", "huge.png", oversized);
    await expect(uploadAmbassadorPhoto(file)).rejects.toBeInstanceOf(InvalidAmbassadorPhotoError);
  });
});
