// @vitest-environment node
import { createHmac } from "crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

vi.stubEnv("WHATSAPP_VERIFY_TOKEN", "test-verify-token");

// Literal distinct des autres fichiers de test partageant la même base
// réelle (cf. lib/messaging/log.test.ts) : aucun autre fichier n'utilise ce
// subject, donc son afterEach ne peut jamais entrer en course avec un
// autre.
const TEST_SUBJECT = "test-plan-whatsapp-webhook";

describe("GET /api/whatsapp/webhook", () => {
  it("echoes hub.challenge when the mode and verify token match", async () => {
    const { GET } = await import("./route");
    const request = new NextRequest(
      "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=test-verify-token&hub.challenge=12345"
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("12345");
  });

  it("rejects a verification request with the wrong token", async () => {
    const { GET } = await import("./route");
    const request = new NextRequest(
      "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong-token&hub.challenge=12345"
    );

    const response = await GET(request);

    expect(response.status).toBe(403);
  });
});

describe("POST /api/whatsapp/webhook", () => {
  afterEach(async () => {
    await db.messagingLog.deleteMany({ where: { subject: TEST_SUBJECT } });
    vi.unstubAllEnvs();
    vi.stubEnv("WHATSAPP_VERIFY_TOKEN", "test-verify-token");
  });

  function buildPostRequest(body: unknown, headers: Record<string, string> = {}) {
    return new NextRequest("http://localhost:3000/api/whatsapp/webhook", {
      method: "POST",
      body: JSON.stringify(body),
      headers,
    });
  }

  it("updates the matching MessagingLog row when a delivery status arrives", async () => {
    const log = await db.messagingLog.create({
      data: {
        channel: "whatsapp",
        recipientPhone: "+22900000000",
        subject: TEST_SUBJECT,
        status: "queued",
        providerMessageId: "wamid.test-status-1",
      },
    });

    const { POST } = await import("./route");
    const response = await POST(
      buildPostRequest({
        entry: [
          {
            changes: [
              { value: { statuses: [{ id: "wamid.test-status-1", status: "delivered" }] } },
            ],
          },
        ],
      })
    );

    expect(response.status).toBe(200);
    const updated = await db.messagingLog.findUnique({ where: { id: log.id } });
    expect(updated?.status).toBe("sent");
  });

  it("marks the MessagingLog row failed when the status is failed", async () => {
    const log = await db.messagingLog.create({
      data: {
        channel: "whatsapp",
        recipientPhone: "+22900000001",
        subject: TEST_SUBJECT,
        status: "queued",
        providerMessageId: "wamid.test-status-2",
      },
    });

    const { POST } = await import("./route");
    await POST(
      buildPostRequest({
        entry: [{ changes: [{ value: { statuses: [{ id: "wamid.test-status-2", status: "failed" }] } }] }],
      })
    );

    const updated = await db.messagingLog.findUnique({ where: { id: log.id } });
    expect(updated?.status).toBe("failed");
  });

  it("does not throw when the status references an unknown message id", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      buildPostRequest({
        entry: [{ changes: [{ value: { statuses: [{ id: "wamid.does-not-exist", status: "delivered" }] } }] }],
      })
    );

    expect(response.status).toBe(200);
  });

  it("acknowledges an inbound message payload without crashing", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      buildPostRequest({
        entry: [
          { changes: [{ value: { messages: [{ id: "wamid.inbound-1", from: "+22900000002", type: "text" }] } }] },
        ],
      })
    );

    expect(response.status).toBe(200);
  });

  it("rejects a request with an invalid signature when WHATSAPP_APP_SECRET is configured", async () => {
    vi.stubEnv("WHATSAPP_APP_SECRET", "test-app-secret");

    const { POST } = await import("./route");
    const response = await POST(buildPostRequest({ entry: [] }, { "x-hub-signature-256": "sha256=deadbeef" }));

    expect(response.status).toBe(401);
  });

  it("accepts a request with a valid signature when WHATSAPP_APP_SECRET is configured", async () => {
    vi.stubEnv("WHATSAPP_APP_SECRET", "test-app-secret");
    const body = { entry: [] };
    const rawBody = JSON.stringify(body);
    const signature = `sha256=${createHmac("sha256", "test-app-secret").update(rawBody).digest("hex")}`;

    const { POST } = await import("./route");
    const response = await POST(buildPostRequest(body, { "x-hub-signature-256": signature }));

    expect(response.status).toBe(200);
  });
});
