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
    // La route écrit via create() (avec repli sur update() en cas de
    // P2002 — voir plus bas), pas via upsert : c'est donc create qu'il
    // faut faire échouer ici pour exercer le vrai chemin de code. L'erreur
    // n'est pas un P2002, donc elle remonte telle quelle jusqu'au catch
    // englobant plutôt que de déclencher le repli update().
    vi.spyOn(db.participant, "create").mockRejectedValueOnce(new Error("DB is down"));

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

  it("still registers the participant when Brevo rejects the phone number as invalid", async () => {
    // Régression réelle constatée en production : Brevo peut renvoyer un
    // 400 "invalid_parameter" / "Invalid phone number" pour un numéro dont
    // le format ne lui plaît pas, ce qui bloquait alors toute l'inscription
    // — nom et email valides ou non. Seul /v3/contacts doit rejeter le
    // numéro ; /v3/smtp/email répond toujours 201 pour isoler ce qui est
    // testé ici.
    let contactCalls = 0;
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/v3/contacts")) {
        contactCalls += 1;
        if (contactCalls === 1) {
          return new Response(JSON.stringify({ code: "invalid_parameter", message: "Invalid phone number" }), {
            status: 400,
          });
        }
        return new Response(JSON.stringify({ id: 1 }), { status: 201 });
      }
      return new Response(JSON.stringify({ messageId: "x" }), { status: 201 });
    }) as typeof fetch;

    const { POST } = await import("./route");
    const email = `invalidphone${TEST_EMAIL_DOMAIN}`;
    const response = await POST(buildRequest({ name: "Invalid Phone Person", phone: "0100000014", email, consent: "1" }));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/cigibm-2026/merci");
    expect(contactCalls).toBe(2);

    const participant = await db.participant.findFirst({ where: { email } });
    expect(participant).not.toBeNull();
    expect(participant?.phone).toBe("+2290100000014");
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

  it("backfills the ambassador attribution on resubmission when the first registration had none, and notifies", async () => {
    // Régression réelle constatée en production : quelqu'un s'inscrit une
    // première fois sans lien de parrainage (ambassadorId reste null), puis
    // resoumet plus tard via un lien d'ambassadeur valide. Avant ce
    // correctif, la branche P2002 n'incluait jamais ambassadorId dans son
    // update() — l'attribution était silencieusement perdue pour toujours,
    // sans qu'aucun compteur ni notification ne le révèle.
    const sentEmails: Array<{ to: string }> = [];
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/v3/contacts")) {
        return new Response(JSON.stringify({ id: 1 }), { status: 201 });
      }
      const body = JSON.parse(init?.body as string);
      sentEmails.push({ to: body.to[0].email });
      return new Response(JSON.stringify({ messageId: "x" }), { status: 201 });
    }) as typeof fetch;

    const ambassador = await db.ambassador.create({
      data: {
        slug: `${TEST_AMBASSADOR_SLUG_PREFIX}-backfill`,
        fullName: "Ambassadeur Backfill",
        phone: "+2290100000098",
        email: `ambassador-backfill${TEST_EMAIL_DOMAIN}`,
      },
    });

    const { POST } = await import("./route");
    const email = `backfill-participant${TEST_EMAIL_DOMAIN}`;

    // Première inscription : aucun cookie de parrainage.
    const firstRequest = buildRequest({ name: "Backfill Participant", phone: "0100000099", email, consent: "1" });
    await POST(firstRequest);

    const afterFirst = await db.participant.findFirst({ where: { email } });
    expect(afterFirst?.ambassadorId).toBeNull();

    // Resoumission plus tard, cette fois via le lien de l'ambassadeur.
    const secondRequest = buildRequest({ name: "Backfill Participant", phone: "0100000099", email, consent: "1" });
    secondRequest.cookies.set("cigibm_ref", ambassador.slug);
    await POST(secondRequest);

    const afterSecond = await db.participant.findFirst({ where: { email } });
    expect(afterSecond?.ambassadorId).toBe(ambassador.id);

    const notification = sentEmails.find((e) => e.to === ambassador.email);
    expect(notification).toBeDefined();

    await db.ambassador.delete({ where: { id: ambassador.id } });
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

  it("does not throw or block registration when the ambassador cookie value contains a %-sequence", async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ id: 1 }), { status: 201 })) as typeof fetch;

    const { POST } = await import("./route");
    const email = `percent-cookie${TEST_EMAIL_DOMAIN}`;
    const request = buildRequest({ name: "Percent Cookie Participant", phone: "0100000097", email, consent: "1" });
    // NextRequest.cookies.get(...).value is already decoded once by Next's
    // own parseCookie (see node_modules/next/dist/compiled/@edge-runtime/
    // cookies/index.js) while parsing the raw `Cookie` header — e.g. a wire
    // value of `cigibm_ref=%25zz` decodes once to the string "%zz" by the
    // time route.ts ever sees it. request.cookies.set(...) writes straight
    // into that already-parsed map, so setting "%zz" here simulates exactly
    // that already-decoded value. A second decodeURIComponent call on "%zz"
    // throws URIError: URI malformed (zz is not a valid hex escape) — this
    // test proves the route does not perform that redundant second decode.
    request.cookies.set("cigibm_ref", "%zz");

    const response = await POST(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/cigibm-2026/merci");

    const participant = await db.participant.findFirst({ where: { email } });
    expect(participant?.ambassadorId).toBeNull();
  });

  it("notifies the ambassador by email when someone new registers via their link", async () => {
    const emailCalls: Array<{ to: string; subject: string; html: string }> = [];
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/v3/contacts")) {
        return new Response(JSON.stringify({ id: 1 }), { status: 201 });
      }
      const body = JSON.parse(init?.body as string);
      emailCalls.push({ to: body.to[0].email, subject: body.subject, html: body.htmlContent });
      return new Response(JSON.stringify({ messageId: "x" }), { status: 201 });
    }) as typeof fetch;

    const ambassador = await db.ambassador.create({
      data: {
        slug: `${TEST_AMBASSADOR_SLUG_PREFIX}-notif`,
        fullName: "Ambassadeur Notifie",
        phone: "+2290100000098",
        email: `ambassador-notif${TEST_EMAIL_DOMAIN}`,
      },
    });

    const { POST } = await import("./route");
    const email = `referred-notif${TEST_EMAIL_DOMAIN}`;
    const request = buildRequest({ name: "Referred Notif Participant", phone: "0100000099", email, consent: "1" });
    request.cookies.set("cigibm_ref", ambassador.slug);

    await POST(request);

    const referralEmail = emailCalls.find((c) => c.to === ambassador.email);
    expect(referralEmail).toBeDefined();
    expect(referralEmail?.subject).toContain("quelqu'un vient de s'inscrire");
    expect(referralEmail?.html).toMatch(/>\s*1\s*</);

    await db.ambassador.delete({ where: { id: ambassador.id } });
  });

  it("does not notify the ambassador again when the same person resubmits", async () => {
    let referralNotifications = 0;
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/v3/contacts")) {
        return new Response(JSON.stringify({ id: 1 }), { status: 201 });
      }
      const body = JSON.parse(init?.body as string);
      if (body.to[0].email === ambassadorEmail) referralNotifications += 1;
      return new Response(JSON.stringify({ messageId: "x" }), { status: 201 });
    }) as typeof fetch;

    const ambassadorEmail = `ambassador-resubmit${TEST_EMAIL_DOMAIN}`;
    const ambassador = await db.ambassador.create({
      data: {
        slug: `${TEST_AMBASSADOR_SLUG_PREFIX}-resubmit`,
        fullName: "Ambassadeur Resubmit",
        phone: "+2290100000100",
        email: ambassadorEmail,
      },
    });

    const { POST } = await import("./route");
    const email = `referred-resubmit${TEST_EMAIL_DOMAIN}`;
    const fields = { name: "Resubmit Referred Participant", phone: "0100000101", email, consent: "1" };

    const firstRequest = buildRequest(fields);
    firstRequest.cookies.set("cigibm_ref", ambassador.slug);
    await POST(firstRequest);

    const secondRequest = buildRequest(fields);
    secondRequest.cookies.set("cigibm_ref", ambassador.slug);
    await POST(secondRequest);

    expect(referralNotifications).toBe(1);

    await db.ambassador.delete({ where: { id: ambassador.id } });
  });

  it("does not attempt an ambassador notification when the ambassador has no email on file", async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ messageId: "x" }), { status: 201 })) as typeof fetch;

    const ambassador = await db.ambassador.create({
      data: {
        slug: `${TEST_AMBASSADOR_SLUG_PREFIX}-noemail`,
        fullName: "Ambassadeur Sans Email",
        phone: "+2290100000102",
      },
    });

    const { POST } = await import("./route");
    const email = `referred-noemail${TEST_EMAIL_DOMAIN}`;
    const request = buildRequest({ name: "Referred No Email Participant", phone: "0100000103", email, consent: "1" });
    request.cookies.set("cigibm_ref", ambassador.slug);

    const response = await POST(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/cigibm-2026/merci");

    await db.ambassador.delete({ where: { id: ambassador.id } });
  });

  it("does not notify the ambassador when the Participant write itself fails", async () => {
    const emailCalls: Array<{ to: string }> = [];
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/v3/contacts")) {
        return new Response(JSON.stringify({ id: 1 }), { status: 201 });
      }
      const body = JSON.parse(init?.body as string);
      emailCalls.push({ to: body.to[0].email });
      return new Response(JSON.stringify({ messageId: "x" }), { status: 201 });
    }) as typeof fetch;

    const ambassador = await db.ambassador.create({
      data: {
        slug: `${TEST_AMBASSADOR_SLUG_PREFIX}-createfails`,
        fullName: "Ambassadeur Create Fails",
        phone: "+2290100000104",
        email: `ambassador-createfails${TEST_EMAIL_DOMAIN}`,
      },
    });

    // create() lève une erreur qui n'est pas un P2002 (conflit sur la
    // contrainte unique) : la ligne Participant n'est donc jamais écrite,
    // et l'ambassadeur ne doit recevoir aucune notification.
    vi.spyOn(db.participant, "create").mockRejectedValueOnce(new Error("DB is down"));

    const { POST } = await import("./route");
    const email = `referred-createfails${TEST_EMAIL_DOMAIN}`;
    const request = buildRequest({
      name: "Referred Create Fails Participant",
      phone: "0100000105",
      email,
      consent: "1",
    });
    request.cookies.set("cigibm_ref", ambassador.slug);

    const response = await POST(request);

    expect(response.status).toBe(303);
    expect(emailCalls.find((c) => c.to === ambassador.email)).toBeUndefined();

    await db.ambassador.delete({ where: { id: ambassador.id } });
  });
});
