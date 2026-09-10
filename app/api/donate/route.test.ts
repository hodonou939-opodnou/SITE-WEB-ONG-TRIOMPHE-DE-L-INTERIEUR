import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// FEEXPAY_API_KEY est réellement configurée (.env.local, chargé par
// vitest.config.ts) : sans ce mock, chaque test enverrait une vraie
// requête "request to pay" à l'API Feexpay en production, avec un vrai
// push Mobile Money vers le numéro de test. Même précaution déjà en place
// pour Brevo dans app/api/admin/messages/send/route.test.ts.
function mockFeexpayFetch(response: unknown, status = 200) {
  global.fetch = vi.fn(async () => new Response(JSON.stringify(response), { status })) as typeof fetch;
}

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/donate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/donate", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects an amount below the Feexpay minimum (100 XOF)", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ amount: 50, countryCode: "BJ", dialCode: "+229", operator: "MTN", phone: "96966501" }));
    expect(res.status).toBe(400);
  });

  it("rejects an amount above the Feexpay maximum (2,000,000 XOF)", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      makeRequest({ amount: 3_000_000, countryCode: "BJ", dialCode: "+229", operator: "MTN", phone: "96966501" })
    );
    expect(res.status).toBe(400);
  });

  it("rejects an unknown country code", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      makeRequest({ amount: 5000, countryCode: "XX", dialCode: "+000", operator: "MTN", phone: "96966501" })
    );
    expect(res.status).toBe(400);
  });

  it("rejects a missing phone number", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ amount: 5000, countryCode: "BJ", dialCode: "+229", operator: "MTN", phone: "" }));
    expect(res.status).toBe(400);
  });

  it("rejects a missing operator", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ amount: 5000, countryCode: "BJ", dialCode: "+229", phone: "96966501" }));
    expect(res.status).toBe(400);
  });

  it("rejects an operator that doesn't exist for the given country", async () => {
    const { POST } = await import("./route");
    // Wave n'existe que pour la Côte d'Ivoire, pas le Bénin.
    const res = await POST(
      makeRequest({ amount: 5000, countryCode: "BJ", dialCode: "+229", operator: "Wave", phone: "96966501" })
    );
    expect(res.status).toBe(400);
  });

  it("returns a pending reference for a standard push network (MTN Bénin)", async () => {
    mockFeexpayFetch({ reference: "ref-123", message: "Accepted", status: "PENDING" });
    const { POST } = await import("./route");
    const res = await POST(
      makeRequest({ amount: 5000, countryCode: "BJ", dialCode: "+229", operator: "MTN", phone: "96966501" })
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.status).toBe("PENDING");
    expect(json.paymentUrl).toBeNull();
  });

  it("returns a payment_url for a redirect network (Wave Côte d'Ivoire)", async () => {
    mockFeexpayFetch({ reference: "ref-456", order_id: "ref-456", payment_url: "https://pay.wave.com/c/example" });
    const { POST } = await import("./route");
    const res = await POST(
      makeRequest({ amount: 5000, countryCode: "CI", dialCode: "+225", operator: "Wave", phone: "0766000000" })
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.paymentUrl).toBe("https://pay.wave.com/c/example");
  });

  it("flags that an OTP is required on the first Coris (Bénin) call", async () => {
    mockFeexpayFetch({ reference: "ref-789", status: "PENDING" });
    const { POST } = await import("./route");
    const res = await POST(
      makeRequest({ amount: 5000, countryCode: "BJ", dialCode: "+229", operator: "Coris", phone: "96966501" })
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.requiresOtp).toBe(true);
  });

  it("surfaces a Feexpay-reported failure (e.g. insufficient balance) as an error", async () => {
    mockFeexpayFetch({
      reference: "ref-000",
      status: "FAILED",
      response_operator: { description: ["Balance is insufficient"] },
    });
    const { POST } = await import("./route");
    const res = await POST(
      makeRequest({ amount: 5000, countryCode: "BJ", dialCode: "+229", operator: "Moov", phone: "96966501" })
    );
    const json = await res.json();
    expect(res.status).toBe(503);
    expect(json.error).toContain("insufficient");
  });
});
