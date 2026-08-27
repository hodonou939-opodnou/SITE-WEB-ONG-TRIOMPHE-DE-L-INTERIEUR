import { describe, expect, it, vi } from "vitest";
import { sendWhatsApp } from "./whatsapp";

describe("sendWhatsApp", () => {
  it("returns a clear not-configured error without making a network call", async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    const result = await sendWhatsApp("+2290100000001", "Test");

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/pas encore configuré/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
