import { db } from "@/lib/db";

export async function resolveAudience(filter: {
  editionNumber: number;
  onlyNonAttendees?: boolean;
}): Promise<{ id: string; fullName: string; phone: string; email: string | null }[]> {
  const edition = await db.edition.findUniqueOrThrow({ where: { number: filter.editionNumber } });

  const participants = await db.participant.findMany({
    where: {
      editionId: edition.id,
      ...(filter.onlyNonAttendees ? { attendedAt: null } : {}),
    },
    select: { id: true, fullName: true, phone: true, email: true },
  });

  return participants;
}
