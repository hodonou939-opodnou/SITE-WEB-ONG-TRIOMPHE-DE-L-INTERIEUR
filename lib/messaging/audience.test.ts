import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { resolveAudience } from "./audience";

// Domaine distinct des autres fichiers de test (participants.test.ts,
// dashboard.test.ts, log.test.ts, etc.) : Vitest exécute les fichiers de
// test en parallèle contre la même base Supabase partagée, et un domaine
// identique ferait que le afterEach de l'un supprime en pleine course les
// lignes que l'autre vient de créer. Voir participants.test.ts pour le
// précédent de ce constat.
const TEST_EMAIL_DOMAIN = "@test.plan.audience.example";

describe("resolveAudience", () => {
  afterEach(async () => {
    await db.participant.deleteMany({ where: { email: { endsWith: TEST_EMAIL_DOMAIN } } });
  });

  it("returns every participant of the given édition by default", async () => {
    const edition4 = await db.edition.findUniqueOrThrow({ where: { number: 4 } });
    await db.participant.createMany({
      data: [
        {
          editionId: edition4.id,
          fullName: "Audience Attended",
          phone: "+2290100000021",
          email: `att${TEST_EMAIL_DOMAIN}`,
          registrationSource: "form",
          attendedAt: new Date(),
        },
        {
          editionId: edition4.id,
          fullName: "Audience Not Attended",
          phone: "+2290100000022",
          email: `notatt${TEST_EMAIL_DOMAIN}`,
          registrationSource: "form",
        },
      ],
    });

    const audience = await resolveAudience({ editionNumber: 4 });

    expect(audience.some((p) => p.fullName === "Audience Attended")).toBe(true);
    expect(audience.some((p) => p.fullName === "Audience Not Attended")).toBe(true);
  });

  it("excludes participants who already attended when onlyNonAttendees is true", async () => {
    const edition4 = await db.edition.findUniqueOrThrow({ where: { number: 4 } });
    await db.participant.createMany({
      data: [
        {
          editionId: edition4.id,
          fullName: "Audience Attended2",
          phone: "+2290100000023",
          email: `att2${TEST_EMAIL_DOMAIN}`,
          registrationSource: "form",
          attendedAt: new Date(),
        },
        {
          editionId: edition4.id,
          fullName: "Audience Not Attended2",
          phone: "+2290100000024",
          email: `notatt2${TEST_EMAIL_DOMAIN}`,
          registrationSource: "form",
        },
      ],
    });

    const audience = await resolveAudience({ editionNumber: 4, onlyNonAttendees: true });

    expect(audience.some((p) => p.fullName === "Audience Attended2")).toBe(false);
    expect(audience.some((p) => p.fullName === "Audience Not Attended2")).toBe(true);
  });
});
