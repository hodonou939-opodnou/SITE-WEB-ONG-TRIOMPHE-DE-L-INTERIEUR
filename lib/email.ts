import { cigibm, siteConfig } from "./content";
import { logMessage } from "./messaging/log";

const SITE_URL = "https://ongtriomphedelinterieur.com";
const LOGO_URL = `${SITE_URL}/images/logo-mark.png`;

// Bandeau or (#c9a227) + carte fermée haut/bas en vert profond, contenu
// blanc au centre : traitement "premium" partagé par tous les emails
// transactionnels (pas seulement ceux du programme Ambassadeurs), pour que
// la marque reste cohérente d'un email à l'autre.
function emailShell(content: string) {
  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0; padding:0; background:#eef3ee; font-family:Georgia, 'Times New Roman', serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef3ee; padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:580px; border-radius:20px; overflow:hidden; box-shadow:0 12px 32px rgba(14,33,24,0.12);">
            <tr>
              <td style="height:4px; line-height:4px; font-size:0; background:#c9a227;">&nbsp;</td>
            </tr>
            <tr>
              <td style="background:#0e2118; padding:36px 40px 30px; text-align:center;">
                <img src="${LOGO_URL}" alt="${siteConfig.name}" width="52" height="52" style="display:block; margin:0 auto 14px;" />
                <p style="margin:0 0 5px; color:#fcfdfd; font-family:Georgia, 'Times New Roman', serif; font-size:17px; font-weight:bold;">
                  ${siteConfig.name}
                </p>
                <p style="margin:0; color:#c9a227; font-family:Arial, sans-serif; font-size:10px; letter-spacing:2.5px; text-transform:uppercase;">
                  ${siteConfig.tagline}
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff; padding:44px 40px;">
                ${content}
              </td>
            </tr>
            <tr>
              <td style="background:#0e2118; padding:22px 40px; text-align:center; font-family:Arial, sans-serif;">
                <p style="margin:0 0 6px; font-size:12px; color:#ffffff99;">
                  ${siteConfig.name} &middot; ${siteConfig.location}
                </p>
                <p style="margin:0; font-size:12px;">
                  <a href="tel:${siteConfig.phoneHref.replace("tel:", "")}" style="color:#7fd99a; text-decoration:none;">${siteConfig.phone}</a>
                  &middot;
                  <a href="mailto:${siteConfig.email}" style="color:#7fd99a; text-decoration:none;">${siteConfig.email}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function ctaButton(label: string, href: string, variant: "primary" | "whatsapp" | "tiktok" = "primary") {
  const background = variant === "whatsapp" ? "#25d366" : variant === "tiktok" ? "#000000" : "#3684c4";
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:14px auto 0;">
    <tr>
      <td style="background:${background}; border-radius:999px;">
        <a href="${href}" style="display:inline-block; padding:14px 32px; color:#fcfdfd; font-family:Arial, sans-serif; font-size:15px; font-weight:bold; text-decoration:none; border-radius:999px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

export function buildConfirmationEmail(firstName: string) {
  const first = firstName.split(/\s+/)[0];
  const html = emailShell(`
    <p style="margin:0 0 4px; font-family:Arial, sans-serif; font-size:12px; letter-spacing:1.5px; text-transform:uppercase; color:#307335; font-weight:bold;">
      Inscription confirmée
    </p>
    <h1 style="margin:0 0 20px; font-size:26px; line-height:1.25; color:#183a1a;">
      Félicitations, ${first} ! Votre place au CIGIBM ${cigibm.nextEdition.edition.replace(/[^0-9]/g, "")} est réservée.
    </h1>
    <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#16211dcc; font-family:Arial, sans-serif;">
      Vous venez de faire un premier pas important. Voici l&apos;essentiel à retenir :
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0; background:#f2f7f3; border-radius:14px; font-family:Arial, sans-serif;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 8px; font-size:14px; color:#16211d;"><strong>Thème :</strong> « ${cigibm.nextEdition.theme} »</p>
          <p style="margin:0 0 8px; font-size:14px; color:#16211d;"><strong>Dates :</strong> ${cigibm.nextEdition.dates}</p>
          <p style="margin:0; font-size:14px; color:#16211d;"><strong>Lieu :</strong> ${cigibm.nextEdition.venue}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px; font-size:15px; line-height:1.6; color:#16211dcc; font-family:Arial, sans-serif;">
      Gardez précieusement les deux numéros ci-dessous : ils vous serviront pour toute question avant le congrès.
    </p>
    <p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#183a1a; font-family:Arial, sans-serif; font-weight:bold;">
      ${cigibm.nextEdition.registrationPhones.join(" &middot; ")}
    </p>
    <p style="margin:0; font-size:15px; line-height:1.6; color:#16211dcc; font-family:Arial, sans-serif;">
      Ajoutez déjà la date à votre calendrier, on se retrouve bientôt.
    </p>
    ${ctaButton("Voir les détails du congrès", `${SITE_URL}/cigibm-2026`)}
  `);

  return {
    subject: `${first}, votre place au CIGIBM ${cigibm.nextEdition.edition} est confirmée`,
    html,
  };
}

export function buildReminderEmail(firstName: string) {
  const first = firstName.split(/\s+/)[0];
  const html = emailShell(`
    <p style="margin:0 0 4px; font-family:Arial, sans-serif; font-size:12px; letter-spacing:1.5px; text-transform:uppercase; color:#307335; font-weight:bold;">
      C'est bientôt
    </p>
    <h1 style="margin:0 0 20px; font-size:26px; line-height:1.25; color:#183a1a;">
      ${first}, le CIGIBM ${cigibm.nextEdition.edition} approche.
    </h1>
    <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#16211dcc; font-family:Arial, sans-serif;">
      Rendez-vous les <strong>${cigibm.nextEdition.dates}</strong> au ${cigibm.nextEdition.venue}. Votre place est réservée, il ne reste plus qu&apos;à venir.
    </p>
    <p style="margin:0; font-size:15px; line-height:1.6; color:#16211dcc; font-family:Arial, sans-serif;">
      Besoin d&apos;un rappel du programme, ou d&apos;une info pratique ? Appelez-nous au ${cigibm.nextEdition.registrationPhones[0]}.
    </p>
    ${ctaButton("Revoir le programme", `${SITE_URL}/cigibm-2026`)}
  `);

  return {
    subject: `${first}, on se voit dans quelques jours au CIGIBM`,
    html,
  };
}

// Deux visuels possibles pour le partage : l'affiche officielle et la
// photo de Coach Christelle (seringue en forme de cœur, tirée de la
// campagne "Le vaccin de la dépression"). Un seul par email, tiré au
// hasard, pour varier ce que voient les proches invités d'un ambassadeur
// à l'autre plutôt que de toujours montrer le même visuel.
const AMBASSADOR_SHARE_IMAGES = [
  { path: "/images/cigibm-poster.jpg", alt: "Affiche officielle, CIGIBM 2026" },
  { path: "/images/christelle-avec-le-vaccin.jpg", alt: "Coach Christelle, campagne « Le vaccin de la dépression »" },
];

export function buildAmbassadorSignupEmail(fullName: string, referralUrl: string) {
  const first = fullName.split(/\s+/)[0];
  const shareMessage = `Je vous invite au CIGIBM ${cigibm.nextEdition.edition}, « ${cigibm.nextEdition.theme} », les ${cigibm.nextEdition.dates} au ${cigibm.nextEdition.venue}. Réservez votre place gratuite ici : ${referralUrl}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
  // TikTok, contrairement à WhatsApp, n'expose aucun lien web permettant de
  // pré-remplir une publication (légende, image) depuis un tiers — ce
  // bouton ouvre simplement l'espace de publication, l'image ci-dessous
  // reste à enregistrer et joindre à la main.
  const tiktokUploadUrl = "https://www.tiktok.com/upload";
  const shareImage = AMBASSADOR_SHARE_IMAGES[Math.floor(Math.random() * AMBASSADOR_SHARE_IMAGES.length)];

  const html = emailShell(`
    <p style="margin:0 0 4px; font-family:Arial, sans-serif; font-size:12px; letter-spacing:1.5px; text-transform:uppercase; color:#307335; font-weight:bold;">
      Programme Ambassadeurs
    </p>
    <h1 style="margin:0 0 20px; font-size:26px; line-height:1.25; color:#183a1a;">
      Vous avez pris la bonne décision, ${first}.
    </h1>
    <p style="margin:0 0 24px; font-size:15px; line-height:1.6; color:#16211dcc; font-family:Arial, sans-serif;">
      Sauvez des vies. Invitez vos proches au CIGIBM ${cigibm.nextEdition.edition}, « ${cigibm.nextEdition.theme} », les ${cigibm.nextEdition.dates} au ${cigibm.nextEdition.venue}. Chaque personne qui s&apos;inscrit grâce à vous compte.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px; border-radius:14px; overflow:hidden;">
      <tr>
        <td>
          <img src="${SITE_URL}${shareImage.path}" alt="${shareImage.alt}" width="520" style="display:block; width:100%; max-width:520px; height:auto; border-radius:14px;" />
        </td>
      </tr>
    </table>
    <p style="margin:0 0 20px; font-size:13px; line-height:1.6; color:#16211d99; font-family:Arial, sans-serif; text-align:center;">
      Enregistrez cette image et joignez-la à votre message quand vous partagez votre lien — sur WhatsApp, TikTok, ou ailleurs.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px; background:#f9fbf9; border:1.5px dashed #307335; border-radius:14px; font-family:Arial, sans-serif;">
      <tr>
        <td style="padding:18px 20px;">
          <p style="margin:0 0 6px; font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:#307335; font-weight:bold;">
            Votre lien personnel
          </p>
          <a href="${referralUrl}" style="font-size:14px; color:#183a1a; word-break:break-all; text-decoration:none;">${referralUrl}</a>
        </td>
      </tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:6px 0 8px;">
          ${ctaButton("Partager sur WhatsApp", whatsappShareUrl, "whatsapp")}
        </td>
      </tr>
      <tr>
        <td align="center" style="padding:6px 0 8px;">
          ${ctaButton("Partager sur TikTok", tiktokUploadUrl, "tiktok")}
        </td>
      </tr>
    </table>
    <p style="margin:20px 0 0; font-size:14px; line-height:1.6; color:#16211d99; font-family:Arial, sans-serif;">
      Notre équipe valide chaque nouvel ambassadeur avant que ce lien apparaisse publiquement sur le site, généralement sous quelques minutes. Vous n&apos;avez rien à faire d&apos;autre : dès la validation, ce même lien commence à compter chaque inscription qu&apos;il apporte — et vous recevrez un email à chaque nouvelle inscription.
    </p>
    ${ctaButton("Voir le programme", `${SITE_URL}/cigibm-2026`)}
  `);

  return {
    subject: `${first}, votre lien d'ambassadeur pour le CIGIBM ${cigibm.nextEdition.edition}`,
    html,
  };
}

export function buildAmbassadorReferralEmail(ambassadorFirstNameOrFullName: string, totalReferrals: number) {
  const first = ambassadorFirstNameOrFullName.split(/\s+/)[0];
  const html = emailShell(`
    <p style="margin:0 0 4px; font-family:Arial, sans-serif; font-size:12px; letter-spacing:1.5px; text-transform:uppercase; color:#307335; font-weight:bold;">
      Une nouvelle inscription
    </p>
    <h1 style="margin:0 0 20px; font-size:26px; line-height:1.25; color:#183a1a;">
      Bonne nouvelle, ${first} !
    </h1>
    <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#16211dcc; font-family:Arial, sans-serif;">
      Quelqu&apos;un vient de réserver sa place au CIGIBM ${cigibm.nextEdition.edition} grâce à votre lien. C&apos;est une vie de plus qui prend ce premier pas, et c&apos;est grâce à vous.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px; background:#f2f7f3; border-radius:14px; font-family:Arial, sans-serif;">
      <tr>
        <td style="padding:20px 24px; text-align:center;">
          <p style="margin:0; font-size:32px; line-height:1; color:#183a1a; font-weight:bold; font-family:Georgia, 'Times New Roman', serif;">
            ${totalReferrals}
          </p>
          <p style="margin:6px 0 0; font-size:12px; letter-spacing:1px; text-transform:uppercase; color:#307335;">
            inscription${totalReferrals !== 1 ? "s" : ""} grâce à vous
          </p>
        </td>
      </tr>
    </table>
    <p style="margin:0; font-size:15px; line-height:1.6; color:#16211dcc; font-family:Arial, sans-serif;">
      Continuez à partager votre lien, chaque invitation compte.
    </p>
    ${ctaButton("Voir le programme", `${SITE_URL}/cigibm-2026`)}
  `);

  return {
    subject: `${first}, quelqu'un vient de s'inscrire grâce à vous !`,
    html,
  };
}

// Pendant interne de buildAmbassadorReferralEmail : même événement, mais
// adressé à l'administration plutôt qu'à l'ambassadeur. Contrairement à
// l'email ambassadeur (qui reste volontairement muet sur l'identité de la
// personne inscrite), celui-ci peut nommer le participant sans problème de
// confidentialité — l'administration a de toute façon accès à la fiche
// complète depuis le CRM.
export function buildAmbassadorReferralAdminNotification(
  ambassadorFullName: string,
  participantFullName: string,
  totalReferrals: number
) {
  const html = emailShell(`
    <p style="margin:0 0 4px; font-family:Arial, sans-serif; font-size:12px; letter-spacing:1.5px; text-transform:uppercase; color:#307335; font-weight:bold;">
      Notification interne
    </p>
    <h1 style="margin:0 0 20px; font-size:24px; line-height:1.3; color:#183a1a;">
      Nouvelle inscription via un lien de parrainage
    </h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px; background:#f2f7f3; border-radius:14px; font-family:Arial, sans-serif;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 8px; font-size:14px; color:#16211d;"><strong>Ambassadeur :</strong> ${ambassadorFullName}</p>
          <p style="margin:0 0 8px; font-size:14px; color:#16211d;"><strong>Personne inscrite :</strong> ${participantFullName}</p>
          <p style="margin:0; font-size:14px; color:#16211d;"><strong>Total pour cet ambassadeur :</strong> ${totalReferrals}</p>
        </td>
      </tr>
    </table>
    ${ctaButton("Voir les ambassadeurs", `${SITE_URL}/admin/ambassadors`)}
  `);

  return {
    subject: `Nouvelle inscription via le lien de ${ambassadorFullName}`,
    html,
  };
}

// Déclenché à l'inscription d'un nouvel ambassadeur (compte créé avec
// active: false, cf. app/api/ambassador-signup/route.ts) : l'approbation
// reste entièrement manuelle (aucune tâche planifiée, aucune approbation
// automatique) — sans cet email, l'administration ne découvre une nouvelle
// candidature qu'en consultant /admin/ambassadors de sa propre initiative,
// ce qui rend la promesse « sous quelques minutes » faite à l'ambassadeur
// intenable. Le lien pointe directement sur la fiche d'édition pour que la
// validation prenne un clic.
export function buildAmbassadorPendingApprovalAdminNotification(
  ambassadorId: string,
  ambassadorFullName: string,
  ambassadorEmail: string
) {
  const html = emailShell(`
    <p style="margin:0 0 4px; font-family:Arial, sans-serif; font-size:12px; letter-spacing:1.5px; text-transform:uppercase; color:#307335; font-weight:bold;">
      Action requise
    </p>
    <h1 style="margin:0 0 20px; font-size:24px; line-height:1.3; color:#183a1a;">
      Nouveau candidat ambassadeur à valider
    </h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px; background:#f2f7f3; border-radius:14px; font-family:Arial, sans-serif;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 8px; font-size:14px; color:#16211d;"><strong>Nom :</strong> ${ambassadorFullName}</p>
          <p style="margin:0; font-size:14px; color:#16211d;"><strong>Email :</strong> ${ambassadorEmail}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0; font-size:14px; line-height:1.6; color:#16211d99; font-family:Arial, sans-serif;">
      Son compte reste invisible du site tant qu&apos;il n&apos;est pas activé. Nous lui avons annoncé une validation sous quelques minutes.
    </p>
    ${ctaButton("Valider ce compte", `${SITE_URL}/admin/ambassadors/${ambassadorId}/edit`)}
  `);

  return {
    subject: `À valider : ${ambassadorFullName} veut devenir ambassadeur`,
    html,
  };
}

// Variante pour une campagne groupée Brevo (envoi à toute la liste) : le
// prénom est résolu par Brevo lui-même via ce tag de fusion, contact par
// contact, plutôt que codé en dur comme pour l'email transactionnel unique.
export function buildReminderCampaignHtml() {
  return emailShell(`
    <p style="margin:0 0 4px; font-family:Arial, sans-serif; font-size:12px; letter-spacing:1.5px; text-transform:uppercase; color:#307335; font-weight:bold;">
      C'est bientôt
    </p>
    <h1 style="margin:0 0 20px; font-size:26px; line-height:1.25; color:#183a1a;">
      {{ contact.FIRSTNAME }}, le CIGIBM ${cigibm.nextEdition.edition} approche.
    </h1>
    <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#16211dcc; font-family:Arial, sans-serif;">
      Rendez-vous les <strong>${cigibm.nextEdition.dates}</strong> au ${cigibm.nextEdition.venue}. Votre place est réservée, il ne reste plus qu&apos;à venir.
    </p>
    <p style="margin:0; font-size:15px; line-height:1.6; color:#16211dcc; font-family:Arial, sans-serif;">
      Besoin d&apos;un rappel du programme, ou d&apos;une info pratique ? Appelez-nous au ${cigibm.nextEdition.registrationPhones[0]}.
    </p>
    ${ctaButton("Revoir le programme", `${SITE_URL}/cigibm-2026`)}
  `);
}

// Le domaine ongtriomphedelinterieur.com est authentifié dans Brevo
// (SPF/DKIM/DMARC vérifiés via GET /v3/senders/domains, "authenticated":
// true) — contact@ongtriomphedelinterieur.com peut donc servir
// d'expéditeur sans validation individuelle. Confirmé par un envoi réel
// pendant cette session : événement "delivered" reçu côté Brevo (API
// Events), pas seulement une réponse HTTP 201 — un 201 seul ne prouve
// rien, cf. l'incident ci-dessous.
//
// hodonou939@gmail.com reste le repli : c'est l'expéditeur validé qui a
// permis de diagnostiquer et corriger un vrai incident de production plus
// tôt dans cette session — siteConfig.email pointait alors vers
// ongtriomphedelinterieur@gmail.com, un expéditeur JAMAIS validé dans
// Brevo ("active": false). Brevo avait quand même répondu 201 Created
// avec un messageId normal à chaque envoi ; le rejet n'apparaissait que
// dans l'API Events, jamais dans la réponse HTTP synchrone — le repli
// `!res.ok` ci-dessous ne pouvait donc jamais se déclencher. Des inscrits
// réels n'ont pas reçu leur confirmation à cause de ça. Ne pas faire
// confiance à un 201 seul pour un nouvel expéditeur : toujours vérifier
// via GET /v3/senders (sender individuel) ou GET
// /v3/senders/domains/<domaine> ("authenticated": true), puis confirmer
// par un envoi réel suivi d'un événement "delivered" dans
// GET /v3/smtp/statistics/events avant de le mettre en PRIMARY_SENDER.
const PRIMARY_SENDER = { name: siteConfig.name, email: siteConfig.email };
const FALLBACK_SENDER = { name: siteConfig.name, email: "hodonou939@gmail.com" };

export async function sendTransactionalEmail(
  apiKey: string,
  to: { email: string; name?: string },
  message: { subject: string; html: string },
  meta?: { participantId?: string; batchId?: string; batchLabel?: string; sentByAdminId?: string }
) {
  async function attempt(sender: { name: string; email: string }) {
    return fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender,
        to: [to],
        subject: message.subject,
        htmlContent: message.html,
      }),
    });
  }

  let res = await attempt(PRIMARY_SENDER);
  if (!res.ok) {
    // L'adresse de l'ONG n'est peut-être pas encore vérifiée dans Brevo,
    // on retente avec l'expéditeur déjà vérifié sur ce compte.
    const body = await res.clone().text().catch(() => "");
    console.warn("Primary sender failed, retrying with fallback", res.status, body);
    res = await attempt(FALLBACK_SENDER);
  }

  const responseBody = await res.clone().json().catch(() => null);

  // logMessage() writing to Postgres is a separate failure mode from the
  // Brevo send itself: if it throws, that must not stop us from returning
  // the already-computed `res` (the caller — app/api/cigibm-register's
  // confirmation-email block — decides success/failure from `res.ok`, and
  // shouldn't see a logging outage misreported as an email-send outage).
  try {
    await logMessage({
      channel: "email",
      recipientEmail: to.email,
      subject: message.subject,
      status: res.ok ? "sent" : "failed",
      providerMessageId: responseBody?.messageId,
      errorMessage: res.ok ? undefined : await res.clone().text().catch(() => "unknown error"),
      participantId: meta?.participantId,
      batchId: meta?.batchId,
      batchLabel: meta?.batchLabel,
      sentByAdminId: meta?.sentByAdminId,
    });
  } catch (err) {
    console.error("logMessage failed for transactional email", err);
  }

  return res;
}
