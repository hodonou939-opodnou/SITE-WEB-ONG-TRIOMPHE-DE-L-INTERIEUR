import { describe, expect, it } from "vitest";
import { buildConfirmationEmail } from "./email";

describe("buildConfirmationEmail", () => {
  it("includes a link to the badge page", () => {
    const message = buildConfirmationEmail("Aïcha", "https://ongtriomphedelinterieur.com/cigibm-2026/badge/abc123");

    expect(message.html).toContain("https://ongtriomphedelinterieur.com/cigibm-2026/badge/abc123");
  });
});
