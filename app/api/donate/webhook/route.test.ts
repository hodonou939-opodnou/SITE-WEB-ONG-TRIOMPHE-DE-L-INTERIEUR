import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/donate/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/donate/webhook", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Feexpay ne documente aucune signature/secret pour ce webhook (voir
  // docs.feexpay.me > Webhook) : on ne doit jamais agir sur le payload reçu
  // sans le revérifier nous-mêmes via l'API de statut, avec notre propre
  // clé — n'importe qui connaissant cette URL pourrait sinon forger un
  // "SUCCESSFUL" de toutes pièces.
  it("re-verifies the payment status with Feexpay instead of trusting the payload directly", async () => {
    let callCount = 0;
    let calledUrl = "";
    global.fetch = (async (url: string) => {
      callCount++;
      calledUrl = url;
      return new Response(JSON.stringify({ status: "SUCCESSFUL" }), { status: 200 });
    }) as typeof fetch;

    const { POST } = await import("./route");
    // Le payload prétend un statut FAILED — s'il était utilisé sans
    // vérification, ce test échouerait en confirmant qu'on ne l'a pas fait.
    const res = await POST(makeRequest({ reference: "ref-123", status: "FAILED", amount: 5000 }));

    expect(res.status).toBe(200);
    expect(callCount).toBe(1);
    expect(calledUrl).toContain("ref-123");
  });

  it("doesn't throw when the payload has no reference", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ status: "SUCCESSFUL" }));
    expect(res.status).toBe(200);
  });
});
