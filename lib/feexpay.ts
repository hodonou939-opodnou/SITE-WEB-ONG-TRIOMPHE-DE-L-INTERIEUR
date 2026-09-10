// Intégration Feexpay (paiement Mobile Money) — câblée contre la vraie
// documentation (docs.feexpay.me, section API > Payin, consultée et
// extraite directement le 2026-09-11 : le site est une SPA que les outils
// de lecture automatique ne rendent pas, la navigation dans un vrai
// navigateur a été nécessaire pour obtenir le contrat réel plutôt que d'en
// deviner un).
const FEEXPAY_BASE = "https://api-v2.feexpay.me/api/transactions/public";

export type FeexpayNetwork =
  | "mtn_bj"
  | "moov_bj"
  | "celtiis_bj"
  | "coris_bj"
  | "togocom_tg"
  | "moov_tg"
  | "mtn_ci"
  | "moov_ci"
  | "wave_ci"
  | "orange_ci";

// Chemin d'API réel par réseau — PAS un simple gabarit "pays + opérateur en
// minuscule" : Bénin utilise des chemins courts (mtn, moov) tandis que
// Togo/Côte d'Ivoire suffixent le pays (togocom_tg, mtn_ci...). Coris est le
// seul chemin Bénin déjà suffixé (coris, pas coris_bj) — vérifié dans la
// doc, ne pas "corriger" en supposant un schéma uniforme.
const NETWORK_PATHS: Record<FeexpayNetwork, string> = {
  mtn_bj: "mtn",
  moov_bj: "moov",
  celtiis_bj: "celtiis_bj",
  coris_bj: "coris",
  togocom_tg: "togocom_tg",
  moov_tg: "moov_tg",
  mtn_ci: "mtn_ci",
  moov_ci: "moov_ci",
  wave_ci: "wave_ci",
  orange_ci: "orange_ci",
};

// Réseaux dont la réponse contient une payment_url : le donateur doit être
// redirigé vers cette page pour payer, il n'y a pas de "push" vers son
// téléphone. Les autres réseaux renvoient { status: "PENDING", reference }
// et le client confirme directement depuis une notification/USSD sur son
// téléphone.
const REDIRECT_NETWORKS = new Set<FeexpayNetwork>(["moov_ci", "wave_ci", "orange_ci"]);

// Coris Bénin est un flux à deux étapes : le premier appel (otp vide)
// déclenche l'envoi d'un code par SMS, le second (même endpoint, otp
// rempli) valide réellement la transaction.
const OTP_NETWORKS = new Set<FeexpayNetwork>(["coris_bj"]);

// Fait le lien entre ce que choisit le donateur dans le formulaire (pays +
// nom d'opérateur affiché) et le réseau Feexpay réel. Les clés d'opérateur
// correspondent aux libellés utilisés dans components/DonationForm.tsx.
const OPERATOR_TO_NETWORK: Record<string, Record<string, FeexpayNetwork>> = {
  BJ: { MTN: "mtn_bj", Moov: "moov_bj", Celtiis: "celtiis_bj", Coris: "coris_bj" },
  TG: { Togocom: "togocom_tg", Moov: "moov_tg" },
  CI: { MTN: "mtn_ci", Moov: "moov_ci", Wave: "wave_ci", Orange: "orange_ci" },
};

export function resolveNetwork(countryCode: string, operator: string): FeexpayNetwork | null {
  return OPERATOR_TO_NETWORK[countryCode]?.[operator] ?? null;
}

export function operatorsForCountry(countryCode: string): string[] {
  return Object.keys(OPERATOR_TO_NETWORK[countryCode] ?? {});
}

export function isRedirectNetwork(network: FeexpayNetwork): boolean {
  return REDIRECT_NETWORKS.has(network);
}

export function isOtpNetwork(network: FeexpayNetwork): boolean {
  return OTP_NETWORKS.has(network);
}

export type FeexpayPaymentRequest = {
  amount: number;
  phoneNumber: string; // Chiffres uniquement, avec indicatif pays, sans "+" (ex. "2290166000000").
  network: FeexpayNetwork;
  firstName?: string;
  lastName?: string;
  description?: string;
  callbackInfo?: string;
  otp?: string; // Coris uniquement : vide à l'étape 1, rempli à l'étape 2.
};

export type FeexpayPaymentResult =
  | { ok: true; reference: string; status: "PENDING" | "SUCCESSFUL" | "FAILED"; paymentUrl?: string }
  | { ok: false; error: string };

export async function createFeexpayPayment(request: FeexpayPaymentRequest): Promise<FeexpayPaymentResult> {
  const apiKey = process.env.FEEXPAY_API_KEY;
  const shopId = process.env.FEEXPAY_SHOP_ID;

  if (!apiKey || !shopId) {
    return { ok: false, error: "Feexpay n'est pas encore configuré (FEEXPAY_API_KEY / FEEXPAY_SHOP_ID manquants)." };
  }

  const path = NETWORK_PATHS[request.network];
  const body: Record<string, unknown> = {
    shop: shopId,
    amount: request.amount,
    phoneNumber: request.phoneNumber,
  };
  if (request.firstName) body.first_name = request.firstName;
  if (request.lastName) body.last_name = request.lastName;
  if (request.description) body.description = request.description;
  if (request.callbackInfo) body.callback_info = request.callbackInfo;
  if (OTP_NETWORKS.has(request.network)) body.otp = request.otp ?? "";

  let res: Response;
  try {
    res = await fetch(`${FEEXPAY_BASE}/requesttopay/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return { ok: false, error: `Connexion à Feexpay impossible : ${err instanceof Error ? err.message : String(err)}` };
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    return { ok: false, error: json?.message ?? json?.error ?? `Feexpay a répondu avec le statut ${res.status}.` };
  }

  // Réseaux "redirection" (Moov/Wave/Orange Côte d'Ivoire) : reference +
  // payment_url, pas de champ status à ce stade.
  if (isRedirectNetwork(request.network)) {
    if (!json?.payment_url) {
      return { ok: false, error: "Réponse Feexpay inattendue : payment_url manquant pour ce réseau." };
    }
    return { ok: true, reference: json.reference ?? json.order_id, status: "PENDING", paymentUrl: json.payment_url };
  }

  // Moov Bénin peut renvoyer un statut déjà final (ex. FAILED pour solde
  // insuffisant) directement dans cette réponse, sans passer par l'API de
  // statut — voir la doc Feexpay ("Comportement Moov").
  const status = json?.status ?? "PENDING";
  if (status === "FAILED") {
    const reason = json?.response_operator?.description?.[0] ?? json?.message ?? "Paiement refusé.";
    return { ok: false, error: reason };
  }

  return { ok: true, reference: json?.reference ?? json?.transref, status };
}

export type FeexpayStatusResult =
  | { ok: true; status: "PENDING" | "SUCCESSFUL" | "FAILED"; reason?: string }
  | { ok: false; error: string };

export async function checkFeexpayStatus(reference: string): Promise<FeexpayStatusResult> {
  const apiKey = process.env.FEEXPAY_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Feexpay n'est pas encore configuré (FEEXPAY_API_KEY manquant)." };
  }

  let res: Response;
  try {
    res = await fetch(`${FEEXPAY_BASE}/single/status/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    });
  } catch (err) {
    return { ok: false, error: `Connexion à Feexpay impossible : ${err instanceof Error ? err.message : String(err)}` };
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    return { ok: false, error: json?.message ?? `Feexpay a répondu avec le statut ${res.status}.` };
  }

  return { ok: true, status: json?.status ?? "PENDING", reason: json?.reason };
}
