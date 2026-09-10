import { NextRequest, NextResponse } from "next/server";
import { checkFeexpayStatus } from "@/lib/feexpay";

// Reçoit les notifications de paiement Feexpay (à configurer dans le menu
// Webhook du tableau de bord Feexpay, avec l'URL de cette route). La doc
// Feexpay ne documente aucun secret/signature pour vérifier qu'une requête
// vient bien d'eux (voir docs.feexpay.me > Webhook) — un payload reçu ici
// n'est donc PAS pris pour argent comptant : on rappelle immédiatement
// l'API de statut Feexpay avec notre propre clé pour confirmer le
// paiement avant d'agir dessus, plutôt que de faire confiance à un corps
// de requête qui pourrait être forgé par n'importe qui connaissant cette
// URL.
export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const reference = payload?.reference as string | undefined;

  if (!reference) {
    // 200 quand même : Feexpay retente probablement les envois qui ne
    // reçoivent pas un 2xx, et un payload qu'on ne peut pas traiter n'est
    // pas une raison de déclencher des retentatives sans fin.
    return NextResponse.json({ received: true });
  }

  const verified = await checkFeexpayStatus(reference);

  if (!verified.ok) {
    console.error("Feexpay webhook: impossible de vérifier la référence", reference, verified.error);
    return NextResponse.json({ received: true });
  }

  // TODO : une fois qu'un modèle Donation existe (voir la note laissée à
  // l'utilisateur), enregistrer ici verified.status pour cette référence.
  // Pour l'instant, seule la vérification a lieu — pas de persistance.
  console.log("Feexpay webhook vérifié:", { reference, status: verified.status });

  return NextResponse.json({ received: true });
}
