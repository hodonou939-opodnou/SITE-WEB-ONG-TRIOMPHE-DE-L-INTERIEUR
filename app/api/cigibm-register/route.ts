import { NextRequest, NextResponse } from "next/server";
import { brevo } from "@/lib/content";

export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const formData = await request.formData();

  const name = formData.get("name")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const consent = formData.get("consent")?.toString();

  if (!name || !phone || !email || consent !== "1") {
    return NextResponse.redirect(`${origin}/cigibm-2026?erreur=1#inscription`, 303);
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error("BREVO_API_KEY is not configured");
    return NextResponse.redirect(`${origin}/cigibm-2026?erreur=1#inscription`, 303);
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email,
        attributes: {
          FIRSTNAME: name,
          SMS: phone,
          OPT_IN: true,
        },
        listIds: [brevo.cigibm2026ListId],
        updateEnabled: true,
      }),
    });

    // 400 duplicate_parameter just means this email is already registered,
    // treat it as a successful (repeat) registration rather than an error.
    const isDuplicate =
      res.status === 400 &&
      (await res.clone().json().catch(() => null))?.code === "duplicate_parameter";

    if (!res.ok && !isDuplicate) {
      const body = await res.text().catch(() => "");
      console.error("Brevo contact creation failed", res.status, body);
      return NextResponse.redirect(`${origin}/cigibm-2026?erreur=1#inscription`, 303);
    }
  } catch (err) {
    console.error("Brevo request failed", err);
    return NextResponse.redirect(`${origin}/cigibm-2026?erreur=1#inscription`, 303);
  }

  return NextResponse.redirect(`${origin}/cigibm-2026/merci`, 303);
}
