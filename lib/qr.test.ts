import { describe, expect, it } from "vitest";
import { generateQrDataUrl } from "./qr";

describe("generateQrDataUrl", () => {
  it("resolves to a PNG data URL", async () => {
    const dataUrl = await generateQrDataUrl("some-attendance-token");
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it("produces different output for different input tokens", async () => {
    const a = await generateQrDataUrl("token-a");
    const b = await generateQrDataUrl("token-b");
    expect(a).not.toBe(b);
  });
});
