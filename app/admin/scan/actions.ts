"use server";

import { requireScanAccess } from "@/lib/admin/auth";
import { checkInParticipant, type CheckInResult } from "@/lib/checkin/checkin";

export async function checkInAction(token: string): Promise<CheckInResult> {
  const session = await requireScanAccess();
  return checkInParticipant(token.trim(), session.id);
}
