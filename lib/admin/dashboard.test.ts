import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getDashboardStats } from "./dashboard";

const TEST_EMAIL_DOMAIN = "@test.plan.example";

describe("getDashboardStats", () => {
  afterEach(async () => {
    await db.participant.deleteMany({ where: { email: { endsWith: TEST_EMAIL_DOMAIN } } });
  });

  it("counts participants per édition and total", async () => {
    const edition4 = await db.edition.findUniqueOrThrow({ where: { number: 4 } });

    await db.participant.createMany({
      data: [
        { editionId: edition4.id, fullName: "A", phone: "+2290100000001", email: `a${TEST_EMAIL_DOMAIN}`, registrationSource: "form" },
        { editionId: edition4.id, fullName: "B", phone: "+2290100000002", email: `b${TEST_EMAIL_DOMAIN}`, registrationSource: "form" },
      ],
    });

    const stats = await getDashboardStats();

    const edition4Stats = stats.participantsByEdition.find((e) => e.editionNumber === 4);
    expect(edition4Stats?.count).toBeGreaterThanOrEqual(2);
    expect(stats.totalParticipants).toBeGreaterThanOrEqual(2);
  });

  it("counts today's attendance separately from total registrations", async () => {
    const edition4 = await db.edition.findUniqueOrThrow({ where: { number: 4 } });

    await db.participant.create({
      data: {
        editionId: edition4.id,
        fullName: "Attended Today",
        phone: "+2290100000003",
        email: `c${TEST_EMAIL_DOMAIN}`,
        registrationSource: "form",
        attendedAt: new Date(),
      },
    });

    const stats = await getDashboardStats();

    expect(stats.attendedToday).toBeGreaterThanOrEqual(1);
  });
});
