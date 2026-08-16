import { cigibm, siteConfig } from "./content";

const SITE_URL = "https://ongtriomphedelinterieur.com";
const LOGO_URL = `${SITE_URL}/images/logo-mark.png`;

function emailShell(content: string) {
  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0; padding:0; background:#f5f9f7; font-family:Georgia, 'Times New Roman', serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f9f7; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px; background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 8px 24px rgba(14,33,24,0.08);">
            <tr>
              <td style="background:#0e2118; padding:32px 40px; text-align:center;">
                <img src="${LOGO_URL}" alt="${siteConfig.name}" width="56" height="56" style="display:block; margin:0 auto 12px;" />
                <p style="margin:0; color:#7fd99a; font-family:Arial, sans-serif; font-size:11px; letter-spacing:2px; text-transform:uppercase;">
                  ${siteConfig.name}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:40px;">
                ${content}
              </td>
            </tr>
            <tr>
              <td style="background:#f5f9f7; padding:24px 40px; text-align:center; font-family:Arial, sans-serif;">
                <p style="margin:0 0 6px; font-size:12px; color:#16211d99;">
                  ${siteConfig.name} &middot; ${siteConfig.location}
                </p>
                <p style="margin:0; font-size:12px; color:#16211d99;">
                  <a href="tel:${siteConfig.phoneHref.replace("tel:", "")}" style="color:#307335; text-decoration:none;">${siteConfig.phone}</a>
                  &middot;
                  <a href="mailto:${siteConfig.email}" style="color:#307335; text-decoration:none;">${siteConfig.email}</a>
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

function ctaButton(label: string, href: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
    <tr>
      <td style="background:#3684c4; border-radius:999px;">
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

const PRIMARY_SENDER = { name: siteConfig.name, email: siteConfig.email };
const FALLBACK_SENDER = { name: siteConfig.name, email: "hodonou939@gmail.com" };

export async function sendTransactionalEmail(
  apiKey: string,
  to: { email: string; name?: string },
  message: { subject: string; html: string }
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
  return res;
}
