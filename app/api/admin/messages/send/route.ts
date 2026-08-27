import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { resolveAudience } from "@/lib/messaging/audience";
import { sendSms } from "@/lib/messaging/sms";
import { sendWhatsApp } from "@/lib/messaging/whatsapp";
import { sendTransactionalEmail } from "@/lib/email";
import { logMessage } from "@/lib/messaging/log";
import type { MessageChannel } from "@prisma/client";

// Un vrai plafond de débit demanderait une file d'attente (hors périmètre de
// ce correctif) ; en attendant, ce plafond garde chaque envoi confortablement
// sous maxDuration (300s) : ~400-500ms par destinataire (un appel HTTP Brevo
// + une écriture Postgres) donne un pire cas d'environ 80-100s pour 200
// destinataires, avec une marge large avant la coupure à 300s.
const MAX_RECIPIENTS = 200;

// Un envoi groupé sur une audience réaliste (l'exemple du cahier des charges
// est 340 destinataires) fait un appel HTTP Brevo + une écriture Postgres
// par destinataire, en série. Sans budget explicite, la fonction dépasse la
// limite par défaut de la plateforme en pleine boucle. Ceci reste un
// palliatif minimal : la vraie solution est une file d'attente, hors
// périmètre de ce correctif (cf. Finding 3 de la revue finale).
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  const body = await request.json();

  const { channel, editionNumber, message, batchLabel, onlyNonAttendees } = body as {
    channel: "email" | "sms" | "whatsapp";
    editionNumber: number;
    message: string;
    batchLabel: string;
    onlyNonAttendees?: boolean;
  };

  if (channel !== "email" && channel !== "sms" && channel !== "whatsapp") {
    return NextResponse.json(
      { error: "Canal invalide : choisissez « email », « sms » ou « whatsapp »." },
      { status: 400 }
    );
  }

  if (typeof message !== "string" || message.trim() === "") {
    return NextResponse.json({ error: "Le message ne peut pas être vide." }, { status: 400 });
  }

  if (typeof batchLabel !== "string" || batchLabel.trim() === "") {
    return NextResponse.json(
      { error: "Le libellé du lot ne peut pas être vide." },
      { status: 400 }
    );
  }

  if (typeof editionNumber !== "number" || !Number.isInteger(editionNumber)) {
    return NextResponse.json({ error: "Numéro d'édition invalide." }, { status: 400 });
  }

  // Validation explicite plutôt que de laisser resolveAudience() (via
  // findUniqueOrThrow) transformer une édition inexistante en 500 non géré —
  // sans modifier le contrat de resolveAudience() lui-même, dont d'autres
  // appelants dépendent peut-être.
  const edition = await db.edition.findUnique({ where: { number: editionNumber } });
  if (!edition) {
    return NextResponse.json(
      { error: `Aucune édition ne correspond au numéro ${editionNumber}.` },
      { status: 400 }
    );
  }

  const recipients = await resolveAudience({ editionNumber, onlyNonAttendees });

  if (recipients.length > MAX_RECIPIENTS) {
    return NextResponse.json(
      {
        error: `Cette audience compte ${recipients.length} destinataires, au-delà de la limite de ${MAX_RECIPIENTS} par envoi. Réduisez l'audience (par édition ou en cochant « uniquement les non-présents ») avant de renvoyer.`,
      },
      { status: 400 }
    );
  }

  const batchId = randomUUID();
  let sentCount = 0;
  let failedCount = 0;

  for (const recipient of recipients) {
    try {
      if (channel === "sms") {
        const result = await sendSms(recipient.phone, message);
        await logMessage({
          channel: "sms",
          recipientPhone: recipient.phone,
          participantId: recipient.id,
          status: result.ok ? "sent" : "failed",
          providerMessageId: result.providerMessageId,
          errorMessage: result.error,
          batchId,
          batchLabel,
          sentByAdminId: admin.id,
        });
        if (result.ok) sentCount++;
        else failedCount++;
      } else if (channel === "whatsapp") {
        const result = await sendWhatsApp(recipient.phone, message);
        await logMessage({
          channel: "whatsapp",
          recipientPhone: recipient.phone,
          participantId: recipient.id,
          status: "failed",
          errorMessage: result.error,
          batchId,
          batchLabel,
          sentByAdminId: admin.id,
        });
        failedCount++;
      } else if (recipient.email) {
        const apiKey = process.env.BREVO_API_KEY;
        if (!apiKey) continue;
        const htmlMessage = message.replace(/\r\n|\n/g, "<br>");
        const res = await sendTransactionalEmail(
          apiKey,
          { email: recipient.email, name: recipient.fullName },
          { subject: batchLabel, html: `<p>${htmlMessage}</p>` },
          { participantId: recipient.id, batchId, batchLabel, sentByAdminId: admin.id }
        );
        if (res.ok) sentCount++;
        else failedCount++;
      }
    } catch (err) {
      // Isole une panne transitoire (ex. fetch rejeté dans sendSms) sur ce
      // seul destinataire : sans ce try/catch, une seule erreur fait
      // échouer toute la requête (500, sans batchId), en plein milieu d'un
      // lot où certains destinataires ont déjà reçu un message réel — cf.
      // Finding 2 de la revue finale.
      failedCount++;
      const errorMessage = err instanceof Error ? err.message : String(err);
      try {
        await logMessage({
          channel: channel as MessageChannel,
          recipientPhone: recipient.phone,
          recipientEmail: recipient.email ?? undefined,
          participantId: recipient.id,
          status: "failed",
          errorMessage,
          batchId,
          batchLabel,
          sentByAdminId: admin.id,
        });
      } catch (logErr) {
        console.error("logMessage failed while recording a send failure", logErr);
      }
    }
  }

  return NextResponse.json({ sentCount, failedCount, totalRecipients: recipients.length, batchId });
}
