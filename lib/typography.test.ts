import { describe, expect, it } from "vitest";
import { frenchSpacing } from "./typography";

describe("frenchSpacing", () => {
  it("attache guillemets et ponctuation haute au mot voisin", () => {
    expect(frenchSpacing("« La résilience » : une une ?")).toBe("«\u00a0La résilience\u00a0»\u00a0: une une\u00a0?");
  });
  it("garde les milliers d'un seul tenant", () => {
    expect(frenchSpacing("plus de 58 000 personnes, 1 594 inscrits")).toBe("plus de 58 000 personnes, 1 594 inscrits");
    expect(frenchSpacing("les 17 et 18 octobre")).toBe("les 17 et 18 octobre");
  });
  it("ne touche pas au reste du texte", () => {
    expect(frenchSpacing("Bonjour, le CIGIBM 2026.")).toBe("Bonjour, le CIGIBM 2026.");
  });
});
