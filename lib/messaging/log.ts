import { db } from "@/lib/db";
import type { MessageChannel, MessageStatus } from "@prisma/client";

export async function logMessage(entry: {
  channel: MessageChannel;
  recipientPhone?: string;
  recipientEmail?: string;
  participantId?: string;
  subject?: string;
  status: MessageStatus;
  providerMessageId?: string;
  errorMessage?: string;
  batchId?: string;
  batchLabel?: string;
  sentByAdminId?: string;
}): Promise<void> {
  await db.messagingLog.create({ data: entry });
}
