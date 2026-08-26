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
    vi.spyOn(db.participant, "create").mockRejectedValueOnce(new Error("DB is down"));

    const { POST } = await import("./route");
    const response = await POST(
      buildRequest({ name: "Resilience Test", phone: "0100000011", email: `resilient${TEST_EMAIL_DOMAIN}`, consent: "1" })
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/cigibm-2026/merci");
  });
});
