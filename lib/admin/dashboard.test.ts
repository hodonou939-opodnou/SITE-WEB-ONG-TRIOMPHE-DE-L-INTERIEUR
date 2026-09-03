import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getDashboardStats } from "./dashboard";

const TEST_EMAIL_DOMAIN = "@test.plan.example";
// Le Bénin est en UTC+1 toute l'année (pas d'heure d'été).
const BENIN_UTC_OFFSET_MS = 60 * 60 * 1000;

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

  it("counts attendance recorded just after Bénin midnight, even when UTC still shows 'yesterday'", async () => {
    const edition4 = await db.edition.findUniqueOrThrow({ where: { number: 4 } });

    // Minuit à Cotonou correspond à 23h00 UTC la veille. On calcule cette
    // frontière avec de l'arithmétique UTC explicite (pas `setHours`, qui
    // dépend du fuseau de la machine qui exécute le test) pour que le
    // scénario reste valable quel que soit ce fuseau : sous l'ancienne
    // logique (minuit local du serveur), cet instant tombait la veille et
    // n'était pas compté.
    const now = new Date();
    const beninNow = new Date(now.getTime() + BENIN_UTC_OFFSET_MS);
    const startOfTodayBenin = Date.UTC(beninNow.getUTCFullYear(), beninNow.getUTCMonth(), beninNow.getUTCDate());
    const startOfTodayUtc = startOfTodayBenin - BENIN_UTC_OFFSET_MS;
    const justAfterBeninMidnight = new Date(startOfTodayUtc + 5 * 60 * 1000);

    await db.participant.create({
      data: {
        editionId: edition4.id,
        fullName: "Attended Just After Bénin Midnight",
        phone: "+2290100000004",
        email: `d${TEST_EMAIL_DOMAIN}`,
        registrationSource: "form",
        attendedAt: justAfterBeninMidnight,
      },
    });

    const stats = await getDashboardStats();

    expect(stats.attendedToday).toBeGreaterThanOrEqual(1);
  });
});
