// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { checkInParticipant } from "./checkin";

const TEST_EMAIL_DOMAIN = "@test.plan.checkin.example";

async function createTestParticipant(overrides: { attendedAt?: Date } = {}) {
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
