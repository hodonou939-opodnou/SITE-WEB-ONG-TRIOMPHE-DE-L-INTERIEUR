import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  createAmbassador,
  getAmbassador,
  listAmbassadorsWithStats,
  updateAmbassador,
} from "./ambassadors";

const TEST_SLUG_PREFIX = "test-plan-ambassadors";

describe("createAmbassador", () => {
  afterEach(async () => {
    await db.ambassador.deleteMany({ where: { slug: { startsWith: TEST_SLUG_PREFIX } } });
  });

  it("creates an ambassador with a slug derived from the name", async () => {
    const result = await createAmbassador({
      fullName: `${TEST_SLUG_PREFIX} Alpha`,
      phone: "+2290100000041",
    });

    expect(result.slug).toBe("test-plan-ambassadors-alpha");
    const row = await db.ambassador.findUnique({ where: { id: result.id } });
    expect(row?.fullName).toBe(`${TEST_SLUG_PREFIX} Alpha`);
    expect(row?.active).toBe(true);
  });

  it("appends a random suffix instead of colliding on a duplicate name", async () => {
    const first = await createAmbassador({ fullName: `${TEST_SLUG_PREFIX} Beta`, phone: "+2290100000042" });
    const second = await createAmbassador({ fullName: `${TEST_SLUG_PREFIX} Beta`, phone: "+2290100000043" });

    expect(first.slug).not.toBe(second.slug);
    expect(second.slug).toMatch(new RegExp(`^${TEST_SLUG_PREFIX}-beta-[a-z0-9]{4,6}$`));
  });
});

describe("listAmbassadorsWithStats", () => {
  afterEach(async () => {
    await db.participant.deleteMany({ where: { fullName: { startsWith: TEST_SLUG_PREFIX } } });
    await db.ambassador.deleteMany({ where: { slug: { startsWith: TEST_SLUG_PREFIX } } });
  });

  it("computes referredCount and attendedCount from real Participant rows", async () => {
    const ambassador = await createAmbassador({ fullName: `${TEST_SLUG_PREFIX} Gamma`, phone: "+2290100000044" });
    const edition4 = await db.edition.findUniqueOrThrow({ where: { number: 4 } });

    await db.participant.createMany({
      data: [
        {
          editionId: edition4.id,
          fullName: `${TEST_SLUG_PREFIX} Referred Attended`,
          phone: "+2290100000045",
          email: `gamma-attended@${TEST_SLUG_PREFIX}.example`,
          registrationSource: "form",
          ambassadorId: ambassador.id,
          attendedAt: new Date(),
        },
        {
          editionId: edition4.id,
          fullName: `${TEST_SLUG_PREFIX} Referred Not Attended`,
          phone: "+2290100000046",
          email: `gamma-notattended@${TEST_SLUG_PREFIX}.example`,
          registrationSource: "form",
          ambassadorId: ambassador.id,
        },
      ],
    });

    const list = await listAmbassadorsWithStats();
    const row = list.find((a) => a.id === ambassador.id);

    expect(row?.referredCount).toBe(2);
    expect(row?.attendedCount).toBe(1);
  });
});

describe("getAmbassador / updateAmbassador", () => {
  afterEach(async () => {
    await db.ambassador.deleteMany({ where: { slug: { startsWith: TEST_SLUG_PREFIX } } });
  });

  it("returns null for a non-existent id", async () => {
    const result = await getAmbassador("00000000-0000-0000-0000-000000000000");
    expect(result).toBeNull();
  });

  it("updates the editable fields and can deactivate", async () => {
    const created = await createAmbassador({ fullName: `${TEST_SLUG_PREFIX} Delta`, phone: "+2290100000047" });

    await updateAmbassador(created.id, {
      fullName: `${TEST_SLUG_PREFIX} Delta Updated`,
      phone: "+2290100000048",
      whatsappNumber: "+2290100000049",
      email: `delta@${TEST_SLUG_PREFIX}.example`,
      photoUrl: "https://example.test/photo.jpg",
      bio: "Bio de test.",
      active: false,
    });

    const updated = await getAmbassador(created.id);
    expect(updated?.fullName).toBe(`${TEST_SLUG_PREFIX} Delta Updated`);
    expect(updated?.phone).toBe("+2290100000048");
    expect(updated?.active).toBe(false);
    // Slug never changes on update — the referral URL must stay stable.
    expect(updated?.slug).toBe(created.slug);
  });
});
