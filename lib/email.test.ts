import { afterEach, describe, expect, it, vi } from "vitest";
import { buildAmbassadorBadgeAnnouncementEmail, buildBadgeReminderEmail, buildConfirmationEmail } from "./email";

describe("buildConfirmationEmail", () => {
  it("includes a link to the badge page built from SITE_URL when a token is given", () => {
    const message = buildConfirmationEmail("Aïcha", "abc123");

    expect(message.html).toContain("https://ongtriomphedelinterieur.com/cigibm-2026/badge/abc123");
  });

  // Régression : la fonctionnalité badge ne doit jamais supprimer l'email de
  // confirmation lui-même quand aucun token n'est disponible (participant
  // créé, mais Participant.attendanceToken introuvable) — seul le bouton de
  // badge est conditionnel, le reste de l'email (dont le bouton "Voir les
  // détails du congrès" et les informations pratiques) doit toujours partir.
  it("still sends the full confirmation email without the badge button when no token is given", () => {
    const message = buildConfirmationEmail("Aïcha");

    expect(message.html).toContain("Voir les détails du congrès");
    expect(message.html).not.toContain("Créer mon badge");
    expect(message.html).toContain("Palais des Congrès de Cotonou");
    expect(message.html).toContain("+229 01 68 28 06 75");
  });
});

describe("buildBadgeReminderEmail", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("includes the badge link but not the registration-confirmation framing", () => {
    const message = buildBadgeReminderEmail("Aïcha Traoré", "xyz789");

    expect(message.html).toContain("https://ongtriomphedelinterieur.com/cigibm-2026/badge/xyz789");
    expect(message.html).toContain("Aïcha");
    // Un renvoi n'est pas une nouvelle inscription — ce cadrage-là appartient
    // à buildConfirmationEmail, pas à ce modèle.
    expect(message.html).not.toContain("Inscription confirmée");
  });

  // Gmail (et la plupart des clients) regroupe des emails de sujet
  // identique dans une seule conversation : deux renvois à la même personne
  // doivent avoir des sujets différents pour apparaître comme deux emails
  // distincts, pas un seul message écrasé/fusionné.
  it("varies the subject by send time, so repeated resends don't collapse into one Gmail thread", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-10T10:15:00Z"));
    const first = buildBadgeReminderEmail("Aïcha", "xyz789").subject;

    vi.setSystemTime(new Date("2026-10-10T10:16:00Z"));
    const second = buildBadgeReminderEmail("Aïcha", "xyz789").subject;

    expect(first).not.toBe(second);
  });
});

describe("buildAmbassadorBadgeAnnouncementEmail", () => {
  it("explains the badge feature without re-promoting the referral link", () => {
    const message = buildAmbassadorBadgeAnnouncementEmail("Fatou Diallo");

    expect(message.subject).toContain("Fatou");
    expect(message.html).toContain("badge");
    expect(message.html).toContain("J&apos;y serai");
    // Cette annonce ne relance pas le partage — déjà couvert par
    // buildAmbassadorZeroNudgeEmail/buildAmbassadorMilestoneEmail.
    expect(message.html).not.toContain("Votre lien personnel");
  });
});
