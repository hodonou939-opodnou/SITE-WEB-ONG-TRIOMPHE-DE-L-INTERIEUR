import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/donate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/donate", () => {
  it("rejects a non-positive amount", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ amount: 0, countryCode: "BJ", dialCode: "+229", phone: "96966501" }));
    expect(res.status).toBe(400);
  });

  it("rejects an unknown country code", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ amount: 5000, countryCode: "XX", dialCode: "+000", phone: "96966501" }));
    expect(res.status).toBe(400);
  });

  it("rejects a missing phone number", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ amount: 5000, countryCode: "BJ", dialCode: "+229", phone: "" }));
    expect(res.status).toBe(400);
  });

  // Feexpay n'est pas encore câblé (voir lib/feexpay.ts) : un payload
  // valide doit échouer proprement avec un message clair, pas planter ni
  // faire croire à un paiement réussi.
  it("fails clearly when Feexpay isn't configured yet, for an otherwise valid payload", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      makeRequest({ amount: 5000, countryCode: "BJ", dialCode: "+229", operator: "MTN", phone: "96966501" })
    );
    const json = await res.json();
    expect(res.status).toBe(503);
    expect(json.error).toContain("Feexpay");
  });
});
