import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getMessageBatches } from "./batches";

describe("getMessageBatches", () => {
  afterEach(async () => {
    await db.messagingLog.deleteMany({ where: { batchLabel: "test-batch-dashboard" } });
  });

  it("groups messaging log rows by batchId and counts sent vs failed", async () => {
    await db.messagingLog.createMany({
      data: [
        { channel: "sms", status: "sent", batchId: "batch-test-1", batchLabel: "test-batch-dashboard" },
        { channel: "sms", status: "sent", batchId: "batch-test-1", batchLabel: "test-batch-dashboard" },
        { channel: "sms", status: "failed", batchId: "batch-test-1", batchLabel: "test-batch-dashboard" },
      ],
    });

    const batches = await getMessageBatches();
    const testBatch = batches.find((b) => b.batchId === "batch-test-1");

    expect(testBatch?.sentCount).toBe(2);
    expect(testBatch?.failedCount).toBe(1);
  });
});
