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

// Préfixe distinct de celui de lib/admin/ambassadors.test.ts
// ("test-plan-ambassadors") : ni l'un ni l'autre n'est un préfixe de
// l'autre, donc leurs deux filtres startsWith (utilisés dans leurs afterEach
// respectifs, exécutés en parallèle contre la même base partagée) ne se
// chevauchent jamais.
const TEST_AMBASSADOR_SLUG_PREFIX = "test-plan-register-ambassador";

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
    // Task 9 added logging to sendTransactionalEmail (lib/email.ts): every
    // POST here that reaches the confirmation-email step now also writes a
    // real MessagingLog row (fetch is mocked, but logMessage()/db aren't).
    // Without this, those rows accumulate in the shared Supabase instance
    // on every test run.
    await db.messagingLog.deleteMany({ where: { recipientEmail: { endsWith: TEST_EMAIL_DOMAIN } } });
    // Filet de sécurité pour les Ambassador créés par les tests
    // d'attribution ci-dessous : un afterEach s'exécute même si une
    // assertion précédente du test a levé, contrairement aux
    // db.ambassador.delete(...) placés en fin de corps de test (qui, eux,
    // fuiraient des lignes dans la base partagée en cas d'échec avant leur
    // exécution).
    await db.ambassador.deleteMany({ where: { slug: { startsWith: TEST_AMBASSADOR_SLUG_PREFIX } } });
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

  it("attributes the registration to the ambassador named in the cigibm_ref cookie", async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ id: 1 }), { status: 201 })) as typeof fetch;

    const ambassador = await db.ambassador.create({
      data: { slug: "test-plan-register-ambassador", fullName: "Ambassadeur Test", phone: "+2290100000090" },
    });

    const { POST } = await import("./route");
    const email = `referred${TEST_EMAIL_DOMAIN}`;
    const request = buildRequest({ name: "Referred Participant", phone: "0100000091", email, consent: "1" });
    request.cookies.set("cigibm_ref", ambassador.slug);

    await POST(request);

    const participant = await db.participant.findFirst({ where: { email } });
    expect(participant?.ambassadorId).toBe(ambassador.id);

    await db.ambassador.delete({ where: { id: ambassador.id } });
  });

  it("ignores an unknown or inactive ambassador slug without failing the registration", async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ id: 1 }), { status: 201 })) as typeof fetch;

    const { POST } = await import("./route");
    const email = `noref${TEST_EMAIL_DOMAIN}`;
    const request = buildRequest({ name: "No Ref Participant", phone: "0100000092", email, consent: "1" });
    request.cookies.set("cigibm_ref", "this-slug-does-not-exist");

    const response = await POST(request);

    expect(response.status).toBe(303);
    const participant = await db.participant.findFirst({ where: { email } });
    expect(participant?.ambassadorId).toBeNull();
  });

  it("does not overwrite an existing ambassador attribution on resubmission", async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ id: 1 }), { status: 201 })) as typeof fetch;

    const ambassadorA = await db.ambassador.create({
      data: { slug: "test-plan-register-ambassador-a", fullName: "Ambassadeur A", phone: "+2290100000093" },
    });
    const ambassadorB = await db.ambassador.create({
      data: { slug: "test-plan-register-ambassador-b", fullName: "Ambassadeur B", phone: "+2290100000094" },
    });

    const { POST } = await import("./route");
    const email = `resubmit-ref${TEST_EMAIL_DOMAIN}`;

    const firstRequest = buildRequest({ name: "Resubmit Participant", phone: "0100000095", email, consent: "1" });
    firstRequest.cookies.set("cigibm_ref", ambassadorA.slug);
    await POST(firstRequest);

    const secondRequest = buildRequest({ name: "Resubmit Participant", phone: "0100000095", email, consent: "1" });
    secondRequest.cookies.set("cigibm_ref", ambassadorB.slug);
    await POST(secondRequest);

    const participant = await db.participant.findFirst({ where: { email } });
    expect(participant?.ambassadorId).toBe(ambassadorA.id);

    await db.ambassador.deleteMany({ where: { id: { in: [ambassadorA.id, ambassadorB.id] } } });
  });

  it("still redirects to /merci even when the ambassador lookup itself fails", async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ id: 1 }), { status: 201 })) as typeof fetch;
    // resolveAmbassadorFromCookie runs before the Brevo block (right after
    // normalizePhone), so an unhandled rejection here would abort the whole
    // handler, not just skip attribution — proving this survives is the
    // point of this test, distinct from the Participant-write resilience
    // test above.
    vi.spyOn(db.ambassador, "findUnique").mockRejectedValueOnce(new Error("DB is down"));

    const { POST } = await import("./route");
    const email = `ambassador-lookup-fails${TEST_EMAIL_DOMAIN}`;
    const request = buildRequest({ name: "Lookup Failure Participant", phone: "0100000096", email, consent: "1" });
    request.cookies.set("cigibm_ref", "test-plan-register-ambassador");

    const response = await POST(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/cigibm-2026/merci");

    const participant = await db.participant.findFirst({ where: { email } });
    expect(participant?.ambassadorId).toBeNull();
  });
});
