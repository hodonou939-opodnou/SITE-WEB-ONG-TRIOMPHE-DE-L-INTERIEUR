// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";

// Only @/lib/supabase/server is mocked — the real requireScanAccess() /
// getAdminSession() / resolveAccessRedirect() chain from lib/admin/auth.ts
// runs unmocked, against the real database, exactly as it would in
// production. This is deliberate: mocking requireScanAccess() itself (as
// app/api/admin/messages/send/route.test.ts does for requireAdmin()) would
// only prove a mock was called, not that the actual guard rejects an
// unauthenticated caller. Mock shape mirrors lib/admin/auth.test.ts:4-14.
const mockGetClaims = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: mockGetClaims },
  }),
}));

// Domain distinct from every other test file's TEST_EMAIL_DOMAIN (grepped
// the repo first) so the shared-database afterEach cleanups run in parallel
// without stepping on each other's rows.
const TEST_EMAIL_DOMAIN = "@test.plan.scanactions.example";
const TEST_ADMIN_ID_PREFIX = "test-scanactions-admin-";

async function createTestParticipant(overrides: { email: string; attendedAt?: Date }) {
  const edition4 = await db.edition.findUniqueOrThrow({ where: { number: 4 } });
  return db.participant.create({
    data: {
      editionId: edition4.id,
      fullName: "Scan Action Test Person",
      phone: "+2290100000094",
      registrationSource: "form",
      ...overrides,
    },
  });
}

describe("admin/scan actions — auth boundary", () => {
  afterEach(async () => {
    await db.participant.deleteMany({ where: { email: { endsWith: TEST_EMAIL_DOMAIN } } });
    await db.adminProfile.deleteMany({ where: { id: { startsWith: TEST_ADMIN_ID_PREFIX } } });
    mockGetClaims.mockReset();
  });

  describe("without an authenticated session", () => {
    it("checkInAction rejects and leaves the participant un-checked-in", async () => {
      mockGetClaims.mockResolvedValue({ data: { claims: null }, error: null });
      const participant = await createTestParticipant({ email: `unauth-token${TEST_EMAIL_DOMAIN}` });

      const { checkInAction } = await import("./actions");
      await expect(checkInAction(participant.attendanceToken)).rejects.toMatchObject({
        digest: expect.stringContaining("NEXT_REDIRECT"),
      });

      const row = await db.participant.findUniqueOrThrow({ where: { id: participant.id } });
      expect(row.attendedAt).toBeNull();
      expect(row.checkedInByAdminId).toBeNull();
    });

    it("checkInByIdAction rejects and leaves the participant un-checked-in", async () => {
      mockGetClaims.mockResolvedValue({ data: { claims: null }, error: null });
      const participant = await createTestParticipant({ email: `unauth-byid${TEST_EMAIL_DOMAIN}` });

      const { checkInByIdAction } = await import("./actions");
      await expect(checkInByIdAction(participant.id)).rejects.toMatchObject({
        digest: expect.stringContaining("NEXT_REDIRECT"),
      });

      const row = await db.participant.findUniqueOrThrow({ where: { id: participant.id } });
      expect(row.attendedAt).toBeNull();
      expect(row.checkedInByAdminId).toBeNull();
    });

    it("searchParticipantsAction rejects instead of returning results", async () => {
      mockGetClaims.mockResolvedValue({ data: { claims: null }, error: null });
      await createTestParticipant({ email: `unauth-search${TEST_EMAIL_DOMAIN}` });

      const { searchParticipantsAction } = await import("./actions");
      await expect(searchParticipantsAction("Scan Action Test Person")).rejects.toMatchObject({
        digest: expect.stringContaining("NEXT_REDIRECT"),
      });
    });
  });

  describe("with a real scanner-role AdminProfile session", () => {
    it("checkInByIdAction succeeds and records the scanner as checkedInByAdminId", async () => {
      const admin = await db.adminProfile.create({
        data: { id: `${TEST_ADMIN_ID_PREFIX}1`, fullName: "Scanner Test", role: "scanner" },
      });
      mockGetClaims.mockResolvedValue({ data: { claims: { sub: admin.id } }, error: null });
      const participant = await createTestParticipant({ email: `auth-byid${TEST_EMAIL_DOMAIN}` });

      const { checkInByIdAction } = await import("./actions");
      const result = await checkInByIdAction(participant.id);

      expect(result).toEqual({ status: "success", fullName: "Scan Action Test Person" });
      const row = await db.participant.findUniqueOrThrow({ where: { id: participant.id } });
      expect(row.attendedAt).not.toBeNull();
      expect(row.checkedInByAdminId).toBe(admin.id);
    });
  });
});
