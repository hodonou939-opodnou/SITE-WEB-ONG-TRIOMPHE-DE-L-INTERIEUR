import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

describe("GET /api/donate/status", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects a request with no reference", async () => {
    const { GET } = await import("./route");
    const res = await GET(new NextRequest("http://localhost:3000/api/donate/status"));
    expect(res.status).toBe(400);
  });

  it("returns the real status from Feexpay for a given reference", async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ status: "SUCCESSFUL" }), { status: 200 })) as typeof fetch;
    const { GET } = await import("./route");
    const res = await GET(new NextRequest("http://localhost:3000/api/donate/status?reference=ref-123"));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.status).toBe("SUCCESSFUL");
  });

  it("surfaces the reason when a transaction failed", async () => {
    global.fetch = vi.fn(
      async () => new Response(JSON.stringify({ status: "FAILED", reason: "LOW_BALANCE" }), { status: 200 })
    ) as typeof fetch;
    const { GET } = await import("./route");
    const res = await GET(new NextRequest("http://localhost:3000/api/donate/status?reference=ref-123"));
    const json = await res.json();
    expect(json.status).toBe("FAILED");
    expect(json.reason).toBe("LOW_BALANCE");
  });
});
