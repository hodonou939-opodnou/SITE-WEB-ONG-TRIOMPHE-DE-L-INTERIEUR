import { NextRequest, NextResponse } from "next/server";
import { checkFeexpayStatus } from "@/lib/feexpay";

// Interrogé par le formulaire de don (polling côté client) après un
// requesttopay accepté (status: PENDING) : Feexpay accepte la demande
// immédiatement, mais le donateur doit encore confirmer sur son téléphone
// (USSD ou notification) — voir le commentaire dans DonationForm.tsx.
// Sans cette vérification, l'UI affichait "Merci, votre don compte déjà"
// dès l'acceptation, avant même que le paiement soit réellement confirmé
// ou refusé.
export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ error: "Référence manquante." }, { status: 400 });
  }

  const result = await checkFeexpayStatus(reference);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 503 });
  }

  return NextResponse.json({ status: result.status, reason: result.reason ?? null });
}
