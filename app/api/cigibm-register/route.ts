import { NextRequest, NextResponse } from "next/server";
import { brevo } from "@/lib/content";
import { db } from "@/lib/db";
import { buildConfirmationEmail, sendTransactionalEmail } from "@/lib/email";
import { normalizePhone } from "@/lib/phone";

// Cette route enchaîne jusqu'à trois attentes bornées côté DB (Task 8) : la
// résolution de l'édition, l'upsert Participant, puis — depuis Task 9 —
// l'écriture logMessage() à l'intérieur de sendTransactionalEmail(). Chacune
// porte son propre plafond d'environ 8-10s ; dans le pire des cas, la chaîne
// dépasse le timeout par défaut de la plateforme avant même que le repli
// applicatif borné n'ait pu s'exécuter. maxDuration donne à ce repli la
// marge nécessaire pour réellement s'exécuter avant que la plateforme ne
// tue la fonction (cf. Finding 4 de la revue finale — ne pas réintroduire
// after(), déjà écarté au Task 8 pour des raisons de testabilité).
export const maxDuration = 60;

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

// Résout l'ambassadeur (Task 1) référent depuis le cookie cigibm_ref écrit
// par ReferralCapture (Task 5). Le cookie est encodé via
// encodeURIComponent côté écriture : on décode ici avant de l'utiliser
// comme clé de recherche, sinon un slug contenant un caractère
// effectivement échappé par encodeURIComponent ne matcherait jamais (sans
// incidence aujourd'hui, les slugs produits par slugify() — Task 1 — étant
// déjà URL-safe, mais c'est le traitement correct et robuste).
// Retourne null pour tout cas — cookie absent, slug inconnu, ambassadeur
// inactif — de sorte que l'attribution reste strictement optionnelle et ne
// puisse jamais faire échouer l'inscription.
async function resolveAmbassadorFromCookie(request: NextRequest): Promise<string | null> {
  const rawSlug = request.cookies.get("cigibm_ref")?.value;
  if (!rawSlug) return null;

  const slug = decodeURIComponent(rawSlug);

  const ambassador = await db.ambassador.findUnique({ where: { slug } });
  if (!ambassador || !ambassador.active) return null;

  return ambassador.id;
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
  const ambassadorId = await resolveAmbassadorFromCookie(request);

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

  // Deuxième écriture, additive : la CRM a besoin d'un Participant en base,
  // mais un échec ici ne doit jamais faire échouer l'inscription elle-même
  // (Brevo reste la preuve d'inscription tant que ce n'est pas le cas).
  //
  // upsert sur (édition, email) plutôt qu'un simple create : une
  // resoumission du même formulaire — y compris le cas « duplicate_parameter
  // sur l'email seul » ci-dessus, que Brevo traite comme un succès et qui
  // retombe donc ici comme une inscription normale — met à jour la ligne
  // existante au lieu d'en créer une seconde (double comptage au dashboard,
  // double message une fois la messagerie branchée, deux jetons de présence
  // valides pour la même personne). email est garanti non vide à ce stade
  // (validé en tête de fonction), donc pas de cas « email null » à gérer
  // pour cette route précise.
  try {
    // La clé composite (editionId, email) de l'upsert exige un editionId
    // entier littéral — Prisma ne permet pas d'y substituer un connect
    // imbriqué sur edition.number — d'où cette résolution préalable.
    const edition4 = await db.edition.findUnique({ where: { number: 4 } });
    if (edition4) {
      await db.participant.upsert({
        where: { editionId_email: { editionId: edition4.id, email } },
        create: {
          editionId: edition4.id,
          fullName: name,
          phone,
          email,
          consent: true,
          registrationSource: "form",
          ambassadorId,
        },
        update: {
          fullName: name,
          phone,
          consent: true,
        },
      });
    } else {
      console.error("Edition 4 not found, skipping Participant creation", { email, name });
    }
  } catch (err) {
    console.error("Participant creation failed", { email, name }, err);
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
