import { describe, expect, it, vi } from "vitest";
import { slugify, uniqueAmbassadorSlug } from "./slug";

describe("slugify", () => {
  it("lowercases, strips accents, and hyphenates a full name", () => {
    expect(slugify("Christelle Eugénie Gnimassou")).toBe("christelle-eugenie-gnimassou");
  });

  it("strips characters that aren't letters, digits, or spaces", () => {
    expect(slugify("Jean-Paul O'Brien!!")).toBe("jean-paul-o-brien");
  });

  it("collapses repeated separators and trims leading/trailing hyphens", () => {
    expect(slugify("  --Marie   Dupont--  ")).toBe("marie-dupont");
  });
});

describe("uniqueAmbassadorSlug", () => {
  it("returns the plain slug when it's not taken", async () => {
    const exists = vi.fn().mockResolvedValue(false);
    const slug = await uniqueAmbassadorSlug("Nouveau Nom Jamais Utilise", exists);
    expect(slug).toBe("nouveau-nom-jamais-utilise");
    expect(exists).toHaveBeenCalledWith("nouveau-nom-jamais-utilise");
  });

  it("appends a short random suffix when the plain slug is taken", async () => {
    const exists = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const slug = await uniqueAmbassadorSlug("Nom Deja Pris", exists);
    expect(slug).toMatch(/^nom-deja-pris-[a-z0-9]{4,6}$/);
  });
});
