import { brevo, cigibm, siteConfig } from "./content";
import { logMessage } from "./messaging/log";

const SITE_URL = "https://ongtriomphedelinterieur.com";
// logo-mark.png (le blason seul, fond réellement transparent — vérifié
// pixel par pixel) est le seul des deux logos utilisable sur un fond
// coloré : logo.png (le blason + nom complet) a un fond blanc opaque gravé
// dans le PNG lui-même, qui laisserait un rectangle blanc disgracieux sur
// le bandeau vert du hero. Le nom de l'ONG est donc recomposé ici en HTML
// à côté de l'icône plutôt qu'inclus dans l'image, comme le fait déjà le
// reste du site avec ce même logo-mark.
const LOGO_MARK_URL = `${SITE_URL}/images/logo-mark.png`;

// Hero en bandeau vert profond (la couleur de marque du site, cf. les
// sections leaf-950 de la homepage) pour un premier contact plus
// "premium" — remplace le hero blanc trop plat — pendant que le corps et
// le pied de page restent blancs/clairs comme demandé : la carte de
// contenu et le footer ne changent pas, seul le bandeau d'en-tête devient
// coloré. Ce même gabarit alimente tous les emails transactionnels, pour
// que la marque reste cohérente d'un email à l'autre.
// L'enveloppe (bandeau + padding généreux) est pensée pour un écran large ;
// sans media query, le même padding fixe sur mobile empile deux marges
// (celle de l'enveloppe autour de la carte + celle de la carte autour du
// texte) et écrase la colonne de lecture. La classe + le <style> ci-dessous
// réduisent ce padding sous 600px ; le style inline reste le repli pour les
// clients qui ignorent <style> (ils gardent alors le padding "desktop",
// jamais pire qu'avant).
function emailShell(content: string) {
  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      @media only screen and (max-width: 600px) {
        .email-outer-pad { padding: 20px 10px !important; }
        .email-header-pad { padding: 28px 22px 22px !important; }
        .email-content-pad { padding: 26px 20px 32px !important; }
        .email-footer-pad { padding: 18px 20px !important; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background:#f4f6f2; font-family:Georgia, 'Times New Roman', serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f2; padding:40px 16px;" class="email-outer-pad">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:580px; border-radius:20px; overflow:hidden; background:#ffffff; box-shadow:0 16px 40px rgba(14,33,24,0.08);">
            <tr>
              <td style="background:#0e2118; padding:40px 40px 32px; text-align:center;" class="email-header-pad">
                <img src="${LOGO_MARK_URL}" alt="${siteConfig.name}" width="56" height="56" style="display:block; margin:0 auto 14px;" />
                <p style="margin:0 0 6px; color:#fcfdfd; font-family:Georgia, 'Times New Roman', serif; font-size:18px; font-weight:bold;">
                  ${siteConfig.name}
                </p>
                <p style="margin:0; font-family:Georgia, 'Times New Roman', serif; font-style:italic; font-size:13px; color:#c9a227;">
                  ${siteConfig.tagline}
                </p>
              </td>
            </tr>
            <tr>
              <td style="height:2px; line-height:2px; font-size:0; background:#c9a227;">&nbsp;</td>
            </tr>
            <tr>
              <td style="background:#ffffff; padding:36px 40px 44px;" class="email-content-pad">
                ${content}
              </td>
            </tr>
            <tr>
              <td style="background:#f2f7f3; padding:22px 40px; text-align:center; font-family:Arial, sans-serif; border-top:1px solid #e3ece4;" class="email-footer-pad">
                <p style="margin:0 0 6px; font-size:12px; color:#16211d99;">
                  ${siteConfig.name} &middot; ${siteConfig.location}
                </p>
                <p style="margin:0; font-size:12px;">
                  <a href="tel:${siteConfig.phoneHref.replace("tel:", "")}" style="color:#307335; text-decoration:none; font-weight:bold;">${siteConfig.phone}</a>
                  &middot;
                  <a href="mailto:${siteConfig.email}" style="color:#307335; text-decoration:none; font-weight:bold;">${siteConfig.email}</a>
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

// "gold" en couleur pleine plutôt qu'un dégradé : Outlook desktop et
// plusieurs clients email ignorent les dégradés CSS dans un style en ligne,
// ce qui laisserait le bouton sans fond du tout sur ces clients — le même
// risque que ce fichier évite déjà partout ailleurs (aucun autre bouton
// n'utilise de dégradé). Texte sombre plutôt que blanc, pour le contraste
// sur fond doré — même logique que .seal (gabarit du badge, fond gold/texte
// sombre) plutôt que le blanc utilisé sur les autres variantes ici.
function ctaButton(label: string, href: string, variant: "primary" | "whatsapp" | "tiktok" | "gold" = "primary") {
  const background =
    variant === "whatsapp" ? "#25d366" : variant === "tiktok" ? "#000000" : variant === "gold" ? "#e8c84a" : "#3684c4";
  const color = variant === "gold" ? "#1a2f16" : "#fcfdfd";
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:14px auto 0;">
    <tr>
      <td style="background:${background}; border-radius:999px;">
        <a href="${href}" style="display:inline-block; padding:14px 32px; color:${color}; font-family:Arial, sans-serif; font-size:15px; font-weight:bold; text-decoration:none; border-radius:999px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

// Partagé par l'email de bienvenue ambassadeur et les deux nudges
// automatiques (zéro parrainage, palier atteint) : les trois montrent le
// même lien personnel dans le même encart, pas de raison de dupliquer le
// balisage trois fois.
function referralLinkBox(referralUrl: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px; background:#f9fbf9; border:1.5px dashed #307335; border-radius:14px; font-family:Arial, sans-serif;">
    <tr>
      <td style="padding:18px 20px;">
        <p style="margin:0 0 6px; font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:#307335; font-weight:bold;">
          Votre lien personnel
        </p>
        <a href="${referralUrl}" style="font-size:14px; color:#183a1a; word-break:break-all; text-decoration:none;">${referralUrl}</a>
      </td>
    </tr>
  </table>`;
}

function shareButtons(shareMessage: string) {
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
  // TikTok, contrairement à WhatsApp, n'expose aucun lien web permettant de
  // pré-remplir une publication (légende, image) depuis un tiers — ce
  // bouton ouvre simplement l'espace de publication, l'image reste à
  // enregistrer et joindre à la main.
  const tiktokUploadUrl = "https://www.tiktok.com/upload";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
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
  </table>`;
}

export function buildConfirmationEmail(firstName: string, badgeToken?: string | null) {
  const first = firstName.split(/\s+/)[0];
  const badgeUrl = badgeToken ? `${SITE_URL}/cigibm-2026/badge/${badgeToken}` : null;
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
    ${badgeUrl ? ctaButton("Créer mon badge « J'y serai »", badgeUrl) : ""}
    ${ctaButton("Voir les détails du congrès", `${SITE_URL}/cigibm-2026`)}
  `);

  return {
    subject: `${first}, votre place au CIGIBM ${cigibm.nextEdition.edition} est confirmée`,
    html,
  };
}

// Modèle dédié au renvoi manuel du lien de badge depuis /admin/participants
// (sendBadgeLinkAction) — distinct de buildConfirmationEmail : "Inscription
// confirmée" n'a pas de sens ici, la personne est déjà inscrite, parfois
// depuis des semaines. Celui-ci se concentre uniquement sur le badge.
//
// Sujet daté à la minute près plutôt que statique : Gmail (et la plupart
// des clients) regroupe des emails de sujet identique dans une seule
// conversation. Un·e admin qui clique "Envoyer" plusieurs fois de suite
// pour la même personne (nouvel essai après un échec, test) verrait sinon
// un seul message dans la boîte du destinataire au lieu d'autant d'envois
// réellement distincts — même problème déjà documenté pour
// buildAmbassadorReferralEmail, qui le résout avec un compteur ; ici, sans
// compteur naturel, l'heure d'envoi joue ce rôle et reste une information
// pertinente pour le destinataire.
export function buildBadgeReminderEmail(firstName: string, badgeToken: string) {
  const first = firstName.split(/\s+/)[0];
  const badgeUrl = `${SITE_URL}/cigibm-2026/badge/${badgeToken}`;
  const sentAt = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Porto-Novo",
  }).format(new Date());

  const html = emailShell(`
    <p style="margin:0 0 4px; font-family:Arial, sans-serif; font-size:12px; letter-spacing:1.5px; text-transform:uppercase; color:#307335; font-weight:bold;">
      Votre badge « J'y serai »
    </p>
    <h1 style="margin:0 0 20px; font-size:26px; line-height:1.25; color:#183a1a;">
      ${first}, montrez que vous y serez.
    </h1>
    <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#16211dcc; font-family:Arial, sans-serif;">
      Votre place au CIGIBM ${cigibm.nextEdition.edition} est réservée. Créez votre badge personnel — votre photo, votre nom, et un code d&apos;entrée pour le jour J — et partagez-le avec vos proches.
    </p>
    <p style="margin:0; font-size:15px; line-height:1.6; color:#16211dcc; font-family:Arial, sans-serif;">
      Rendez-vous les <strong>${cigibm.nextEdition.dates}</strong> au ${cigibm.nextEdition.venue}.
    </p>
    ${ctaButton("Créer mon badge « J'y serai »", badgeUrl, "gold")}
  `);

  return {
    subject: `${first}, votre badge « J'y serai » vous attend (${sentAt})`,
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

// Date/heure réelles de l'édition à venir, pour calculer le compte à
// rebours et construire le lien "Ajouter à mon calendrier" — distinct de
// cigibm.nextEdition.dates (texte affiché aux humains, ex. "17 octobre
// 2026, dès 9h00"), qui n'est pas une valeur exploitable en JS. Fin fixée
// à 17h : la campagne (voir lib/ambassadors/nudges.ts) traite cette édition
// comme une journée unique de 9h à 17h, soit 8 heures.
const NEXT_EDITION_START = new Date("2026-10-17T09:00:00+01:00");
const NEXT_EDITION_END = new Date("2026-10-17T17:00:00+01:00");

function googleCalendarUrl() {
  const toGCalDate = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `CIGIBM ${cigibm.nextEdition.edition} — ${cigibm.nextEdition.theme}`,
    dates: `${toGCalDate(NEXT_EDITION_START)}/${toGCalDate(NEXT_EDITION_END)}`,
    details: `Rendez-vous au ${cigibm.nextEdition.venue}. ${cigibm.nextEdition.note}`,
    location: cigibm.nextEdition.venue,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Email de teasing (pas un rappel logistique comme buildReminderEmail
// ci-dessus) : la personne est déjà inscrite, l'objectif n'est pas de la
// convaincre mais de faire en sorte que la date reste gravée jusqu'au jour
// J, dans un mois potentiellement chargé. Nomme la douleur du "hero"
// (porter quelque chose seul(e), sans le montrer) avant de révéler ce que
// le thème « Le vaccin de la dépression » propose, plutôt que de vendre le
// programme directement — d'où le lien calendrier en action principale,
// plus concret qu'un simple rappel de date dans le corps du texte.
export function buildParticipantTeaserEmail(fullName: string, badgeToken?: string | null) {
  const first = fullName.split(/\s+/)[0];
  const daysLeft = Math.max(1, Math.ceil((NEXT_EDITION_START.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const badgeUrl = badgeToken ? `${SITE_URL}/cigibm-2026/badge/${badgeToken}` : null;

  const html = emailShell(`
    <p style="margin:0 0 4px; font-family:Arial, sans-serif; font-size:12px; letter-spacing:1.5px; text-transform:uppercase; color:#307335; font-weight:bold;">
      Ça approche
    </p>
    <h1 style="margin:0 0 20px; font-size:26px; line-height:1.25; color:#183a1a;">
      ${first}, il y a une date que vous ne devez pas laisser filer.
    </h1>
    <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#16211dcc; font-family:Arial, sans-serif;">
      Il y a des jours où sourire demande plus d&apos;énergie que tout le reste. Vous le savez. Beaucoup de gens autour de vous le savent aussi, mais personne n&apos;en parle vraiment.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      <tr>
        <td>
          <img src="${SITE_URL}/images/participant-teaser/silhouette-window.jpg" alt="Une silhouette face à une fenêtre, dans la lumière" width="520" height="300" style="display:block; width:100%; max-width:520px; height:300px; object-fit:cover; border-radius:14px; background:#e3ece4;" />
        </td>
      </tr>
    </table>
    <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#16211dcc; font-family:Arial, sans-serif;">
      Le ${cigibm.nextEdition.dates.split(",")[0]}, au ${cigibm.nextEdition.venue}, on va en parler. Vraiment. « ${cigibm.nextEdition.theme} » n&apos;est pas qu&apos;un titre, c&apos;est ce qui se passe quand on arrête de porter ça seul(e).
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px; background:#f2f7f3; border-radius:14px; font-family:Arial, sans-serif;">
      <tr>
        <td style="padding:20px 24px; text-align:center;">
          <p style="margin:0 0 4px; font-size:36px; line-height:1; color:#183a1a; font-weight:bold;">${daysLeft}</p>
          <p style="margin:0; font-size:13px; letter-spacing:1px; text-transform:uppercase; color:#307335; font-weight:bold;">${daysLeft > 1 ? "jours avant le CIGIBM" : "jour avant le CIGIBM"}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#16211dcc; font-family:Arial, sans-serif;">
      Votre place est déjà réservée, ${first}. Il ne reste qu&apos;une chose à faire : ne pas laisser cette date se perdre dans un mois chargé. Ajoutez-la à votre calendrier maintenant, pendant que vous y pensez.
    </p>
    ${ctaButton("Ajouter à mon calendrier", googleCalendarUrl(), "gold")}
    ${badgeUrl ? ctaButton("Voir mon badge « J'y serai »", badgeUrl) : ctaButton("Voir le programme", `${SITE_URL}/cigibm-2026`)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0; border-top:1px solid #e3ece4; padding-top:22px;">
      <tr>
        <td>
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td width="52" style="vertical-align:top;">
                <img src="${SITE_URL}/images/cigibm-edition-4/coach-christelle-avec-le-vaccin.jpg" alt="Christelle Gnimassou" width="52" height="52" style="display:block; width:52px; height:52px; border-radius:999px; object-fit:cover;" />
              </td>
              <td style="padding-left:12px; vertical-align:middle;">
                <p style="margin:0; font-family:Arial, sans-serif; font-size:13px; font-weight:bold; color:#183a1a;">Christelle Gnimassou</p>
                <p style="margin:0; font-family:Arial, sans-serif; font-size:11px; color:#16211d99;">Promotrice CIGIBM</p>
              </td>
            </tr>
          </table>
          <p style="margin:14px 0 0; font-size:15px; line-height:1.6; color:#16211dcc; font-family:Georgia, 'Times New Roman', serif; font-style:italic;">
            « On vous attend le ${cigibm.nextEdition.dates.split(",")[0]}. Pas pour un discours de plus, pour un moment où vous pourrez enfin poser ce que vous portez seul(e). »
          </p>
        </td>
      </tr>
    </table>
  `);

  return {
    subject: `${first}, le ${cigibm.nextEdition.dates.split(",")[0]} approche. Ne la ratez pas.`,
    html,
  };
}

// Email ponctuel "coup de fouet" du matin (pas un rappel automatique comme
// buildAmbassadorZeroNudgeEmail/buildAmbassadorMilestoneEmail) : envoyé une
// fois, généralement tôt, pour relancer l'énergie plutôt que d'expliquer la
// mécanique du parrainage (déjà couverte par buildAmbassadorTipsEmail).
// Volontairement court avec une seule action pour aujourd'hui, pas cinq
// conseils à la fois — le but est qu'il se lise en 30 secondes avant que la
// journée ne commence.
export function buildAmbassadorBoosterEmail(fullName: string, referralUrl: string) {
  const first = fullName.split(/\s+/)[0];
  const shareMessage = `Je pense à toi pour le CIGIBM ${cigibm.nextEdition.edition}, « ${cigibm.nextEdition.theme} », les ${cigibm.nextEdition.dates}. Réserve ta place gratuite ici : ${referralUrl}`;
  const daysLeft = Math.max(1, Math.ceil((NEXT_EDITION_START.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const html = emailShell(`
    <p style="margin:0 0 4px; font-family:Arial, sans-serif; font-size:12px; letter-spacing:1.5px; text-transform:uppercase; color:#307335; font-weight:bold;">
      Message du matin
    </p>
    <h1 style="margin:0 0 20px; font-size:26px; line-height:1.25; color:#183a1a;">
      ${first}, un objectif simple pour aujourd&apos;hui.
    </h1>
    <p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#16211dcc; font-family:Arial, sans-serif;">
      Vous avez déjà commencé quelque chose d&apos;important. Chaque personne qui s&apos;inscrit grâce à vous, c&apos;est une personne de plus qui choisit de ne plus porter ça seule.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px; background:#f2f7f3; border-radius:14px; font-family:Arial, sans-serif;">
      <tr>
        <td style="padding:20px 24px; text-align:center;">
          <p style="margin:0 0 4px; font-size:36px; line-height:1; color:#183a1a; font-weight:bold;">${daysLeft}</p>
          <p style="margin:0; font-size:13px; letter-spacing:1px; text-transform:uppercase; color:#307335; font-weight:bold;">${daysLeft > 1 ? "jours avant le CIGIBM" : "jour avant le CIGIBM"}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px; font-size:15px; line-height:1.6; color:#16211dcc; font-family:Arial, sans-serif;">
      Pas besoin d&apos;un grand plan aujourd&apos;hui. Juste ça :
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px; background:#f9fbf9; border:1.5px dashed #307335; border-radius:14px; font-family:Arial, sans-serif;">
      <tr>
        <td style="padding:18px 22px;">
          <p style="margin:0 0 10px; font-size:14px; color:#16211d;"><strong>1. Envoyez votre lien à une seule personne</strong>, tout de suite, avant de faire autre chose. Pas de long message, juste « je pense à toi pour ça » suffit.</p>
          <p style="margin:0; font-size:14px; color:#16211d;"><strong>2. Rouvrez votre dernière conversation</strong> où vous aviez partagé votre lien sans réponse. Un petit rappel aujourd&apos;hui suffit souvent à la faire basculer.</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#16211dcc; font-family:Arial, sans-serif;">
      Voici votre lien, prêt à repartir.
    </p>
    ${referralLinkBox(referralUrl)}
    ${shareButtons(shareMessage)}
  `);

  return {
    subject: `${first}, un objectif simple pour aujourd'hui (${daysLeft > 1 ? `${daysLeft} jours avant le CIGIBM` : "dernier jour avant le CIGIBM"})`,
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
    ${referralLinkBox(referralUrl)}
    ${shareButtons(shareMessage)}
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

// Annonce ponctuelle (pas de déclencheur automatique — envoi manuel, ex.
// campagne Brevo ou script one-off) informant les ambassadeurs déjà actifs
// que le générateur de badge « J'y serai » existe désormais : chaque
// personne qui s'inscrit au CIGIBM — via un lien de parrainage ou non —
// reçoit automatiquement un email l'invitant à créer le sien
// (buildBadgeReminderEmail, envoyé par app/api/cigibm-register/route.ts).
// Volontairement silencieux sur le lien de parrainage lui-même : cet email
// annonce une fonctionnalité, il ne relance pas le partage (déjà couvert
// par buildAmbassadorZeroNudgeEmail/buildAmbassadorMilestoneEmail).
export function buildAmbassadorBadgeAnnouncementEmail(fullName: string) {
  const first = fullName.split(/\s+/)[0];
  const html = emailShell(`
    <p style="margin:0 0 4px; font-family:Arial, sans-serif; font-size:12px; letter-spacing:1.5px; text-transform:uppercase; color:#307335; font-weight:bold;">
      Nouveauté
    </p>
    <h1 style="margin:0 0 20px; font-size:26px; line-height:1.25; color:#183a1a;">
      ${first}, vos invités ont maintenant leur badge « J&apos;y serai ».
    </h1>
    <p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#16211dcc; font-family:Arial, sans-serif;">
      Chaque personne qui réserve sa place au CIGIBM ${cigibm.nextEdition.edition}, par votre lien ou non, reçoit maintenant un email juste après son inscription pour créer son badge personnel « J&apos;y serai ».
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px; background:#f2f7f3; border-radius:14px; font-family:Arial, sans-serif;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 10px; font-size:14px; color:#16211d;"><strong>Sa photo</strong>, dans un visuel aux couleurs du congrès</p>
          <p style="margin:0 0 10px; font-size:14px; color:#16211d;"><strong>Son nom</strong>, la date et le lieu du CIGIBM ${cigibm.nextEdition.edition}</p>
          <p style="margin:0; font-size:14px; color:#16211d;"><strong>Un code d&apos;entrée</strong>, le même QR qui ouvrira les portes le jour J</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#16211dcc; font-family:Arial, sans-serif;">
      Le badge se télécharge en un instant et se partage directement sur WhatsApp, TikTok ou Facebook. Plus vos invités le partagent, plus votre invitation se voit.
    </p>
    <p style="margin:0; font-size:14px; line-height:1.6; color:#16211d99; font-family:Arial, sans-serif;">
      Vous n&apos;avez rien à faire, cet email part automatiquement pour tout le monde dès l&apos;inscription confirmée.
    </p>
    ${ctaButton("Voir le programme du CIGIBM", `${SITE_URL}/cigibm-2026`, "gold")}
  `);

  return {
    subject: `${first}, vos invités peuvent désormais créer leur badge « J'y serai »`,
    html,
  };
}

// Une carte image + texte par astuce (gabarit "produit" à la Klaviyo :
// photo pleine largeur en tête de carte, badge numéroté, titre, corps),
// plutôt qu'un bloc de texte compact. Christelle n'apparaît que deux fois
// dans tout l'email (l'avatar d'introduction et la carte du badge « J'y
// serai ») : les trois autres cartes utilisent des photos libres de droits
// (Pexels, stockées localement dans /images/ambassador-tips) pour varier
// les visuels sans épuiser les rares photos de Christelle disponibles.
// Un seul niveau d'encadrement (l'image, coins arrondis, rien d'autre) :
// une bordure/fond supplémentaire autour du texte empilait une deuxième
// marge sur celle de l'enveloppe (emailShell) et écrasait la colonne de
// lecture sur mobile. Le badge numéroté + le titre juste sous l'image
// suffisent à séparer visuellement chaque astuce.
function tipCard(number: number, title: string, body: string, imagePath: string, imageAlt: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px;">
    <tr>
      <td>
        <img src="${encodeURI(`${SITE_URL}${imagePath}`)}" alt="${imageAlt}" width="520" height="220" style="display:block; width:100%; max-width:520px; height:220px; object-fit:cover; background:#e3ece4; border-radius:14px;" />
      </td>
    </tr>
    <tr>
      <td style="padding:14px 0 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
          <tr>
            <td width="24" height="24" style="width:24px; height:24px; background:#307335; border-radius:999px; text-align:center;">
              <span style="display:block; font-family:Arial, sans-serif; font-size:12px; font-weight:bold; color:#ffffff; line-height:24px;">${number}</span>
            </td>
            <td style="padding-left:10px; font-family:Arial, sans-serif; font-size:15px; font-weight:bold; color:#183a1a;">
              ${title}
            </td>
          </tr>
        </table>
        <p style="margin:0; font-size:14px; line-height:1.6; color:#16211dcc; font-family:Arial, sans-serif;">
          ${body}
        </p>
      </td>
    </tr>
  </table>`;
}

// Annonce ponctuelle (pas de déclencheur automatique — envoi manuel, même
// mécanisme que buildAmbassadorBadgeAnnouncementEmail) : des astuces
// concrètes pour convertir un partage en vraie inscription. Distinct de
// buildAmbassadorZeroNudgeEmail (qui relance le partage lui-même) — celui-ci
// suppose que le lien est déjà partagé, et s'attaque au frein suivant :
// un lien seul, sans un mot, se perd dans la conversation.
export function buildAmbassadorTipsEmail(fullName: string, referralUrl: string) {
  const first = fullName.split(/\s+/)[0];
  const shareMessage = `Je vous invite au CIGIBM ${cigibm.nextEdition.edition}, « ${cigibm.nextEdition.theme} », les ${cigibm.nextEdition.dates} au ${cigibm.nextEdition.venue}. Réservez votre place gratuite ici : ${referralUrl}`;

  const html = emailShell(`
    <p style="margin:0 0 4px; font-family:Arial, sans-serif; font-size:12px; letter-spacing:1.5px; text-transform:uppercase; color:#307335; font-weight:bold;">
      Programme Ambassadeurs
    </p>
    <h1 style="margin:0 0 20px; font-size:26px; line-height:1.25; color:#183a1a;">
      ${first}, voici ce qui fait vraiment la différence.
    </h1>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px; background:#f2f7f3; border-radius:16px;">
      <tr>
        <td style="padding:20px 22px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td width="52" style="vertical-align:top;">
                <img src="${SITE_URL}/images/speaker-christelle-gnimassou.jpg" alt="Christelle Gnimassou" width="52" height="52" style="display:block; width:52px; height:52px; border-radius:999px; object-fit:cover;" />
              </td>
              <td style="padding-left:12px; vertical-align:middle;">
                <p style="margin:0; font-family:Arial, sans-serif; font-size:13px; font-weight:bold; color:#183a1a;">Christelle Gnimassou</p>
                <p style="margin:0; font-family:Arial, sans-serif; font-size:11px; color:#16211d99;">Promotrice CIGIBM</p>
              </td>
            </tr>
          </table>
          <p style="margin:14px 0 0; font-size:15px; line-height:1.6; color:#16211dcc; font-family:Georgia, 'Times New Roman', serif; font-style:italic;">
            « Un lien envoyé seul, sans un mot, se perd dans la conversation. Je le vois à chaque édition : ce sont ces cinq réflexes simples qui transforment un partage en vraie inscription. »
          </p>
        </td>
      </tr>
    </table>

    ${tipCard(
      1,
      "Ajoutez un mot avant le lien.",
      "Dites pourquoi vous y allez, pas juste où cliquer. Un lien seul ressemble à une publicité, alors qu&apos;une phrase sincère montre que c&apos;est vous qui parlez. Quelque chose d&apos;aussi simple que « je pense que ça peut vraiment t&apos;aider, regarde » change tout : la personne lit le message avant de lire le lien, et c&apos;est ce message qui la décide à cliquer.",
      "/images/ambassador-tips/tip-1-texting.jpg",
      "Un message personnel envoyé depuis un téléphone"
    )}
    ${tipCard(
      2,
      "Visez les groupes où tout le monde se connaît déjà.",
      "Famille, église, collègues, plutôt que des inconnus. La confiance qui existe déjà entre vous fait une grande partie du travail : ces personnes n&apos;ont pas besoin d&apos;être convaincues que vous êtes sérieux(se), elles le savent déjà. Un message envoyé dans un groupe où chacun se connaît obtient toujours plus de réponses qu&apos;un même message envoyé à des contacts au hasard.",
      "/images/ambassador-tips/tip-2-friends-group.jpg",
      "Un groupe d&apos;amis qui se connaissent bien"
    )}
    ${tipCard(
      3,
      "Racontez votre histoire, pas un argumentaire.",
      "« Voilà pourquoi ça compte pour moi » marche mieux que des statistiques. Les gens suivent une personne, pas une liste de chiffres : parlez de ce qui vous a marqué(e), d&apos;une personne que vous connaissez concernée par la santé mentale, ou simplement de la raison pour laquelle vous avez décidé d&apos;y aller. Votre vécu convainc plus vite que n&apos;importe quel argument tout fait.",
      "/images/ambassador-tips/tip-3-storytelling.jpg",
      "Deux amies qui discutent autour d&apos;un café"
    )}
    ${tipCard(
      4,
      "Montrez votre badge « J&apos;y serai ».",
      "Voir que vous êtes déjà inscrit(e) rassure plus qu&apos;un lien seul. Ce badge, avec votre photo et votre nom, prouve que vous y allez vraiment, que ce n&apos;est pas juste un message qu&apos;on relaie. Enregistrez-le et joignez-le à votre message ou publiez-le en story, beaucoup de gens hésitent moins quand ils voient quelqu&apos;un qu&apos;ils connaissent déjà engagé(e).",
      "/images/christelle-avec-le-vaccin.jpg",
      "Christelle Gnimassou, campagne « Le vaccin de la dépression »"
    )}
    ${tipCard(
      5,
      "Relancez une fois.",
      "Un rappel discret quelques jours après suffit souvent. Les gens ont l&apos;intention d&apos;y aller, il leur manque juste un dernier coup de pouce : un message d&apos;origine se perd vite dans une conversation qui continue. Une simple relance, « tu t&apos;es inscrit(e) finalement ? », rattrape la plupart des personnes qui avaient l&apos;intention de le faire sans être allées jusqu&apos;au bout.",
      "/images/ambassador-tips/tip-5-reminder.jpg",
      "Un réveil rappelant l&apos;heure"
    )}

    <p style="margin:6px 0 20px; font-size:15px; line-height:1.6; color:#16211dcc; font-family:Arial, sans-serif;">
      Chaque inscription grâce à vous, c&apos;est une personne de plus qui prend ce premier pas. Voici votre lien, prêt à repartir.
    </p>
    ${referralLinkBox(referralUrl)}
    ${shareButtons(shareMessage)}
  `);

  return {
    subject: `${first}, 5 astuces simples pour réussir votre parrainage`,
    html,
  };
}

// Déclenché par le cron quotidien /api/cron/ambassador-nudges (cf.
// lib/ambassadors/nudges.ts) pour un ambassadeur encore à zéro parrainage,
// au plus une fois tous les quelques jours. Ton volontairement léger —
// « ce n'est pas grave » — plutôt que culpabilisant : le but est de
// relancer le partage, pas de faire sentir à quelqu'un qu'il a échoué.
export function buildAmbassadorZeroNudgeEmail(fullName: string, referralUrl: string) {
  const first = fullName.split(/\s+/)[0];
  const shareMessage = `Je vous invite au CIGIBM ${cigibm.nextEdition.edition}, « ${cigibm.nextEdition.theme} », les ${cigibm.nextEdition.dates} au ${cigibm.nextEdition.venue}. Réservez votre place gratuite ici : ${referralUrl}`;

  const html = emailShell(`
    <p style="margin:0 0 4px; font-family:Arial, sans-serif; font-size:12px; letter-spacing:1.5px; text-transform:uppercase; color:#307335; font-weight:bold;">
      Programme Ambassadeurs
    </p>
    <h1 style="margin:0 0 20px; font-size:26px; line-height:1.25; color:#183a1a;">
      ${first}, une seule personne suffit pour commencer.
    </h1>
    <p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#16211dcc; font-family:Arial, sans-serif;">
      Votre lien d&apos;ambassadeur est prêt et n&apos;attend qu&apos;à être partagé. Envoyez-le aujourd&apos;hui à une seule personne — un membre de la famille, un(e) collègue, un groupe WhatsApp — et vous aurez déjà fait la différence pour quelqu&apos;un.
    </p>
    ${referralLinkBox(referralUrl)}
    ${shareButtons(shareMessage)}
    <p style="margin:20px 0 0; font-size:14px; line-height:1.6; color:#16211d99; font-family:Arial, sans-serif;">
      Pas encore de première inscription grâce à vous ? Ce n&apos;est pas grave, le congrès est encore loin — chaque partage compte, même s&apos;il ne donne rien tout de suite.
    </p>
  `);

  return {
    subject: `${first}, votre lien d'ambassadeur n'attend qu'un partage`,
    html,
  };
}

// Déclenché par le même cron dès qu'un ambassadeur franchit un nouveau
// palier de 5 parrainages (5, 10, 15…) — jamais deux fois pour le même
// palier, cf. highestMilestoneCelebrated dans lib/ambassadors/nudges.ts.
// Distinct de buildAmbassadorReferralEmail : celui-ci célèbre un cap
// franchi et relance l'élan, l'autre confirme chaque inscription une par
// une en temps réel — les deux peuvent arriver le même jour sans se
// répéter (sujets et contenus différents).
export function buildAmbassadorMilestoneEmail(
  fullName: string,
  milestone: number,
  totalReferrals: number,
  referralUrl: string
) {
  const first = fullName.split(/\s+/)[0];
  const html = emailShell(`
    <p style="margin:0 0 4px; font-family:Arial, sans-serif; font-size:12px; letter-spacing:1.5px; text-transform:uppercase; color:#307335; font-weight:bold;">
      Programme Ambassadeurs
    </p>
    <h1 style="margin:0 0 20px; font-size:26px; line-height:1.25; color:#183a1a;">
      ${milestone} inscriptions grâce à vous, ${first}. Bravo !
    </h1>
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
    <p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#16211dcc; font-family:Arial, sans-serif;">
      Vous faites une vraie différence pour le CIGIBM ${cigibm.nextEdition.edition}. Continuez à partager votre lien : chaque nouvelle personne compte autant que la première.
    </p>
    ${referralLinkBox(referralUrl)}
    ${ctaButton("Voir le programme", `${SITE_URL}/cigibm-2026`)}
  `);

  return {
    subject: `${milestone} inscriptions grâce à vous, ${first} ! Continuez comme ça`,
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
    // Le numéro de compteur dans le sujet n'est pas qu'un ajout
    // informatif : chaque nouvelle inscription incrémente forcément
    // totalReferrals, ce qui garantit un sujet différent d'un envoi à
    // l'autre. Sans ça, deux inscriptions distinctes pour le même
    // ambassadeur produisaient un sujet identique — Gmail (et la plupart
    // des clients mail) regroupe alors les deux emails dans une seule
    // conversation, ce qui masque qu'il s'agit de deux inscriptions bien
    // réelles et séparées. Constaté en production : deux notifications
    // légitimes pour le même ambassadeur fusionnées en une seule entrée
    // "2" dans la boîte de réception.
    subject: `${first}, quelqu'un vient de s'inscrire grâce à vous ! (#${totalReferrals})`,
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
    // Même raison que buildAmbassadorReferralEmail ci-dessus : le nom du
    // participant garantit un sujet distinct à chaque envoi (même
    // ambassadeur, même total possible sur deux ambassadeurs différents,
    // mais jamais la même personne inscrite deux fois de suite), pour que
    // Gmail ne fusionne pas plusieurs notifications réelles et distinctes
    // dans une seule conversation.
    subject: `Nouvelle inscription via le lien de ${ambassadorFullName} : ${participantFullName}`,
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
// Nom d'expéditeur "Coach Christelle" — choisi par l'ONG, configuré tel
// quel côté Brevo pour contact@ongtriomphedelinterieur.com (GET
// /v3/senders, id 4). Distinct de siteConfig.name (utilisé pour le pied de
// page des emails, où l'identité institutionnelle reste appropriée) —
// c'est spécifiquement le nom affiché comme expéditeur qui doit être
// personnel.
const SENDER_NAME = "Coach Christelle";
const PRIMARY_SENDER = { name: SENDER_NAME, email: siteConfig.email };
const FALLBACK_SENDER = { name: SENDER_NAME, email: "hodonou939@gmail.com" };

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

// Les emails ambassadeur (bienvenue, notifications de parrainage) passent
// tous par sendTransactionalEmail ci-dessus, l'API transactionnelle de
// Brevo — qui ne crée jamais de Contact de son côté (Contacts et
// Transactionnel sont deux systèmes Brevo distincts). Sans cet appel
// séparé à /v3/contacts, un ambassadeur n'apparaît nulle part dans le CRM
// Brevo malgré des emails bien envoyés — constaté en production par
// l'ONG elle-même en cherchant un ambassadeur dans Contacts. Best-effort
// et jamais bloquant : un échec ici ne doit jamais empêcher la création
// du compte ambassadeur.
export async function addAmbassadorToBrevoList(apiKey: string, email: string, fullName: string, phone: string) {
  async function attempt(attributes: Record<string, unknown>) {
    return fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email,
        attributes,
        listIds: [brevo.cigibm4AmbassadorsListId],
        updateEnabled: true,
      }),
    });
  }

  let res = await attempt({ FIRSTNAME: fullName, SMS: phone });
  if (res.status === 400) {
    const body = await res.clone().json().catch(() => null);
    const duplicateFields: string[] = body?.metadata?.duplicate_identifiers ?? [];
    const isDuplicateSmsOnly =
      body?.code === "duplicate_parameter" && duplicateFields.includes("SMS") && !duplicateFields.includes("email");
    // Même repli que app/api/cigibm-register/route.ts pour ce même code
    // Brevo — jusqu'ici absent ici, ce qui laissait silencieusement de côté
    // tout ambassadeur dont le numéro est dans un format que Brevo rejette
    // (constaté : 6 ambassadeurs sur 18 lors d'une resynchronisation
    // manuelle de la liste). Le téléphone reste enregistré normalement dans
    // notre propre base ; seul l'attribut SMS envoyé à Brevo est abandonné.
    const isInvalidPhoneNumber =
      body?.code === "invalid_parameter" && typeof body?.message === "string" && body.message.toLowerCase().includes("phone");

    if (isDuplicateSmsOnly || isInvalidPhoneNumber) {
      res = await attempt({ FIRSTNAME: fullName });
    }
  }

  return res;
}
