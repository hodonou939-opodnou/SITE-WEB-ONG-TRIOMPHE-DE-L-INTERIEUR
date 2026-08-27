import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

vi.mock("@/lib/admin/auth", () => ({
  requireAdmin: async () => ({ id: "admin-1", fullName: "Admin Test", role: "admin" }),
}));

// Sans ce stub, sendSms() court-circuite vers { ok: false } dès que
// BREVO_API_KEY est absente du process, et le fetch mocké plus bas n'est
// jamais atteint. Même pattern déjà utilisé dans lib/messaging/sms.test.ts
// et app/api/cigibm-register/route.test.ts pour la même raison.
vi.stubEnv("BREVO_API_KEY", "test-key");

// Domaine distinct de celui des autres fichiers de test (cf.
// app/api/cigibm-register/route.test.ts, lib/admin/participants.test.ts) :
// Vitest exécute les fichiers en parallèle contre la même base partagée, et
// un domaine identique ferait que le afterEach de l'un supprime en pleine
// course les lignes que l'autre vient de créer.
const TEST_EMAIL_DOMAIN = "@test.plan.messages.example";

describe("POST /api/admin/messages/send", () => {
  afterEach(async () => {
    await db.participant.deleteMany({ where: { email: { endsWith: TEST_EMAIL_DOMAIN } } });
    await db.messagingLog.deleteMany({ where: { batchLabel: "test-batch" } });
    vi.restoreAllMocks();
  });

  it("sends an SMS to every resolved recipient and logs one row each", async () => {
    // Édition 1 (et non 4) délibérément : resolveAudience() résout TOUS les
    // participants de l'édition demandée, sans filtre par domaine d'email —
    // contrairement au nettoyage de afterEach, ce compte n'est donc pas
    // isolable par un simple domaine distinct. Tous les autres fichiers de
    // test de ce plan (audience.test.ts, participants.test.ts,
    // dashboard.test.ts, cigibm-register/route.test.ts) créent leurs
    // participants sous l'édition 4 exclusivement (la seule à
    // hasParticipantData: true) ; utiliser l'édition 4 ici ferait que ce
    // test compte aussi, de façon non déterministe, les participants créés
    // en parallèle par ces autres fichiers pendant `npm test` (constaté
    // empiriquement : sentCount valait 5 au lieu de 2 en suite complète).
    // L'édition 1 n'est jamais utilisée pour des fixtures Participant
    // ailleurs, ce qui rend ce test exact et déterministe sans affaiblir ses
    // assertions.
    const edition1 = await db.edition.findUniqueOrThrow({ where: { number: 1 } });
    await db.participant.createMany({
      data: [
        { editionId: edition1.id, fullName: "Recipient One", phone: "+2290100000031", email: `r1${TEST_EMAIL_DOMAIN}`, registrationSource: "form" },
        { editionId: edition1.id, fullName: "Recipient Two", phone: "+2290100000032", email: `r2${TEST_EMAIL_DOMAIN}`, registrationSource: "form" },
      ],
    });

    global.fetch = vi.fn(async () => new Response(JSON.stringify({ reference: "ref-1" }), { status: 201 })) as typeof fetch;

    const { POST } = await import("./route");
    const request = new NextRequest("http://localhost:3000/api/admin/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "sms", editionNumber: 1, message: "Rappel test", batchLabel: "test-batch" }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.sentCount).toBe(2);

    const logs = await db.messagingLog.findMany({ where: { batchLabel: "test-batch" } });
    expect(logs).toHaveLength(2);
    expect(logs.every((l) => l.status === "sent")).toBe(true);
  });
});
