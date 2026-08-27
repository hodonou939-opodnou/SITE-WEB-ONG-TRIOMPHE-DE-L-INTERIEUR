export async function sendSms(
  to: string,
  text: string
): Promise<{ ok: boolean; providerMessageId?: string; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "BREVO_API_KEY is not configured" };
  }

  const res = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: "TriompheI",
      recipient: to,
      content: text,
      type: "transactional",
    }),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    return { ok: false, error: body?.message ?? `Brevo SMS failed with status ${res.status}` };
  }

  return { ok: true, providerMessageId: body?.reference };
}
