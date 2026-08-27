import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/admin/auth";
import { resolveAudience } from "@/lib/messaging/audience";
import { sendSms } from "@/lib/messaging/sms";
import { sendWhatsApp } from "@/lib/messaging/whatsapp";
import { sendTransactionalEmail } from "@/lib/email";
import { logMessage } from "@/lib/messaging/log";

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

  const recipients = await resolveAudience({ editionNumber, onlyNonAttendees });
  const batchId = randomUUID();
  let sentCount = 0;

  for (const recipient of recipients) {
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
    } else if (recipient.email) {
      const apiKey = process.env.BREVO_API_KEY;
      if (!apiKey) continue;
      const res = await sendTransactionalEmail(
        apiKey,
        { email: recipient.email, name: recipient.fullName },
        { subject: batchLabel, html: `<p>${message}</p>` },
        { participantId: recipient.id, batchId, batchLabel, sentByAdminId: admin.id }
      );
      if (res.ok) sentCount++;
    }
  }

  return NextResponse.json({ sentCount, totalRecipients: recipients.length, batchId });
}
