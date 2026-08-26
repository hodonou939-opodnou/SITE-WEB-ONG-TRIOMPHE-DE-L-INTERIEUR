import { db } from "@/lib/db";

export async function getDashboardStats() {
  const editions = await db.edition.findMany({
    include: { _count: { select: { participants: true } } },
    orderBy: { number: "asc" },
  });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

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
