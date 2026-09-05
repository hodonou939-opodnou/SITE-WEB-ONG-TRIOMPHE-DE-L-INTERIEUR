"use server";

import { requireScanAccess } from "@/lib/admin/auth";
import {
  checkInParticipant,
  checkInParticipantById,
  searchParticipants,
  type CheckInResult,
  type ParticipantMatch,
} from "@/lib/checkin/checkin";

export async function checkInAction(token: string): Promise<CheckInResult> {
  const session = await requireScanAccess();
  return checkInParticipant(token.trim(), session.id);
}

// Manual fallback for bad lighting / camera failures at the door: search by
// name or phone instead of scanning the QR code.
export async function searchParticipantsAction(query: string): Promise<ParticipantMatch[]> {
  await requireScanAccess();
  return searchParticipants(query);
}

// Companion to searchParticipantsAction: check in whoever staff picked from
// the search results.
export async function checkInByIdAction(participantId: string): Promise<CheckInResult> {
  const session = await requireScanAccess();
  return checkInParticipantById(participantId, session.id);
}
