import { db } from "@/lib/db";

// Le Bénin est en UTC+1 toute l'année (pas d'heure d'été), donc un décalage
// fixe suffit — inutile de dépendre d'une librairie de fuseaux horaires.
const BENIN_UTC_OFFSET_MS = 60 * 60 * 1000;

export async function getDashboardStats() {
  const editions = await db.edition.findMany({
    include: { _count: { select: { participants: true } } },
    orderBy: { number: "asc" },
  });

  // "Aujourd'hui" doit s'entendre à l'heure de Cotonou, pas à celle du
  // serveur (Vercel tourne en UTC) : on décale l'instant courant vers
  // l'heure béninoise, on tronque au début de ce jour-là, puis on revient
  // à l'instant UTC correspondant pour la requête.
  const now = new Date();
  const beninNow = new Date(now.getTime() + BENIN_UTC_OFFSET_MS);
  const startOfTodayBenin = Date.UTC(beninNow.getUTCFullYear(), beninNow.getUTCMonth(), beninNow.getUTCDate());
  const startOfToday = new Date(startOfTodayBenin - BENIN_UTC_OFFSET_MS);

  const attendedToday = await db.participant.count({
    where: { attendedAt: { gte: startOfToday } },
  });

  const totalParticipants = editions.reduce((sum, e) => sum + e._count.participants, 0);

  return {
    totalParticipants,
    participantsByEdition: editions.map((e) => ({ editionNumber: e.number, count: e._count.participants })),
    attendedToday,
  };
}
