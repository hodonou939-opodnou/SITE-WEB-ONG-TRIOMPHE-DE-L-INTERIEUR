import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// This script must run standalone (via `npm run db:seed` or `prisma migrate
// reset`), where nothing else has loaded .env.local yet, so it loads it
// itself. Harmless no-op when a caller (e.g. lib/db.test.ts via Vitest)
// already loaded it — dotenv doesn't override already-set vars.
config({ path: ".env.local", quiet: true });

// Builds its own client rather than importing lib/db.ts's singleton, since
// this file must also be runnable standalone. See lib/db.ts for why a
// driver adapter is required (Prisma 7).
const adapter = new PrismaPg(process.env.DATABASE_URL!);
const db = new PrismaClient({ adapter });

export async function seedEditions() {
  const editions = [
    { number: 1, theme: "La dépression, parlons-en", dates: "29 mars 2023", venue: "Very Nice Hôtel", hasParticipantData: false },
    { number: 2, theme: "Réinvente-toi", dates: "27 avril 2024", venue: "Lucide Palace, Godomey", hasParticipantData: false },
    { number: 3, theme: "Équilibre", dates: "29-30 novembre 2025", venue: "Godomey puis Cotonou", hasParticipantData: false },
    { number: 4, theme: "Le vaccin de la dépression", dates: "17 et 18 octobre 2026", venue: "Palais des Congrès de Cotonou", hasParticipantData: true },
  ];

  for (const edition of editions) {
    await db.edition.upsert({
      where: { number: edition.number },
      update: edition,
      create: edition,
    });
  }
}

async function main() {
  await seedEditions();
  console.log("Seeded 4 éditions.");
}

// Only run automatically when executed directly (via `npm run db:seed`),
// not when imported by a test.
if (require.main === module) {
  main()
    .then(() => db.$disconnect())
    .catch(async (err) => {
      console.error(err);
      await db.$disconnect();
      process.exit(1);
    });
}
