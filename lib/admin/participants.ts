import { db } from "@/lib/db";

export type ParticipantRow = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  registeredAt: Date;
  attendedAt: Date | null;
  ambassadorName: string | null;
};

export async function getParticipantsForEdition(
  editionNumber: number
): Promise<{ available: false } | { available: true; edition: { theme: string }; participants: ParticipantRow[] }> {
  const edition = await db.edition.findUniqueOrThrow({ where: { number: editionNumber } });

  if (!edition.hasParticipantData) {
    return { available: false };
  }

  const participants = await db.participant.findMany({
    where: { editionId: edition.id },
    include: { ambassador: { select: { fullName: true } } },
    orderBy: { registeredAt: "desc" },
  });

  return {
    available: true,
    edition: { theme: edition.theme },
    participants: participants.map((p) => ({
      id: p.id,
      fullName: p.fullName,
      phone: p.phone,
      email: p.email,
      registeredAt: p.registeredAt,
      attendedAt: p.attendedAt,
      ambassadorName: p.ambassador?.fullName ?? null,
    })),
  };
}
