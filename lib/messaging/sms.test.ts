import { afterEach, describe, expect, it, vi } from "vitest";
import { sendSms } from "./sms";

// BREVO_API_KEY isn't present in .env.local (unlike DATABASE_URL etc.), so
// without stubbing it sendSms() takes its "not configured" early-return
// path and never reaches the mocked fetch below. Same pattern already used
// in app/api/cigibm-register/route.test.ts for the same reason.
vi.stubEnv("BREVO_API_KEY", "test-key");

describe("sendSms", () => {
  afterEach(() => vi.restoreAllMocks());

  it("calls Brevo's transactional SMS endpoint and returns the message id on success", async () => {
    global.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ reference: "sms-ref-1" }), { status: 201 })
    ) as typeof fetch;

    const result = await sendSms("+2290100000001", "Test message");

    expect(result.ok).toBe(true);
    expect(result.providerMessageId).toBe("sms-ref-1");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.brevo.com/v3/transactionalSMS/sms",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("returns ok: false with the error message when Brevo rejects the send", async () => {
    global.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ message: "Invalid sender" }), { status: 400 })
    ) as typeof fetch;

    const result = await sendSms("+2290100000001", "Test message");

    expect(result.ok).toBe(false);
    expect(result.error).toContain("Invalid sender");
  });
});
