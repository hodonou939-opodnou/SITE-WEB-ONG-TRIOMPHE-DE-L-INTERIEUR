import { NextRequest, NextResponse } from "next/server";
import { createFeexpayPayment, isOtpNetwork, resolveNetwork } from "@/lib/feexpay";

const KNOWN_COUNTRY_CODES = new Set(["BJ", "TG", "CI"]);
const MIN_AMOUNT = 100;
const MAX_AMOUNT = 2_000_000; // Plafond réel Feexpay (voir docs.feexpay.me > API > Payin).

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { amount, countryCode, dialCode, operator, phone, otp } = (body ?? {}) as {
    amount?: number;
    countryCode?: string;
    dialCode?: string;
    operator?: string | null;
    phone?: string;
    otp?: string;
  };

  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
    return NextResponse.json(
      { error: `Le montant doit être compris entre ${MIN_AMOUNT} et ${MAX_AMOUNT.toLocaleString("fr-FR")} XOF.` },
      { status: 400 }
    );
  }
  if (typeof countryCode !== "string" || !KNOWN_COUNTRY_CODES.has(countryCode)) {
    return NextResponse.json({ error: "Pays invalide." }, { status: 400 });
  }
  if (typeof phone !== "string" || phone.trim() === "") {
    return NextResponse.json({ error: "Numéro de téléphone requis." }, { status: 400 });
  }
  if (typeof operator !== "string") {
    return NextResponse.json({ error: "Opérateur requis." }, { status: 400 });
  }

  const network = resolveNetwork(countryCode, operator);
  if (!network) {
    return NextResponse.json({ error: "Opérateur non pris en charge pour ce pays." }, { status: 400 });
  }

  const normalizedPhone = `${(dialCode ?? "").replace("+", "")}${phone.replace(/[\s.\-()]/g, "")}`;

  const result = await createFeexpayPayment({
    amount,
    phoneNumber: normalizedPhone,
    network,
    description: "Don CIGIBM",
    otp: isOtpNetwork(network) ? (otp ?? "") : undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 503 });
  }

  return NextResponse.json({
    reference: result.reference,
    status: result.status,
    paymentUrl: result.paymentUrl ?? null,
    requiresOtp: isOtpNetwork(network) && !otp,
  });
}
