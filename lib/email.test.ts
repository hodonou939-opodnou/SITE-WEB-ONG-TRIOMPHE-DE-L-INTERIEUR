import { describe, expect, it } from "vitest";
import { buildConfirmationEmail } from "./email";

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
