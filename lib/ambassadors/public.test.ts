import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { listActiveAmbassadors } from "./public";

const TEST_SLUG_PREFIX = "test-plan-public-ambassadors";

describe("listActiveAmbassadors", () => {
  afterEach(async () => {
    // Le nettoyage du Participant doit passer par afterEach, pas par une
    // suppression en fin de corps de test : si une assertion plus haut dans
    // le test échoue, une suppression en fin de corps ne s'exécute jamais,
    // laissant une ligne factice liée à une vraie édition survivre dans la
    // base partagée — cf. Finding 5 de la revue finale.
    await db.participant.deleteMany({ where: { fullName: { startsWith: TEST_SLUG_PREFIX } } });
    await db.ambassador.deleteMany({ where: { slug: { startsWith: TEST_SLUG_PREFIX } } });
  });

  it("only returns active ambassadors, with referredCount but no contact fields", async () => {
    const active = await db.ambassador.create({
      data: { slug: `${TEST_SLUG_PREFIX}-active`, fullName: "Active Ambassador", phone: "+2290100000060", active: true },
    });
    await db.ambassador.create({
      data: { slug: `${TEST_SLUG_PREFIX}-inactive`, fullName: "Inactive Ambassador", phone: "+2290100000061", active: false },
    });

    const edition4 = await db.edition.findUniqueOrThrow({ where: { number: 4 } });
    await db.participant.create({
      data: {
        editionId: edition4.id,
        fullName: `${TEST_SLUG_PREFIX} Referred`,
        phone: "+2290100000062",
        email: `public-referred@${TEST_SLUG_PREFIX}.example`,
        registrationSource: "form",
        ambassadorId: active.id,
      },
    });

    const result = await listActiveAmbassadors();
    const found = result.find((a) => a.slug === active.slug);

    expect(found).toBeDefined();
    expect(found?.referredCount).toBeGreaterThanOrEqual(1);
    expect(result.some((a) => a.slug === `${TEST_SLUG_PREFIX}-inactive`)).toBe(false);
    expect(found).not.toHaveProperty("phone");
    expect(found).not.toHaveProperty("attendedCount");
  });
});
