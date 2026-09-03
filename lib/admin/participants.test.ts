import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getParticipantsForEdition } from "./participants";

// Domaine distinct de celui de dashboard.test.ts : Vitest exécute les
// fichiers de test en parallèle contre la même base partagée, et un domaine
// identique ferait que le afterEach de l'un supprime en pleine course les
// lignes que l'autre vient de créer (constaté empiriquement : échecs non
// déterministes avant ce changement).
const TEST_EMAIL_DOMAIN = "@test.plan.participants.example";

describe("getParticipantsForEdition", () => {
  afterEach(async () => {
    await db.participant.deleteMany({ where: { email: { endsWith: TEST_EMAIL_DOMAIN } } });
  });

  it("reports unavailable data for éditions 1-3", async () => {
    const result = await getParticipantsForEdition(2);
    expect(result).toEqual({ available: false });
  });

  it("returns the participant list for édition 4", async () => {
    const edition4 = await db.edition.findUniqueOrThrow({ where: { number: 4 } });
    await db.participant.create({
      data: {
        editionId: edition4.id,
        fullName: "Test Participant",
        phone: "+2290100000099",
        email: `p${TEST_EMAIL_DOMAIN}`,
        registrationSource: "form",
      },
    });

    const result = await getParticipantsForEdition(4);

    expect(result.available).toBe(true);
    if (result.available) {
      expect(result.edition.theme).toBe("Le vaccin de la dépression");
      expect(result.participants.some((p) => p.fullName === "Test Participant")).toBe(true);
    }
  });

  it("throws for a non-existent édition number", async () => {
    await expect(getParticipantsForEdition(99)).rejects.toThrow();
  });
});
