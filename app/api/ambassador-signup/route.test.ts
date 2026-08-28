// @vitest-environment node
//
// Même raison que app/api/cigibm-register/route.test.ts : NextRequest/FormData
// sous jsdom (l'environnement par défaut du projet) se comporte de façon
// incohérente avec les primitives serveur de Next.
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { uploadAmbassadorPhoto } from "@/lib/ambassadors/photo";

vi.stubEnv("BREVO_API_KEY", "test-key");

// Mocké plutôt que réellement uploadé vers Supabase Storage : ce fichier
// teste le comportement de la route (délégation, résilience), pas
// l'upload lui-même — déjà couvert par lib/ambassadors/photo.test.ts contre
// le vrai bucket.
vi.mock("@/lib/ambassadors/photo", () => ({
  uploadAmbassadorPhoto: vi.fn(),
}));

// Préfixe/domaine distincts de ceux des autres fichiers de test partageant
// la même base réelle (lib/admin/ambassadors.test.ts:
// "test-plan-ambassadors", app/api/cigibm-register/route.test.ts:
// "test-plan-register-ambassador" / "@test.plan.register.example") — aucun
// n'est préfixe de l'autre, donc leurs afterEach respectifs (exécutés en
// parallèle) ne peuvent jamais se supprimer mutuellement des lignes.
const TEST_SLUG_PREFIX = "test-plan-ambsignup";
const TEST_EMAIL_DOMAIN = "@test.plan.ambsignup.example";

function buildRequest(fields: Record<string, string | File>) {
  const formData = new FormData();
  Object.entries(fields).forEach(([k, v]) => formData.append(k, v));
  return new NextRequest("http://localhost:3000/api/ambassador-signup", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/ambassador-signup", () => {
  afterEach(async () => {
    await db.messagingLog.deleteMany({ where: { recipientEmail: { endsWith: TEST_EMAIL_DOMAIN } } });
    await db.ambassador.deleteMany({ where: { slug: { startsWith: TEST_SLUG_PREFIX } } });
    vi.restoreAllMocks();
    // restoreAllMocks() ne réinitialise pas l'historique d'appels d'un
    // vi.fn() créé dans une factory vi.mock() (contrairement à un spy créé
    // via vi.spyOn) — constaté empiriquement : sans ce reset explicite, le
    // test "does not attempt an upload when no photo is provided" voit les
    // appels des tests précédents.
    vi.mocked(uploadAmbassadorPhoto).mockReset();
  });

  it("creates an inactive Ambassador row and redirects to the success state", async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ messageId: "x" }), { status: 201 })) as typeof fetch;

    const { POST } = await import("./route");
    const email = `newambassador${TEST_EMAIL_DOMAIN}`;
    const response = await POST(
      buildRequest({ fullName: `${TEST_SLUG_PREFIX} Alpha`, phone: "0100000060", email, consent: "1" })
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/cigibm?ambassadeur=succes");

    const ambassador = await db.ambassador.findFirst({ where: { email } });
    expect(ambassador).not.toBeNull();
    expect(ambassador?.active).toBe(false);
    expect(ambassador?.phone).toBe("+2290100000060");
  });

  it("sends a welcome email containing the ambassador's referral URL", async () => {
    let capturedBody: Record<string, unknown> | null = null;
    global.fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedBody = JSON.parse(init?.body as string);
      return new Response(JSON.stringify({ messageId: "x" }), { status: 201 });
    }) as typeof fetch;

    const { POST } = await import("./route");
    const email = `emailcheck${TEST_EMAIL_DOMAIN}`;
    await POST(buildRequest({ fullName: `${TEST_SLUG_PREFIX} Beta`, phone: "0100000061", email, consent: "1" }));

    const ambassador = await db.ambassador.findFirstOrThrow({ where: { email } });
    expect(capturedBody).not.toBeNull();
    expect((capturedBody as unknown as { htmlContent: string }).htmlContent).toContain(
      `/cigibm-2026?ref=${ambassador.slug}`
    );
  });

  it("redirects to the error state when a required field is missing", async () => {
    const { POST } = await import("./route");
    const email = `missingfield${TEST_EMAIL_DOMAIN}`;
    const response = await POST(buildRequest({ fullName: `${TEST_SLUG_PREFIX} Gamma`, email, consent: "1" }));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/cigibm?ambassadeur=erreur");
    const ambassador = await db.ambassador.findFirst({ where: { email } });
    expect(ambassador).toBeNull();
  });

  it("redirects to the error state when consent is not given", async () => {
    const { POST } = await import("./route");
    const email = `noconsent${TEST_EMAIL_DOMAIN}`;
    const response = await POST(
      buildRequest({ fullName: `${TEST_SLUG_PREFIX} Delta`, phone: "0100000062", email })
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/cigibm?ambassadeur=erreur");
  });

  it("still redirects to the success state even when the welcome email fails", async () => {
    global.fetch = vi.fn(async () => new Response("server error", { status: 500 })) as typeof fetch;

    const { POST } = await import("./route");
    const email = `emailfails${TEST_EMAIL_DOMAIN}`;
    const response = await POST(
      buildRequest({ fullName: `${TEST_SLUG_PREFIX} Epsilon`, phone: "0100000063", email, consent: "1" })
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/cigibm?ambassadeur=succes");
    const ambassador = await db.ambassador.findFirst({ where: { email } });
    expect(ambassador).not.toBeNull();
  });

  it("uploads the provided photo and stores its public URL on the new Ambassador", async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ messageId: "x" }), { status: 201 })) as typeof fetch;
    vi.mocked(uploadAmbassadorPhoto).mockResolvedValueOnce("https://example.test/storage/photo.jpg");

    const { POST } = await import("./route");
    const email = `withphoto${TEST_EMAIL_DOMAIN}`;
    const photo = new File([new Uint8Array(Buffer.from("fake-image-bytes"))], "photo.jpg", { type: "image/jpeg" });
    await POST(
      buildRequest({ fullName: `${TEST_SLUG_PREFIX} Zeta`, phone: "0100000064", email, consent: "1", photo })
    );

    const ambassador = await db.ambassador.findFirst({ where: { email } });
    expect(ambassador?.photoUrl).toBe("https://example.test/storage/photo.jpg");
  });

  it("still creates the Ambassador without a photo when the upload fails", async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ messageId: "x" }), { status: 201 })) as typeof fetch;
    vi.mocked(uploadAmbassadorPhoto).mockRejectedValueOnce(new Error("upload failed"));

    const { POST } = await import("./route");
    const email = `photofails${TEST_EMAIL_DOMAIN}`;
    const photo = new File([new Uint8Array(Buffer.from("fake-image-bytes"))], "photo.jpg", { type: "image/jpeg" });
    const response = await POST(
      buildRequest({ fullName: `${TEST_SLUG_PREFIX} Eta`, phone: "0100000065", email, consent: "1", photo })
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/cigibm?ambassadeur=succes");
    const ambassador = await db.ambassador.findFirst({ where: { email } });
    expect(ambassador).not.toBeNull();
    expect(ambassador?.photoUrl).toBeNull();
  });

  it("does not attempt an upload when no photo is provided", async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ messageId: "x" }), { status: 201 })) as typeof fetch;

    const { POST } = await import("./route");
    const email = `nophoto${TEST_EMAIL_DOMAIN}`;
    await POST(buildRequest({ fullName: `${TEST_SLUG_PREFIX} Theta`, phone: "0100000066", email, consent: "1" }));

    expect(uploadAmbassadorPhoto).not.toHaveBeenCalled();
    const ambassador = await db.ambassador.findFirst({ where: { email } });
    expect(ambassador?.photoUrl).toBeNull();
  });
});
