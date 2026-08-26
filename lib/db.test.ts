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

describe("AdminProfile auto-provisioning trigger", () => {
  const testUserId = "00000000-0000-0000-0000-000000000001";

  afterAll(async () => {
    await db.adminProfile.deleteMany({ where: { id: testUserId } });
    await db.$executeRawUnsafe(`delete from auth.users where id = '${testUserId}'`);
  });

  it("creates an AdminProfile row when a new auth.users row is inserted", async () => {
    await db.$executeRawUnsafe(`
      insert into auth.users (id, email, raw_user_meta_data)
      values ('${testUserId}', 'trigger-test@test.plan.example', '{"full_name": "Trigger Test"}'::jsonb)
    `);

    const profile = await db.adminProfile.findUnique({ where: { id: testUserId } });
    expect(profile).not.toBeNull();
    expect(profile?.fullName).toBe("Trigger Test");
    expect(profile?.role).toBe("scanner");
  });

  describe("when the new user has no full_name metadata and no email", () => {
    const phoneOnlyUserId = "00000000-0000-0000-0000-000000000002";
    const phone = "+10000000002";

    afterAll(async () => {
      await db.adminProfile.deleteMany({ where: { id: phoneOnlyUserId } });
      await db.$executeRawUnsafe(`delete from auth.users where id = '${phoneOnlyUserId}'`);
    });

    it("still creates an AdminProfile row, falling back to the phone number", async () => {
      // No raw_user_meta_data, no email — a phone-only signup. The original
      // coalesce(full_name, email) had no final fallback, so this insert used
      // to raise a NOT NULL violation on "AdminProfile"."fullName" and abort
      // the whole transaction, silently preventing the auth user from being
      // created at all.
      await db.$executeRawUnsafe(`
        insert into auth.users (id, phone)
        values ('${phoneOnlyUserId}', '${phone}')
      `);

      const profile = await db.adminProfile.findUnique({ where: { id: phoneOnlyUserId } });
      expect(profile).not.toBeNull();
      expect(profile?.fullName).toBe(phone);
      expect(profile?.role).toBe("scanner");
    });
  });
});
