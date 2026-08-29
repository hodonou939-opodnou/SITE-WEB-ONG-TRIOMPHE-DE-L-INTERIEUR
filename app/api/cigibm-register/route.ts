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

  // Deuxième écriture, additive : la CRM a besoin d'un Participant en base,
  // mais un échec ici ne doit jamais faire échouer l'inscription elle-même
  // (Brevo reste la preuve d'inscription tant que ce n'est pas le cas).
  //
  // create() d'abord, retombe sur update() seulement si la contrainte
  // @@unique([editionId, email]) est violée (code Prisma P2002), plutôt
  // qu'un findUnique() séparé suivi d'un upsert() : ce dernier ouvrait une
  // fenêtre de course entre la lecture et l'écriture — deux resoumissions
  // quasi simultanées pouvaient toutes les deux lire "n'existe pas encore"
  // avant qu'aucune des deux n'ait écrit, et donc déclencher deux fois
  // l'email "quelqu'un vient de s'inscrire grâce à vous" ci-dessous pour une
  // seule inscription réelle. create()+catch(P2002) s'appuie sur l'atomicité
  // de la contrainte unique de Postgres : sur deux create() concurrents pour
  // le même (editionId, email), un seul peut réussir, l'autre reçoit
  // toujours P2002 — aucune fenêtre de course possible.
  //
  // Une resoumission du même formulaire — y compris le cas
  // « duplicate_parameter sur l'email seul » ci-dessus, que Brevo traite
  // comme un succès et qui retombe donc ici comme une inscription normale —
  // met à jour la ligne existante au lieu d'en créer une seconde (double
  // comptage au dashboard, double message, deux jetons de présence valides
  // pour la même personne). email est garanti non vide à ce stade (validé
  // en tête de fonction), donc pas de cas « email null » à gérer ici.
  //
  // shouldNotifyAmbassador distingue une vraie attribution nouvelle d'une
  // simple resoumission déjà attribuée : sans ce contrôle, chaque
  // resoumission redéclencherait la notification ambassadeur pour la même
  // personne. Reste à `false` par défaut — y compris si create()/update()
  // lève une erreur autre que P2002 — pour qu'un échec d'écriture ne
  // puisse jamais déclencher une notification pour une inscription qui
  // n'a en réalité jamais été enregistrée.
  let shouldNotifyAmbassador = false;
  try {
    // editionId entier littéral requis par la contrainte composite —
    // Prisma ne permet pas d'y substituer un connect imbriqué sur
    // edition.number — d'où cette résolution préalable.
    const edition4 = await db.edition.findUnique({ where: { number: 4 } });
    if (edition4) {
      try {
        await db.participant.create({
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
        shouldNotifyAmbassador = ambassador !== null;
      } catch (createErr) {
        if (createErr instanceof Prisma.PrismaClientKnownRequestError && createErr.code === "P2002") {
          // Rétro-attribution : une ligne déjà existante (première
          // inscription faite sans lien de parrainage, ambassadorId resté
          // null) peut légitimement recevoir l'attribution résolue pour
          // CETTE requête si elle n'en avait encore aucune — ce n'est pas
          // le cas que "premier attribué reste attribué" est censé
          // protéger, puisqu'il n'y avait justement personne avant. Un
          // ambassadorId déjà non-null, lui, reste intact (protection
          // inchangée contre l'écrasement par un lien plus récent). Bug
          // réel constaté en production : avant ce correctif, cette
          // branche n'incluait jamais ambassadorId dans data — une
          // personne qui s'inscrivait d'abord sans lien puis resoumettait
          // via un lien d'ambassadeur valide perdait cette attribution
          // pour toujours, silencieusement, sans que rien ne le signale
          // (le compte de l'ambassadeur restait simplement inchangé).
          const existing = await db.participant.findUnique({
            where: { editionId_email: { editionId: edition4.id, email } },
            select: { ambassadorId: true },
          });
          const shouldBackfillAmbassador = existing?.ambassadorId == null && ambassador !== null;

          await db.participant.update({
            where: { editionId_email: { editionId: edition4.id, email } },
            data: {
              fullName: name,
              phone,
              consent: true,
              ...(shouldBackfillAmbassador ? { ambassadorId: ambassador?.id } : {}),
            },
          });

          shouldNotifyAmbassador = shouldBackfillAmbassador;
        } else {
          throw createErr;
        }
      }
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

  return NextResponse.redirect(`${origin}/cigibm-2026/merci`, 303);
}
