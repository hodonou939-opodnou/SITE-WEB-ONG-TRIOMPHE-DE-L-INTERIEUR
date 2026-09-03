import { db } from "@/lib/db";

export type CheckInResult =
  | { status: "not_found" }
  | { status: "already"; fullName: string; attendedAt: Date }
  | { status: "success"; fullName: string };

// A near-simultaneous double-scan of the same QR (two scanners, same
// visitor) can both pass the `!participant.attendedAt` check before either
// writes — an accepted, low-stakes race: worst case is the door briefly
// shows "success" twice for one person, never a duplicate row or a lost
// check-in, so no locking is added for it.
export async function checkInParticipant(token: string, scannerAdminId: string): Promise<CheckInResult> {
  const participant = await db.participant.findUnique({ where: { attendanceToken: token } });
  if (!participant) return { status: "not_found" };

  if (participant.attendedAt) {
    return { status: "already", fullName: participant.fullName, attendedAt: participant.attendedAt };
  }

  const updated = await db.participant.update({
    where: { id: participant.id },
    data: { attendedAt: new Date(), checkedInByAdminId: scannerAdminId },
  });

  return { status: "success", fullName: updated.fullName };
}
