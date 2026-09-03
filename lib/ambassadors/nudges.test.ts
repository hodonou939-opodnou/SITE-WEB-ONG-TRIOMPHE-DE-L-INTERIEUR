// @vitest-environment node
//
// runAmbassadorNudges() writes to real Ambassador rows as a side effect of
// its own query (lastNudgeSentAt, highestMilestoneCelebrated) — unlike the
// read-only helpers tested elsewhere in this repo (e.g.
// lib/admin/ambassadors.test.ts), it can't safely run against the shared
// real database: its own findMany() has no way to scope itself to rows a
// test created, so it would also match and mutate whichever real
// ambassadors already exist. @/lib/db is fully mocked here for that reason
// — confirmed the hard way once already (see git history for this file):
// running it for real against production briefly set lastNudgeSentAt /
// highestMilestoneCelebrated on three real ambassadors, caught and
// reverted by hand before this rewrite.
import { afterEach, describe, expect, it, vi } from "vitest";
import { runAmbassadorNudges, selectNudge, type NudgeCandidate } from "./nudges";

const NOW = new Date("2026-09-15T08:00:00Z");

function candidate(overrides: Partial<NudgeCandidate> = {}): NudgeCandidate {
  return {
    id: "ambassador-1",
    fullName: "Test Ambassador",
    email: "test@test.example",
    slug: "test-ambassador",
    referredCount: 0,
    createdAt: new Date("2026-08-01T00:00:00Z"),
    lastNudgeSentAt: null,
    highestMilestoneCelebrated: 0,
    ...overrides,
  };
}

describe("selectNudge", () => {
  it("does not nudge a zero-referral ambassador still within the grace period", () => {
    const a = candidate({ createdAt: new Date(NOW.getTime() - 1 * 24 * 60 * 60 * 1000) });
    expect(selectNudge(a, NOW)).toBeNull();
  });

  it("sends a zero-referral nudge once the grace period has passed and none was sent yet", () => {
    const a = candidate({ createdAt: new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000), lastNudgeSentAt: null });
    expect(selectNudge(a, NOW)).toEqual({ type: "zero", ambassador: a });
  });

  it("does not re-nudge a zero-referral ambassador before the interval elapses", () => {
    const a = candidate({
      createdAt: new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000),
      lastNudgeSentAt: new Date(NOW.getTime() - 1 * 24 * 60 * 60 * 1000),
    });
    expect(selectNudge(a, NOW)).toBeNull();
  });

  it("nudges again once the interval has elapsed", () => {
    const a = candidate({
      createdAt: new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000),
      lastNudgeSentAt: new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000),
    });
    expect(selectNudge(a, NOW)).toEqual({ type: "zero", ambassador: a });
  });

  it("celebrates a first milestone at 5 referrals", () => {
    const a = candidate({ referredCount: 5, highestMilestoneCelebrated: 0 });
    expect(selectNudge(a, NOW)).toEqual({ type: "milestone", ambassador: a, milestone: 5 });
  });

  it("does not re-celebrate the same milestone", () => {
    const a = candidate({ referredCount: 6, highestMilestoneCelebrated: 5 });
    expect(selectNudge(a, NOW)).toBeNull();
  });

  it("celebrates the next milestone once it is crossed", () => {
    const a = candidate({ referredCount: 12, highestMilestoneCelebrated: 5 });
    expect(selectNudge(a, NOW)).toEqual({ type: "milestone", ambassador: a, milestone: 10 });
  });

  it("does nothing for an ambassador between zero and the first milestone", () => {
    const a = candidate({ referredCount: 3, highestMilestoneCelebrated: 0 });
    expect(selectNudge(a, NOW)).toBeNull();
  });
});

vi.mock("@/lib/db", () => ({
  db: {
    ambassador: { findMany: vi.fn(), update: vi.fn() },
    // logMessage() (called internally by sendTransactionalEmail) writes here;
    // its own try/catch already tolerates this failing, so a bare vi.fn()
    // rejecting isn't needed — a resolved stub just keeps test output quiet.
    messagingLog: { create: vi.fn().mockResolvedValue({}) },
  },
}));

// Importé après vi.mock (hoisté par vitest de toute façon) pour piloter le
// même mock depuis les tests ci-dessous.
import { db } from "@/lib/db";

describe("runAmbassadorNudges", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // restoreAllMocks() does not reset call history for a vi.fn() created
    // inside a vi.mock() factory (only for vi.spyOn() spies) — without this,
    // "not.toHaveBeenCalled()" in a later test would see earlier tests' calls.
    vi.mocked(db.ambassador.findMany).mockReset();
    vi.mocked(db.ambassador.update).mockReset();
  });

  it("stops immediately once the campaign end date has passed, touching neither Brevo nor the database", async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    const result = await runAmbassadorNudges("test-key", new Date("2026-10-18T00:00:00Z"));

    expect(result).toEqual({ campaignEnded: true, sent: [], failed: [] });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(db.ambassador.findMany).not.toHaveBeenCalled();
  });

  it("sends a zero-referral nudge and records lastNudgeSentAt", async () => {
    const emailCalls: string[] = [];
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/v3/smtp/email")) {
        emailCalls.push(JSON.parse(init?.body as string).subject);
        return new Response(JSON.stringify({ messageId: "x" }), { status: 201 });
      }
      return new Response(JSON.stringify({}), { status: 201 });
    });
    vi.mocked(db.ambassador.findMany).mockResolvedValue([
      {
        id: "amb-zero",
        fullName: "Test Zero",
        slug: "test-zero",
        email: "zero@test.example",
        createdAt: new Date("2026-09-01T00:00:00Z"),
        lastNudgeSentAt: null,
        highestMilestoneCelebrated: 0,
        participants: [],
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    const result = await runAmbassadorNudges("test-key", NOW);

    expect(result.sent).toEqual([{ ambassadorId: "amb-zero", type: "zero" }]);
    expect(emailCalls).toHaveLength(1);
    expect(db.ambassador.update).toHaveBeenCalledWith({
      where: { id: "amb-zero" },
      data: { lastNudgeSentAt: NOW },
    });
  });

  it("sends a milestone email and records the new highestMilestoneCelebrated", async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ messageId: "x" }), { status: 201 }));
    vi.mocked(db.ambassador.findMany).mockResolvedValue([
      {
        id: "amb-star",
        fullName: "Test Star",
        slug: "test-star",
        email: "star@test.example",
        createdAt: new Date("2026-09-01T00:00:00Z"),
        lastNudgeSentAt: null,
        highestMilestoneCelebrated: 0,
        participants: Array.from({ length: 5 }, (_, i) => ({ id: `p${i}` })),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    const result = await runAmbassadorNudges("test-key", NOW);

    expect(result.sent).toEqual([{ ambassadorId: "amb-star", type: "milestone" }]);
    expect(db.ambassador.update).toHaveBeenCalledWith({
      where: { id: "amb-star" },
      data: { lastNudgeSentAt: NOW, highestMilestoneCelebrated: 5 },
    });
  });

  it("records a failure and skips the database update when Brevo rejects the send", async () => {
    global.fetch = vi.fn(async () => new Response("nope", { status: 400 }));
    vi.mocked(db.ambassador.findMany).mockResolvedValue([
      {
        id: "amb-fail",
        fullName: "Test Fail",
        slug: "test-fail",
        email: "fail@test.example",
        createdAt: new Date("2026-09-01T00:00:00Z"),
        lastNudgeSentAt: null,
        highestMilestoneCelebrated: 0,
        participants: [],
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    const result = await runAmbassadorNudges("test-key", NOW);

    expect(result.failed).toEqual([{ ambassadorId: "amb-fail", error: "Brevo responded 400" }]);
    expect(db.ambassador.update).not.toHaveBeenCalled();
  });
});
