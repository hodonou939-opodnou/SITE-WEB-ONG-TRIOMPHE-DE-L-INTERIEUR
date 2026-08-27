import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { logMessage } from "./log";

// Literal distinct to this task (Task 9) — deliberately not the shared
// `@test.plan.example` / generic-subject literals other test files use, so
// this file's afterEach cleanup can never race-delete another file's
// in-flight fixtures under Vitest's parallel test-file execution against
// the one shared Supabase instance (see Task 7's diagnosis of that failure
// mode).
const TEST_SUBJECT = "task9-messaging-log-test-subject";

describe("logMessage", () => {
  afterEach(async () => {
    await db.messagingLog.deleteMany({ where: { subject: TEST_SUBJECT } });
  });

  it("writes a MessagingLog row with the given fields", async () => {
    await logMessage({
      channel: "email",
      recipientEmail: "log-test@task9.test.plan.example",
      subject: TEST_SUBJECT,
      status: "sent",
      providerMessageId: "msg-123",
    });

    const row = await db.messagingLog.findFirst({ where: { subject: TEST_SUBJECT } });
    expect(row).not.toBeNull();
    expect(row?.channel).toBe("email");
    expect(row?.status).toBe("sent");
    expect(row?.providerMessageId).toBe("msg-123");
  });
});
