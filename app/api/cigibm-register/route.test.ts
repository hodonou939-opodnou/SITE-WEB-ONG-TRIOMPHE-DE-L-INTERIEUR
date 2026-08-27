// @vitest-environment node
//
// NextRequest/FormData sous jsdom (l'environnement par défaut du projet, cf.
// vitest.config.mts) se comporte de façon incohérente avec les primitives
// serveur de Next. On force l'environnement Node pour ce fichier plutôt que
// de changer la config globale, dont dépendent les tests de composants React.
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

vi.stubEnv("BREVO_API_KEY", "test-key");

// Domaine distinct de celui des autres fichiers de test (cf.
// lib/admin/participants.test.ts) : Vitest exécute les fichiers en parallèle
// contre la même base partagée, et un domaine identique ferait que le
// afterEach de l'un supprime en pleine course les lignes que l'autre vient
// de créer (constaté empiriquement lors de la tâche 7 : échecs non
// déterministes avant ce changement).
const TEST_EMAIL_DOMAIN = "@test.plan.register.example";

function buildRequest(fields: Record<string, string>) {
  const formData = new FormData();
  Object.entries(fields).forEach(([k, v]) => formData.append(k, v));
  return new NextRequest("http://localhost:3000/api/cigibm-register", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/cigibm-register", () => {
  afterEach(async () => {
    await db.participant.deleteMany({ where: { email: { endsWith: TEST_EMAIL_DOMAIN } } });
    vi.restoreAllMocks();
  });

  it("creates a Participant row tied to édition 4 on successful registration", async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ id: 1 }), { status: 201 })) as typeof fetch;

    const { POST } = await import("./route");
    const email = `newparticipant${TEST_EMAIL_DOMAIN}`;
    await POST(buildRequest({ name: "New Participant", phone: "0100000010", email, consent: "1" }));

    const edition4 = await db.edition.findUniqueOrThrow({ where: { number: 4 } });
    const participant = await db.participant.findFirst({ where: { email } });

    expect(participant).not.toBeNull();
    expect(participant?.editionId).toBe(edition4.id);
    expect(participant?.registrationSource).toBe("form");
    expect(participant?.phone).toBe("+2290100000010");
  });

  it("still redirects to /merci even when the Participant write fails", async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ id: 1 }), { status: 201 })) as typeof fetch;
    // La route écrit via upsert (voir plus bas), pas via create : c'est donc
    // upsert qu'il faut faire échouer ici pour exercer le vrai chemin de
    // code — un mock sur create ne serait jamais appelé et ne prouverait
    // rien.
    vi.spyOn(db.participant, "upsert").mockRejectedValueOnce(new Error("DB is down"));

    const { POST } = await import("./route");
    const response = await POST(
      buildRequest({ name: "Resilience Test", phone: "0100000011", email: `resilient${TEST_EMAIL_DOMAIN}`, consent: "1" })
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/cigibm-2026/merci");
  });

  it("does not create a second Participant row when the same person resubmits", async () => {
    // Simule une vraie resoumission : premier appel de création de contact
    // Brevo accepté (201), second rejeté en double (email ET SMS déjà
    // connus) — exactement la branche « duplicate on email alone => treat
    // as success » de la route, qui laisse le code continuer jusqu'à
    // l'écriture Participant comme pour une inscription normale. Seul
    // l'endpoint /v3/contacts varie ; /v3/smtp/email (email de confirmation)
    // répond toujours 201 pour ne pas polluer ce test avec un échec email
    // qui n'a rien à voir avec ce qui est testé ici.
    let contactCalls = 0;
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/v3/contacts")) {
        contactCalls += 1;
        if (contactCalls === 1) {
          return new Response(JSON.stringify({ id: 1 }), { status: 201 });
        }
        return new Response(
          JSON.stringify({ code: "duplicate_parameter", metadata: { duplicate_identifiers: ["email", "SMS"] } }),
          { status: 400 }
        );
      }
      return new Response(JSON.stringify({ messageId: "x" }), { status: 201 });
    }) as typeof fetch;

    const { POST } = await import("./route");
    const email = `resubmit${TEST_EMAIL_DOMAIN}`;
    const fields = { name: "Resubmitting Person", phone: "0100000013", email, consent: "1" };

    await POST(buildRequest(fields));
    await POST(buildRequest(fields));

    const rows = await db.participant.findMany({ where: { email } });
    expect(rows).toHaveLength(1);
  });
});
