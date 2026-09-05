import { db } from "@/lib/db";

export type CheckInResult =
  | { status: "not_found" }
  | { status: "already"; fullName: string; attendedAt: Date }
  | { status: "success"; fullName: string };

// Never carries attendanceToken — it's a bearer credential (whoever holds it
// can check the participant in), and the door search has no need to send it
// to the browser.
export type ParticipantMatch = {
  id: string;
  fullName: string;
  phone: string;
  attendedAt: Date | null;
};

type AttendanceState = { id: string; fullName: string; attendedAt: Date | null };

// A near-simultaneous double-scan of the same participant (two scanners, same
// visitor — whether found by QR token or by search) can both pass the
// `!participant.attendedAt` check before either writes — an accepted,
// low-stakes race: worst case is the door briefly shows "success" twice for
// one person, never a duplicate row or a lost check-in, so no locking is
// added for it. Within that race window, the second write still lands:
// `checkedInByAdminId` and `attendedAt` end up reflecting whichever of the
// two updates completes last, silently overwriting the first scanner's
// credit.
async function markAttended(participant: AttendanceState, scannerAdminId: string): Promise<CheckInResult> {
  if (participant.attendedAt) {
    return { status: "already", fullName: participant.fullName, attendedAt: participant.attendedAt };
  }

  const updated = await db.participant.update({
    where: { id: participant.id },
    data: { attendedAt: new Date(), checkedInByAdminId: scannerAdminId },
  });

  return { status: "success", fullName: updated.fullName };
}

export async function checkInParticipant(token: string, scannerAdminId: string): Promise<CheckInResult> {
  const participant = await db.participant.findUnique({ where: { attendanceToken: token } });
  if (!participant) return { status: "not_found" };
  return markAttended(participant, scannerAdminId);
}

// Same semantics as checkInParticipant, keyed on the participant's id instead
// of their token — what the manual search fallback calls once staff pick a
// person from the results (bad lighting / camera failure at the door).
export async function checkInParticipantById(id: string, scannerAdminId: string): Promise<CheckInResult> {
  const participant = await db.participant.findUnique({ where: { id } });
  if (!participant) return { status: "not_found" };
  return markAttended(participant, scannerAdminId);
}

// Manual door fallback: search by name or phone when the camera can't read a
// badge. Scoped to édition 4 (the event being scanned) — mirrors the
// resolution pattern used for the anti-duplicate check in
// app/api/cigibm-register/route.ts.
export async function searchParticipants(query: string): Promise<ParticipantMatch[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const edition4 = await db.edition.findUnique({ where: { number: 4 } });
  if (!edition4) return [];

  return db.participant.findMany({
    where: {
      editionId: edition4.id,
      OR: [
        // Phone numbers are stored normalised as +229XXXXXXXX. A staffer
        // typing the local form (e.g. "0100000010") still matches
        // "+2290100000010" via a plain `contains` — the local form is exactly
        // the +229-prefixed string's suffix, no extra normalisation needed.
        { fullName: { contains: trimmed, mode: "insensitive" } },
        { phone: { contains: trimmed } },
      ],
    },
    orderBy: { fullName: "asc" },
    take: 10,
    select: { id: true, fullName: true, phone: true, attendedAt: true },
  });
}
