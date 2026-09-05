// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { checkInParticipant, checkInParticipantById, searchParticipants } from "./checkin";

const TEST_EMAIL_DOMAIN = "@test.plan.checkin.example";

async function createTestParticipant(
  overrides: Partial<{
    fullName: string;
    phone: string;
    email: string;
    attendedAt: Date;
    editionId: number;
  }> = {}
) {
  const edition4 = await db.edition.findUniqueOrThrow({ where: { number: 4 } });
  return db.participant.create({
    data: {
      editionId: edition4.id,
      fullName: "Checkin Test Person",
      phone: "+2290100000090",
      email: `checkin${TEST_EMAIL_DOMAIN}`,
      registrationSource: "form",
      ...overrides,
    },
  });
}

describe("checkInParticipant", () => {
  afterEach(async () => {
    await db.participant.deleteMany({ where: { email: { endsWith: TEST_EMAIL_DOMAIN } } });
  });

  it("returns not_found for an unknown token", async () => {
    const result = await checkInParticipant("does-not-exist-token", "admin-1");
    expect(result.status).toBe("not_found");
  });

  it("marks a not-yet-attended participant present", async () => {
    const participant = await createTestParticipant();

    const result = await checkInParticipant(participant.attendanceToken, "admin-1");

    expect(result).toEqual({ status: "success", fullName: "Checkin Test Person" });
    const updated = await db.participant.findUniqueOrThrow({ where: { id: participant.id } });
    expect(updated.attendedAt).not.toBeNull();
    expect(updated.checkedInByAdminId).toBe("admin-1");
  });

  it("reports already-checked-in without overwriting the original check-in", async () => {
    const originalAttendedAt = new Date("2026-10-17T09:15:00.000Z");
    const participant = await createTestParticipant({ attendedAt: originalAttendedAt });
    await db.participant.update({ where: { id: participant.id }, data: { checkedInByAdminId: "admin-original" } });

    const result = await checkInParticipant(participant.attendanceToken, "admin-2");

    expect(result).toEqual({ status: "already", fullName: "Checkin Test Person", attendedAt: originalAttendedAt });
    const row = await db.participant.findUniqueOrThrow({ where: { id: participant.id } });
    // Confirms the second scan did not steal credit for the check-in.
    expect(row.checkedInByAdminId).toBe("admin-original");
  });
});

describe("checkInParticipantById", () => {
  afterEach(async () => {
    await db.participant.deleteMany({ where: { email: { endsWith: TEST_EMAIL_DOMAIN } } });
  });

  it("returns not_found for an unknown id", async () => {
    const result = await checkInParticipantById("00000000-0000-0000-0000-000000000000", "admin-1");
    expect(result.status).toBe("not_found");
  });

  it("marks a not-yet-attended participant present", async () => {
    const participant = await createTestParticipant({ email: `byid-success${TEST_EMAIL_DOMAIN}` });

    const result = await checkInParticipantById(participant.id, "admin-1");

    expect(result).toEqual({ status: "success", fullName: "Checkin Test Person" });
    const updated = await db.participant.findUniqueOrThrow({ where: { id: participant.id } });
    expect(updated.attendedAt).not.toBeNull();
    expect(updated.checkedInByAdminId).toBe("admin-1");
  });

  it("reports already-checked-in without overwriting the original check-in", async () => {
    const originalAttendedAt = new Date("2026-10-17T09:20:00.000Z");
    const participant = await createTestParticipant({
      attendedAt: originalAttendedAt,
      email: `byid-already${TEST_EMAIL_DOMAIN}`,
    });
    await db.participant.update({ where: { id: participant.id }, data: { checkedInByAdminId: "admin-original" } });

    const result = await checkInParticipantById(participant.id, "admin-2");

    expect(result).toEqual({ status: "already", fullName: "Checkin Test Person", attendedAt: originalAttendedAt });
    const row = await db.participant.findUniqueOrThrow({ where: { id: participant.id } });
    // Same protection as the token-keyed path: a second scanner picking the
    // same name from search results must not steal credit for the check-in.
    expect(row.checkedInByAdminId).toBe("admin-original");
  });
});

describe("searchParticipants", () => {
  afterEach(async () => {
    await db.participant.deleteMany({ where: { email: { endsWith: TEST_EMAIL_DOMAIN } } });
  });

  it("matches by partial name, case-insensitively, and never returns attendanceToken", async () => {
    const participant = await createTestParticipant({
      fullName: "Zokpon Adjovi Recherche",
      phone: "+2290100000092",
      email: `search-name${TEST_EMAIL_DOMAIN}`,
    });

    const results = await searchParticipants("adjovi RECHERCHE");

    const match = results.find((r) => r.id === participant.id);
    expect(match).toEqual({
      id: participant.id,
      fullName: "Zokpon Adjovi Recherche",
      phone: "+2290100000092",
      attendedAt: null,
    });
    expect(match).not.toHaveProperty("attendanceToken");
  });

  it("matches by phone in the local 0-form the staffer would actually type", async () => {
    const participant = await createTestParticipant({
      fullName: "Search Phone Person",
      phone: "+2290176543219",
      email: `search-phone${TEST_EMAIL_DOMAIN}`,
    });

    const results = await searchParticipants("0176543219");

    expect(results.some((r) => r.id === participant.id)).toBe(true);
  });

  it("returns [] for a query shorter than 2 characters", async () => {
    expect(await searchParticipants("a")).toEqual([]);
    expect(await searchParticipants(" ")).toEqual([]);
    expect(await searchParticipants("")).toEqual([]);
  });

  it("excludes participants registered under another édition", async () => {
    const edition1 = await db.edition.findUniqueOrThrow({ where: { number: 1 } });
    await createTestParticipant({
      fullName: "Recherche Autre Edition Uniquement",
      phone: "+2290100000093",
      email: `search-otheredition${TEST_EMAIL_DOMAIN}`,
      editionId: edition1.id,
    });

    const results = await searchParticipants("Recherche Autre Edition Uniquement");

    expect(results).toEqual([]);
  });
});
