import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createFeexpayPayment } from "@/lib/feexpay";

const KNOWN_COUNTRY_CODES = new Set(["BJ", "TG", "CI"]);

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { amount, countryCode, dialCode, operator, phone } = (body ?? {}) as {
    amount?: number;
    countryCode?: string;
    dialCode?: string;
    operator?: string | null;
    phone?: string;
  };

  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Montant invalide." }, { status: 400 });
  }
  if (typeof countryCode !== "string" || !KNOWN_COUNTRY_CODES.has(countryCode)) {
    return NextResponse.json({ error: "Pays invalide." }, { status: 400 });
  }
  if (typeof phone !== "string" || phone.trim() === "") {
    return NextResponse.json({ error: "Numéro de téléphone requis." }, { status: 400 });
  }

  const normalizedPhone = `${dialCode ?? ""}${phone.replace(/[\s.\-()]/g, "")}`;

  const result = await createFeexpayPayment({
    amount,
    phone: normalizedPhone,
    countryCode,
    operator: operator ?? null,
    reference: randomUUID(),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 503 });
  }

  return NextResponse.json({ providerReference: result.providerReference });
}
