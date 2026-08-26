import { NextRequest, NextResponse } from "next/server";
import { brevo } from "@/lib/content";
import { buildConfirmationEmail, sendTransactionalEmail } from "@/lib/email";
import { normalizePhone } from "@/lib/phone";

async function createBrevoContact(
  apiKey: string,
  payload: { email: string; attributes: Record<string, unknown>; listIds: number[] }
) {
  return fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ ...payload, updateEnabled: true }),
  });
}

export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const formData = await request.formData();

  const name = formData.get("name")?.toString().trim();
  const phoneRaw = formData.get("phone")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const consent = formData.get("consent")?.toString();

  if (!name || !phoneRaw || !email || consent !== "1") {
    return NextResponse.redirect(`${origin}/cigibm-2026?erreur=1#inscription`, 303);
  }

  const phone = normalizePhone(phoneRaw);

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error("BREVO_API_KEY is not configured");
    return NextResponse.redirect(`${origin}/cigibm-2026?erreur=1#inscription`, 303);
  }

  try {
    let res = await createBrevoContact(apiKey, {
      email,
      attributes: { FIRSTNAME: name, SMS: phone, OPT_IN: true },
      listIds: [brevo.cigibm2026ListId],
    });

    if (res.status === 400) {
      const body = await res.clone().json().catch(() => null);
      const duplicateFields: string[] = body?.metadata?.duplicate_identifiers ?? [];

      if (body?.code === "duplicate_parameter" && duplicateFields.includes("SMS") && !duplicateFields.includes("email")) {
        // Ce numéro est déjà rattaché à un autre contact ailleurs sur ce
        // compte Brevo (partagé entre plusieurs entreprises) : on
        // n'empêche pas l'inscription pour autant, on retente sans le SMS.
        console.warn("SMS already used by another contact, retrying without it", phone);
        res = await createBrevoContact(apiKey, {
          email,
          attributes: { FIRSTNAME: name, OPT_IN: true },
          listIds: [brevo.cigibm2026ListId],
        });
      } else if (body?.code !== "duplicate_parameter") {
        console.error("Brevo contact creation failed", res.status, JSON.stringify(body));
        return NextResponse.redirect(`${origin}/cigibm-2026?erreur=1#inscription`, 303);
      }
      // duplicate on email alone => contact already registered, treat as success
    } else if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      console.error("Brevo contact creation failed", res.status, bodyText);
      return NextResponse.redirect(`${origin}/cigibm-2026?erreur=1#inscription`, 303);
    }
  } catch (err) {
    console.error("Brevo request failed", err);
    return NextResponse.redirect(`${origin}/cigibm-2026?erreur=1#inscription`, 303);
  }

  // L'envoi de l'email de confirmation ne doit jamais faire échouer
  // l'inscription elle-même : le contact est déjà enregistré à ce stade.
  try {
    const message = buildConfirmationEmail(name);
    const emailRes = await sendTransactionalEmail(apiKey, { email, name }, message);
    if (!emailRes.ok) {
      console.error("Confirmation email failed", emailRes.status, await emailRes.text().catch(() => ""));
    }
  } catch (err) {
    console.error("Confirmation email request failed", err);
  }

  return NextResponse.redirect(`${origin}/cigibm-2026/merci`, 303);
}
