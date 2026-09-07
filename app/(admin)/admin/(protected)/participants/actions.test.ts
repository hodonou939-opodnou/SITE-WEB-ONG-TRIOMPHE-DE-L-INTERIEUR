// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";

// Même choix qu'app/admin/scan/actions.test.ts : seul @/lib/supabase/server
// est mocké, la vraie chaîne requireAdmin() / getAdminSession() /
// resolveAccessRedirect() tourne sans mock, contre la vraie base — mocker
// requireAdmin() lui-même ne prouverait que l'appel d'un mock, pas que le
// garde rejette réellement un appel non authentifié.
const mockGetClaims = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: mockGetClaims },
  }),
}));

const TEST_EMAIL_DOMAIN = "@test.plan.participantsactions.example";
const TEST_ADMIN_ID_PREFIX = "test-participantsactions-admin-";

async function createTestParticipant(overrides: { email: string | null }) {
  const edition4 = await db.edition.findUniqueOrThrow({ where: { number: 4 } });
  return db.participant.create({
    data: {
      editionId: edition4.id,
      fullName: "Actions Test Person",
      phone: "+2290100000098",
      registrationSource: "form",
      ...overrides,
    },
  });
}

describe("participants actions — sendBadgeLinkAction", () => {
  afterEach(async () => {
    await db.participant.deleteMany({ where: { email: { endsWith: TEST_EMAIL_DOMAIN } } });
    await db.adminProfile.deleteMany({ where: { id: { startsWith: TEST_ADMIN_ID_PREFIX } } });
    mockGetClaims.mockReset();
  });

  it("rejects an unauthenticated caller and sends no email", async () => {
    mockGetClaims.mockResolvedValue({ data: { claims: null }, error: null });
    const participant = await createTestParticipant({ email: `unauth${TEST_EMAIL_DOMAIN}` });
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const { sendBadgeLinkAction } = await import("./actions");
    await expect(sendBadgeLinkAction(participant.id)).rejects.toMatchObject({
      digest: expect.stringContaining("NEXT_REDIRECT"),
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("with a real admin session, sends an email containing the participant's own badge link", async () => {
    const admin = await db.adminProfile.create({
      data: { id: `${TEST_ADMIN_ID_PREFIX}1`, fullName: "Admin Test", role: "admin" },
    });
    mockGetClaims.mockResolvedValue({ data: { claims: { sub: admin.id } }, error: null });
    const participant = await createTestParticipant({ email: `auth${TEST_EMAIL_DOMAIN}` });

    let capturedHtml = "";
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/v3/smtp/email")) {
        const body = JSON.parse(String(init?.body));
        capturedHtml = body.htmlContent;
      }
      return new Response(JSON.stringify({ messageId: "test" }), { status: 201 });
    }) as typeof fetch;

    const { sendBadgeLinkAction } = await import("./actions");
    const result = await sendBadgeLinkAction(participant.id);

    expect(result).toEqual({ ok: true });
    expect(capturedHtml).toContain(`/cigibm-2026/badge/${participant.attendanceToken}`);
  });

  it("refuses to send when the participant has no email on file", async () => {
    const admin = await db.adminProfile.create({
      data: { id: `${TEST_ADMIN_ID_PREFIX}2`, fullName: "Admin Test", role: "admin" },
    });
    mockGetClaims.mockResolvedValue({ data: { claims: { sub: admin.id } }, error: null });
    const participant = await createTestParticipant({ email: null });
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const { sendBadgeLinkAction } = await import("./actions");
    const result = await sendBadgeLinkAction(participant.id);

    expect(result).toEqual({ ok: false, error: "Aucun email enregistré pour ce participant." });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
