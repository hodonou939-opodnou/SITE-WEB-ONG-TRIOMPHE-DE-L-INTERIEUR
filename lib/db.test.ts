import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "./db";

describe("database connection and Edition seed", () => {
  beforeAll(async () => {
    // The seed script is idempotent (upsert by `number`), safe to run again here.
    const { seedEditions } = await import("../prisma/seed");
    await seedEditions();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("connects and returns exactly 4 éditions", async () => {
    const editions = await db.edition.findMany({ orderBy: { number: "asc" } });
    expect(editions).toHaveLength(4);
  });

  it("marks éditions 1-3 as having no participant data, and édition 4 as having it", async () => {
    const editions = await db.edition.findMany({ orderBy: { number: "asc" } });
    expect(editions.map((e) => e.hasParticipantData)).toEqual([false, false, false, true]);
  });

  it("stores the real théme/dates/venue for the 4th édition", async () => {
    const edition4 = await db.edition.findUniqueOrThrow({ where: { number: 4 } });
    expect(edition4.theme).toBe("Le vaccin de la dépression");
    expect(edition4.dates).toBe("17 et 18 octobre 2026");
  });
});
