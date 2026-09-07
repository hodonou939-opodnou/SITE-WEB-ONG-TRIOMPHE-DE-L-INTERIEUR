"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { buildBadgeReminderEmail, sendTransactionalEmail } from "@/lib/email";

export type SendBadgeLinkResult = { ok: true } | { ok: false; error: string };

// Renvoie le lien de badge « J'y serai » à un seul participant, à la demande
// d'un·e admin depuis /admin/participants — utile pour quelqu'un inscrit
// avant l'ajout du bouton badge, ou qui a perdu son email d'origine.
// buildBadgeReminderEmail (pas buildConfirmationEmail) : un renvoi n'est pas
// une nouvelle inscription, "Inscription confirmée" n'aurait pas de sens ici.
export async function sendBadgeLinkAction(participantId: string): Promise<SendBadgeLinkResult> {
  const session = await requireAdmin();

  const participant = await db.participant.findUnique({ where: { id: participantId } });
  if (!participant) return { ok: false, error: "Participant introuvable." };
  if (!participant.email) return { ok: false, error: "Aucun email enregistré pour ce participant." };

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return { ok: false, error: "Service d'email non configuré." };

  const message = buildBadgeReminderEmail(participant.fullName, participant.attendanceToken);
  const res = await sendTransactionalEmail(apiKey, { email: participant.email, name: participant.fullName }, message, {
    participantId: participant.id,
    sentByAdminId: session.id,
    batchLabel: "Renvoi manuel du badge (admin)",
  });

  if (!res.ok) return { ok: false, error: "L'envoi a échoué. Réessayez." };
  return { ok: true };
}
