// Intégration Feexpay (paiement Mobile Money) — PAS ENCORE CÂBLÉE.
//
// L'utilisateur doit fournir les accès API réels (URL de base, clé
// secrète/shop id, format exact du payload "request to pay", format de la
// réponse) avant que createFeexpayPayment() ne fasse un vrai appel. En
// attendant, elle renvoie systématiquement { ok: false } avec un message
// clair plutôt que d'inventer un contrat d'API non confirmé — le même
// principe de garde que sendSms() dans lib/messaging/sms.ts pour une clé
// manquante.
//
// Ne PAS déployer /api/donate en production tant que cette fonction n'est
// pas réellement câblée : le formulaire échouerait pour tout vrai donateur.
export type FeexpayPaymentRequest = {
  amount: number;
  phone: string; // Déjà normalisé avec l'indicatif pays (ex. "+2290196966501").
  countryCode: string; // "BJ" | "TG" | "CI"
  operator: string | null; // ex. "MTN", "Moov", "Celtiis"
  reference: string; // Identifiant unique côté ONG pour rapprocher le paiement.
};

export type FeexpayPaymentResult = { ok: true; providerReference: string } | { ok: false; error: string };

export async function createFeexpayPayment(_request: FeexpayPaymentRequest): Promise<FeexpayPaymentResult> {
  const apiKey = process.env.FEEXPAY_API_KEY;
  const shopId = process.env.FEEXPAY_SHOP_ID;

  if (!apiKey || !shopId) {
    return { ok: false, error: "Feexpay n'est pas encore configuré (FEEXPAY_API_KEY / FEEXPAY_SHOP_ID manquants)." };
  }

  // TODO une fois les accès et la doc Feexpay fournis : construire et
  // envoyer la vraie requête "request to pay" ici, puis retourner
  // { ok: true, providerReference } avec l'identifiant renvoyé par Feexpay.
  return { ok: false, error: "L'appel Feexpay n'est pas encore implémenté." };
}
