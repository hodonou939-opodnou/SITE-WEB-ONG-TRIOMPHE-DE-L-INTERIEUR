import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addAmbassadorToBrevoList,
  buildAmbassadorBadgeAnnouncementEmail,
  buildAmbassadorTipsEmail,
  buildBadgeReminderEmail,
  buildConfirmationEmail,
} from "./email";

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

describe("buildAmbassadorTipsEmail", () => {
  it("includes the referral link and five concrete tips, not just encouragement", () => {
    const message = buildAmbassadorTipsEmail("Fatou Diallo", "https://ongtriomphedelinterieur.com/r/fatou");

    expect(message.subject).toContain("Fatou");
    expect(message.html).toContain("https://ongtriomphedelinterieur.com/r/fatou");
    expect(message.html).toContain("Ajoutez un mot avant le lien");
    expect(message.html).toContain("Relancez une fois");
  });

  // Les photos de Christelle sont rares : ne pas en épuiser le stock sur un
  // seul email au profit de visuels libres de droits pour les autres cartes.
  it("uses at most two distinct Christelle photos", () => {
    const message = buildAmbassadorTipsEmail("Fatou Diallo", "https://ongtriomphedelinterieur.com/r/fatou");

    const christellePaths = [...message.html.matchAll(/src="[^"]*\/images\/([^"]*christelle[^"]*)"/gi)].map((m) => m[1]);
    const distinctPaths = new Set(christellePaths);

    expect(distinctPaths.size).toBeLessThanOrEqual(2);
  });
});

describe("addAmbassadorToBrevoList", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retries without the phone number when Brevo rejects it as invalid", async () => {
    let callCount = 0;
    let secondCallBody: string | undefined;
    global.fetch = (async (_url: string, init?: RequestInit) => {
      callCount++;
      if (callCount === 1) {
        return new Response(JSON.stringify({ code: "invalid_parameter", message: "Invalid phone number" }), {
          status: 400,
        });
      }
      secondCallBody = init?.body as string;
      return new Response(JSON.stringify({ id: 1 }), { status: 201 });
    }) as typeof fetch;

    const res = await addAmbassadorToBrevoList("test-key", "amb@example.com", "Fatou Diallo", "not-a-real-phone");

    expect(callCount).toBe(2);
    expect(res.status).toBe(201);
    expect(secondCallBody).toBeDefined();
    expect(JSON.parse(secondCallBody!).attributes).not.toHaveProperty("SMS");
  });

  it("retries without the phone number when it's already used by another Brevo contact", async () => {
    let callCount = 0;
    global.fetch = (async () => {
      callCount++;
      if (callCount === 1) {
        return new Response(
          JSON.stringify({ code: "duplicate_parameter", metadata: { duplicate_identifiers: ["SMS"] } }),
          { status: 400 }
        );
      }
      return new Response(JSON.stringify({ id: 1 }), { status: 201 });
    }) as typeof fetch;

    const res = await addAmbassadorToBrevoList("test-key", "amb@example.com", "Fatou Diallo", "96966501");

    expect(callCount).toBe(2);
    expect(res.status).toBe(201);
  });

  it("doesn't retry for an unrelated 400 (e.g. a real duplicate email)", async () => {
    let callCount = 0;
    global.fetch = (async () => {
      callCount++;
      return new Response(JSON.stringify({ code: "duplicate_parameter", metadata: { duplicate_identifiers: ["email"] } }), {
        status: 400,
      });
    }) as typeof fetch;

    const res = await addAmbassadorToBrevoList("test-key", "amb@example.com", "Fatou Diallo", "96966501");

    expect(callCount).toBe(1);
    expect(res.status).toBe(400);
  });
});
