import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { db } from "@/lib/db";
import BadgePage from "./page";

const TEST_EMAIL_DOMAIN = "@test.plan.badgepage.example";

describe("BadgePage", () => {
  afterEach(async () => {
    await db.participant.deleteMany({ where: { email: { endsWith: TEST_EMAIL_DOMAIN } } });
  });

  it("renders the generator with the participant's name for a valid token", async () => {
    const edition4 = await db.edition.findUniqueOrThrow({ where: { number: 4 } });
    const participant = await db.participant.create({
      data: {
        editionId: edition4.id,
        fullName: "Badge Page Test Person",
        phone: "+2290100000091",
        email: `badgepage${TEST_EMAIL_DOMAIN}`,
        registrationSource: "form",
      },
    });

    const jsx = await BadgePage({ params: Promise.resolve({ token: participant.attendanceToken }) });
    render(jsx);

    expect(screen.getByText(/Ajouter ma photo/)).toBeInTheDocument();
  });

  it("shows an invalid-link message for an unknown token", async () => {
    const jsx = await BadgePage({ params: Promise.resolve({ token: "does-not-exist" }) });
    render(jsx);

    expect(screen.getByText(/lien invalide/i)).toBeInTheDocument();
  });
});
