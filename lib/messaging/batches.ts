import { db } from "@/lib/db";

export async function getMessageBatches() {
  const logs = await db.messagingLog.findMany({
    where: { batchId: { not: null } },
    orderBy: { sentAt: "desc" },
  });

  const byBatch = new Map<string, typeof logs>();
  for (const log of logs) {
    if (!log.batchId) continue;
    const existing = byBatch.get(log.batchId) ?? [];
    existing.push(log);
    byBatch.set(log.batchId, existing);
  }

  return Array.from(byBatch.entries()).map(([batchId, entries]) => ({
    batchId,
    batchLabel: entries[0].batchLabel ?? "(sans nom)",
    channel: entries[0].channel,
    sentAt: entries[0].sentAt,
    sentCount: entries.filter((e) => e.status === "sent").length,
    failedCount: entries.filter((e) => e.status === "failed").length,
  }));
}
