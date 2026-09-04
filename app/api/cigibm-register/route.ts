import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { brevo, siteConfig } from "@/lib/content";
import { db } from "@/lib/db";
import {
  buildAmbassadorReferralAdminNotification,
  buildAmbassadorReferralEmail,
  buildConfirmationEmail,
  sendTransactionalEmail,
} from "@/lib/email";
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
// par ReferralCapture (Task 5). Le cookie est encodé via encodeURIComponent
// côté écriture, mais request.cookies.get(...).value est déjà la valeur
// décodée : le parseCookie() interne de Next (voir
// node_modules/next/dist/compiled/@edge-runtime/cookies/index.js) appelle
// lui-même decodeURIComponent en analysant l'en-tête `Cookie` brut, avant
// que RequestCookies n'expose la moindre valeur. Un decodeURIComponent
// applicatif supplémentaire ici serait donc redondant — et activement
// dangereux : une valeur brute comme `cigibm_ref=%25zz` redevient "%zz"
// après le décodage (unique) de Next, et un second decodeURIComponent sur
// "%zz" lève URIError: URI malformed (constaté empiriquement — cf.
// route.test.ts, régression ajoutée après un premier correctif erroné qui
// avait réintroduit ce même decode ici).
// Retourne null pour tout cas — cookie absent, slug inconnu, ambassadeur
// inactif, échec de la requête DB elle-même — de sorte que l'attribution
// reste strictement optionnelle et ne puisse jamais faire échouer
// l'inscription. Ce dernier cas compte particulièrement ici : cet appel a
// lieu avant le bloc Brevo (donc avant tout le reste du handler), donc une
// exception non rattrapée ici bloquerait l'inscription entière plutôt que
// de simplement priver l'écriture Participant de son attribution — même
// classe de risque que celle documentée dans lib/db.ts pour le reste de la
// route.
type ReferringAmbassador = { id: string; fullName: string; email: string | null };

async function resolveAmbassadorFromCookie(request: NextRequest): Promise<ReferringAmbassador | null> {
  const slug = request.cookies.get("cigibm_ref")?.value;
  if (!slug) return null;

  try {
    const ambassador = await db.ambassador.findUnique({ where: { slug } });
    if (!ambassador || !ambassador.active) return null;

    return { id: ambassador.id, fullName: ambassador.fullName, email: ambassador.email };
  } catch (err) {
    console.error("Ambassador lookup failed", { slug }, err);
    return null;
  }
}

// Même politique de rétro-attribution que le code appelant (voir plus bas) :
// n'écrase jamais un ambassadorId déjà non-null (protection contre un lien
// plus récent), ne le renseigne que s'il était encore vide. Partagé entre le
// doublon détecté au pré-contrôle et le repli de course P2002 ci-dessous —
// mêmes règles, une seule implémentation.
async function backfillAttributionIfNeeded(
  existing: { id: string; ambassadorId: string | null },
  ambassador: ReferringAmbassador | null
): Promise<boolean> {
  const shouldBackfill = existing.ambassadorId == null && ambassador !== null;
  if (shouldBackfill) {
    await db.participant.update({ where: { id: existing.id }, data: { ambassadorId: ambassador!.id } });
  }
  return shouldBackfill;
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
  const ambassador = await resolveAmbassadorFromCookie(request);

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error("BREVO_API_KEY is not configured");
    return NextResponse.redirect(`${origin}/cigibm-2026?erreur=1#inscription`, 303);
  }

  // Anti-doublon : bloque dès que DEUX des trois identifiants coïncident —
  // email+téléphone, email+nom, ou téléphone+nom. (Les trois à la fois
  // satisfont forcément l'une de ces paires, ce cas est donc couvert aussi.)
  //
  // Deux sur trois, et non un seul : au Bénin plusieurs membres d'un même
  // foyer partagent couramment un téléphone, et parfois une adresse email.
  // Bloquer sur un seul identifiant priverait la deuxième personne du foyer
  // de sa place sans recours — un faux positif bien plus grave que la ligne
  // en double qu'on cherche à éviter. Un couple qui partage un téléphone a
  // deux noms et deux emails différents : une seule coïncidence, il passe.
  //
  // Deux sur trois, et non les trois à la fois : exiger les trois laisserait
  // passer le vrai cas de doublon, celui qui crée réellement une ligne en
  // double — la même personne revenant avec une SECONDE adresse email (même
  // nom, même téléphone). La contrainte @@unique([editionId, email]) rend en
  // effet déjà impossible une seconde ligne partageant l'email ; c'est donc
  // précisément la paire téléphone+nom qui protège la base.
  //
  // Ce pré-contrôle tourne AVANT tout appel Brevo : un doublon détecté ici ne
  // déclenche ni nouvel aller-retour /v3/contacts, ni second email de
  // confirmation pour une place déjà réservée.
  let isDuplicate = false;
  let shouldNotifyAmbassador = false;
  let edition4: { id: number } | null = null;
  let attendanceToken: string | null = null;

  try {
    edition4 = await db.edition.findUnique({ where: { number: 4 } });
    if (edition4) {
      // insensitive : « Jean Kossou », « jean kossou » et « JEAN KOSSOU »
      // sont la même personne. Les accents, eux, restent distinctifs
      // (Postgres ne les replie pas ici) — un écart d'accent fait donc passer
      // l'inscription plutôt que de la bloquer, ce qui est le bon sens
      // d'erreur pour ce contrôle.
      const sameName = { equals: name, mode: "insensitive" as const };
      const existing = await db.participant.findFirst({
        where: {
          editionId: edition4.id,
          OR: [
            { email, phone },
            { email, fullName: sameName },
            { phone, fullName: sameName },
          ],
        },
        select: { id: true, ambassadorId: true },
      });
      if (existing) {
        isDuplicate = true;
        shouldNotifyAmbassador = await backfillAttributionIfNeeded(existing, ambassador);
      }
    } else {
      console.error("Edition 4 not found, skipping duplicate check and Participant creation", { email, name });
    }
  } catch (err) {
    // Échec ouvert : si on ne peut pas savoir si c'est un doublon, on ne
    // bloque jamais l'inscription — au pire une resoumission légitime crée
    // une seconde ligne (rare, déjà le comportement historique), jamais
    // l'inverse (bloquer une inscription qui n'en était pas une).
    console.error("Duplicate participant lookup failed", { email, name }, err);
  }

  if (!isDuplicate) {
    try {
      let res = await createBrevoContact(apiKey, {
        email,
        attributes: { FIRSTNAME: name, SMS: phone, OPT_IN: true },
        listIds: [brevo.cigibm2026ListId],
      });

      if (res.status === 400) {
        const body = await res.clone().json().catch(() => null);
        const duplicateFields: string[] = body?.metadata?.duplicate_identifiers ?? [];
        const isDuplicateSmsOnly =
          body?.code === "duplicate_parameter" && duplicateFields.includes("SMS") && !duplicateFields.includes("email");
        // Brevo valide le format du numéro et le rejette parfois (préfixe
        // opérateur inconnu, format inattendu) sans que ce soit une erreur de
        // saisie réelle côté visiteur — constaté en production avec un vrai
        // 400 "Invalid phone number" qui bloquait toute l'inscription alors
        // que le nom et l'email étaient parfaitement valides. Le téléphone
        // reste enregistré normalement dans notre propre base plus bas ; seul
        // l'attribut SMS envoyé à Brevo est abandonné.
        const isInvalidPhoneNumber =
          body?.code === "invalid_parameter" && typeof body?.message === "string" && body.message.toLowerCase().includes("phone");

        if (isDuplicateSmsOnly || isInvalidPhoneNumber) {
          console.warn(
            isInvalidPhoneNumber
              ? "Phone number rejected by Brevo, retrying without it"
              : "SMS already used by another contact, retrying without it",
            phone,
            body?.message
          );
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

    // Écriture Participant, additive : la CRM a besoin de cette ligne, mais un
    // échec ici ne doit jamais faire échouer l'inscription elle-même (Brevo
    // ci-dessus reste la preuve d'inscription). edition4 est déjà résolu par
    // le pré-contrôle anti-doublon plus haut ; on n'arrive ici que si aucun
    // doublon strict (email + téléphone + nom) n'a été détecté.
    //
    // create() plutôt qu'un upsert() : le pré-contrôle strict ne dit rien de
    // l'existence d'une ligne pour ce seul email (il exige les trois
    // identifiants), et la contrainte @@unique([editionId, email]) reste donc
    // la seule autorité sur ce point. Le catch(P2002) ci-dessous couvre les
    // deux cas où elle se déclenche : coordonnées corrigées (même email,
    // autre téléphone/nom) et course entre deux requêtes simultanées.
    if (edition4) {
      try {
        const created = await db.participant.create({
          data: {
            editionId: edition4.id,
            fullName: name,
            phone,
            email,
            consent: true,
            registrationSource: "form",
            ambassadorId: ambassador?.id,
          },
        });
        attendanceToken = created.attendanceToken;
        shouldNotifyAmbassador = ambassador !== null;
      } catch (createErr) {
        if (createErr instanceof Prisma.PrismaClientKnownRequestError && createErr.code === "P2002") {
          // Une ligne existe déjà pour cet email sans que le pré-contrôle
          // ne l'ait vue : le téléphone ET le nom diffèrent donc tous les
          // deux (une seule coïncidence, l'email — insuffisant pour bloquer),
          // ou, beaucoup plus rarement, une requête concurrente vient de
          // créer la ligne. Comportement historique conservé dans les deux
          // cas : on met la ligne à jour plutôt que d'en créer une seconde,
          // et l'inscription se termine normalement sur /merci. Ce n'est pas
          // le doublon que le blocage vise, et des coordonnées corrigées
          // doivent continuer à être enregistrées (sans quoi l'ONG ne peut
          // plus joindre la personne le jour J).
          //
          // Rétro-attribution : une ligne existante encore sans ambassadeur
          // peut légitimement recevoir celui résolu pour CETTE requête. Un
          // ambassadorId déjà non-null reste intact (protection contre
          // l'écrasement par un lien plus récent). Bug réel constaté en
          // production : avant ce correctif, cette branche n'incluait jamais
          // ambassadorId — une personne inscrite d'abord sans lien, puis
          // resoumettant via un lien d'ambassadeur valide, perdait cette
          // attribution pour toujours, silencieusement.
          const existing = await db.participant.findUnique({
            where: { editionId_email: { editionId: edition4.id, email } },
            select: { ambassadorId: true },
          });
          const shouldBackfillAmbassador = existing?.ambassadorId == null && ambassador !== null;

          const updatedParticipant = await db.participant.update({
            where: { editionId_email: { editionId: edition4.id, email } },
            data: {
              fullName: name,
              phone,
              consent: true,
              ...(shouldBackfillAmbassador ? { ambassadorId: ambassador?.id } : {}),
            },
          });
          attendanceToken = updatedParticipant.attendanceToken;

          shouldNotifyAmbassador = shouldBackfillAmbassador;
        } else {
          console.error("Participant creation failed", { email, name }, createErr);
        }
      }
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
  }

  // Notifie l'ambassadeur référent ET l'administration qu'une nouvelle
  // inscription vient d'être attribuée à ce lien de parrainage. Best-effort
  // comme le reste des blocs ci-dessus : ne doit jamais faire échouer
  // l'inscription elle-même. shouldNotifyAmbassador couvre à la fois une
  // vraie première inscription et une rétro-attribution (cf. plus haut),
  // mais jamais une resoumission déjà attribuée. Les deux envois sont
  // indépendants (try/catch séparés) : l'échec de l'un ne doit jamais
  // empêcher l'autre.
  if (shouldNotifyAmbassador && ambassador) {
    try {
      const totalReferrals = await db.participant.count({ where: { ambassadorId: ambassador.id } });

      // ambassador?.email exclut les ambassadeurs créés sans adresse email
      // (formulaire admin).
      if (ambassador.email) {
        try {
          const message = buildAmbassadorReferralEmail(ambassador.fullName, totalReferrals);
          const emailRes = await sendTransactionalEmail(apiKey, { email: ambassador.email, name: ambassador.fullName }, message);
          if (!emailRes.ok) {
            console.error("Ambassador referral notification failed", emailRes.status, await emailRes.text().catch(() => ""));
          }
        } catch (err) {
          console.error("Ambassador referral notification request failed", err);
        }
      }

      try {
        const adminMessage = buildAmbassadorReferralAdminNotification(ambassador.fullName, name, totalReferrals);
        const adminEmailRes = await sendTransactionalEmail(apiKey, { email: siteConfig.email, name: siteConfig.name }, adminMessage);
        if (!adminEmailRes.ok) {
          console.error("Admin referral notification failed", adminEmailRes.status, await adminEmailRes.text().catch(() => ""));
        }
      } catch (err) {
        console.error("Admin referral notification request failed", err);
      }
    } catch (err) {
      console.error("Referral count lookup failed", err);
    }
  }

  // Un doublon repart vers le formulaire avec ?deja=1 plutôt que vers /merci :
  // annoncer « inscription confirmée » à quelqu'un qui a déjà sa place est au
  // mieux déroutant. La page affiche à la place un message d'invitation au
  // partage (cf. app/(funnel)/cigibm-2026/page.tsx).
  if (isDuplicate) {
    return NextResponse.redirect(`${origin}/cigibm-2026?deja=1#inscription`, 303);
  }

  return NextResponse.redirect(
    attendanceToken ? `${origin}/cigibm-2026/merci?badge=${attendanceToken}` : `${origin}/cigibm-2026/merci`,
    303
  );
}
