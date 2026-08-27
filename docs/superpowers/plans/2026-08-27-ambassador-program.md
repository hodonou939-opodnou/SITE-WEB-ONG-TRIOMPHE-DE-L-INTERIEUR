# Ambassador Program Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give ambassadors a referral link that attributes registrations to them, an admin screen to manage ambassadors and see their live stats, and a public "Ambassadors Program" section on the CIGIBM funnel page.

**Architecture:** Same Next.js 16 App Router project as the Foundation phase, already live in production. This plan adds one new admin route group (`/admin/ambassadors`), a small referral-cookie capture on the existing public funnel page, one additive change to the already-hardened registration route, and a new public-facing carousel section that follows the same scroll-snap pattern already used for the homepage's press coverage. No new database schema — `Ambassador` and `Participant.ambassadorId` already exist, migrated to production, from the Foundation phase.

**Tech Stack:** Same as Foundation — Next.js 16, Prisma 7 (`db` singleton from `@/lib/db`), Supabase Auth (`requireAdmin()`), Vitest, no new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-26-admin-crm-ambassador-design.md` — read §8 "Ambassador program flow" for the authoritative design; §5 for the already-migrated schema; §6 for the registration-route integration point.

## Global Constraints

- All UI copy is French (Béninoise NGO).
- Established Tailwind v4 tokens (`leaf-*`, `mist-*`, `ink` with opacity modifiers, `font-display`) from `app/globals.css`. Tailwind v4 defaults are NOT cleared, so standard palette colors remain available for genuinely semantic purposes — already settled during the Foundation phase, not open for re-litigation.
- Tests that touch the database run against the real (production-adjacent) Supabase Postgres instance — there is no mocked/in-memory Postgres in this stack. **Every test file must use its own distinct identifying literal** (email domain, slug prefix, or similar) — not reused from any other test file in this repo, Foundation or this plan. Vitest runs test files in parallel against one shared database; a reused literal causes one file's cleanup to delete another file's in-flight fixtures. This was discovered and fixed multiple times during the Foundation phase — it is a hard rule now, not a suggestion.
- `app/api/cigibm-register/route.ts` is a LIVE, IN-PRODUCTION route with a real prior incident and a documented adversarial review (23 agents, one Critical + one Important finding, both fixed). Any change to it in this plan is additive only: existing behavior (Brevo contact, confirmation email, `/merci` redirect, the `(editionId, email)` upsert dedup, the `maxDuration = 60` timeout budget) must not regress. Read the file fresh before touching it — do not assume the version quoted in this plan is still byte-exact.
- `lib/db.ts`'s `db` singleton (with its bounded connection/statement/query timeouts) is the only Prisma client in this app. Never construct a second one.
- No new npm dependencies. Slug generation, clipboard copy, and the referral cookie are all small enough to hand-write with what's already installed.

---

### Task 1: Ambassador data layer (list-with-stats, create, get, update)

**Files:**
- Create: `lib/ambassadors/slug.ts`
- Create: `lib/ambassadors/slug.test.ts`
- Create: `lib/admin/ambassadors.ts`
- Create: `lib/admin/ambassadors.test.ts`

**Interfaces:**
- Consumes: `db` from `@/lib/db` (Foundation).
- Produces: `slugify(fullName: string): string` and `uniqueAmbassadorSlug(fullName: string): Promise<string>` from `lib/ambassadors/slug.ts`. `type AmbassadorWithStats = { id: string; slug: string; fullName: string; phone: string; whatsappNumber: string | null; email: string | null; photoUrl: string | null; bio: string | null; active: boolean; referredCount: number; attendedCount: number }`, `listAmbassadorsWithStats(): Promise<AmbassadorWithStats[]>`, `type CreateAmbassadorInput = { fullName: string; phone: string; whatsappNumber?: string; email?: string; photoUrl?: string; bio?: string }`, `createAmbassador(input: CreateAmbassadorInput): Promise<{ id: string; slug: string }>`, `getAmbassador(id: string): Promise<{ id: string; slug: string; fullName: string; phone: string; whatsappNumber: string | null; email: string | null; photoUrl: string | null; bio: string | null; active: boolean } | null>`, `type UpdateAmbassadorInput = { fullName: string; phone: string; whatsappNumber?: string | null; email?: string | null; photoUrl?: string | null; bio?: string | null; active: boolean }`, `updateAmbassador(id: string, input: UpdateAmbassadorInput): Promise<void>` — all from `lib/admin/ambassadors.ts`. Task 2 uses `createAmbassador`, Task 3 uses `getAmbassador`/`updateAmbassador`, Task 4 uses `listAmbassadorsWithStats`.

- [ ] **Step 1: Write the failing test for `slugify`**

`lib/ambassadors/slug.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `npx vitest run lib/ambassadors/slug.test.ts`
Expected: FAIL — `Cannot find module './slug'`.

- [ ] **Step 3: Write `lib/ambassadors/slug.ts`**

```typescript
export function slugify(fullName: string): string {
  return fullName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Injectable `exists` check so this stays testable without a real DB call —
// the real caller (createAmbassador) passes a function backed by Prisma.
export async function uniqueAmbassadorSlug(
  fullName: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  const base = slugify(fullName);
  if (!(await exists(base))) return base;

  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = Math.random().toString(36).slice(2, 8);
    const candidate = `${base}-${suffix}`;
    if (!(await exists(candidate))) return candidate;
  }

  // Astronomically unlikely to be reached — five random 4-6 char suffixes
  // all colliding — but a caller must always get a string back.
  return `${base}-${Date.now().toString(36)}`;
}
```

- [ ] **Step 4: Run it, confirm it passes**

Run: `npx vitest run lib/ambassadors/slug.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Write the failing test for the ambassador data layer**

`lib/admin/ambassadors.test.ts`:

```typescript
import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  createAmbassador,
  getAmbassador,
  listAmbassadorsWithStats,
  updateAmbassador,
} from "./ambassadors";

const TEST_SLUG_PREFIX = "test-plan-ambassadors";

describe("createAmbassador", () => {
  afterEach(async () => {
    await db.ambassador.deleteMany({ where: { slug: { startsWith: TEST_SLUG_PREFIX } } });
  });

  it("creates an ambassador with a slug derived from the name", async () => {
    const result = await createAmbassador({
      fullName: `${TEST_SLUG_PREFIX} Alpha`,
      phone: "+2290100000041",
    });

    expect(result.slug).toBe("test-plan-ambassadors-alpha");
    const row = await db.ambassador.findUnique({ where: { id: result.id } });
    expect(row?.fullName).toBe(`${TEST_SLUG_PREFIX} Alpha`);
    expect(row?.active).toBe(true);
  });

  it("appends a random suffix instead of colliding on a duplicate name", async () => {
    const first = await createAmbassador({ fullName: `${TEST_SLUG_PREFIX} Beta`, phone: "+2290100000042" });
    const second = await createAmbassador({ fullName: `${TEST_SLUG_PREFIX} Beta`, phone: "+2290100000043" });

    expect(first.slug).not.toBe(second.slug);
    expect(second.slug).toMatch(new RegExp(`^${TEST_SLUG_PREFIX}-beta-[a-z0-9]{4,6}$`));
  });
});

describe("listAmbassadorsWithStats", () => {
  afterEach(async () => {
    await db.participant.deleteMany({ where: { fullName: { startsWith: TEST_SLUG_PREFIX } } });
    await db.ambassador.deleteMany({ where: { slug: { startsWith: TEST_SLUG_PREFIX } } });
  });

  it("computes referredCount and attendedCount from real Participant rows", async () => {
    const ambassador = await createAmbassador({ fullName: `${TEST_SLUG_PREFIX} Gamma`, phone: "+2290100000044" });
    const edition4 = await db.edition.findUniqueOrThrow({ where: { number: 4 } });

    await db.participant.createMany({
      data: [
        {
          editionId: edition4.id,
          fullName: `${TEST_SLUG_PREFIX} Referred Attended`,
          phone: "+2290100000045",
          email: `gamma-attended@${TEST_SLUG_PREFIX}.example`,
          registrationSource: "form",
          ambassadorId: ambassador.id,
          attendedAt: new Date(),
        },
        {
          editionId: edition4.id,
          fullName: `${TEST_SLUG_PREFIX} Referred Not Attended`,
          phone: "+2290100000046",
          email: `gamma-notattended@${TEST_SLUG_PREFIX}.example`,
          registrationSource: "form",
          ambassadorId: ambassador.id,
        },
      ],
    });

    const list = await listAmbassadorsWithStats();
    const row = list.find((a) => a.id === ambassador.id);

    expect(row?.referredCount).toBe(2);
    expect(row?.attendedCount).toBe(1);
  });
});

describe("getAmbassador / updateAmbassador", () => {
  afterEach(async () => {
    await db.ambassador.deleteMany({ where: { slug: { startsWith: TEST_SLUG_PREFIX } } });
  });

  it("returns null for a non-existent id", async () => {
    const result = await getAmbassador("00000000-0000-0000-0000-000000000000");
    expect(result).toBeNull();
  });

  it("updates the editable fields and can deactivate", async () => {
    const created = await createAmbassador({ fullName: `${TEST_SLUG_PREFIX} Delta`, phone: "+2290100000047" });

    await updateAmbassador(created.id, {
      fullName: `${TEST_SLUG_PREFIX} Delta Updated`,
      phone: "+2290100000048",
      whatsappNumber: "+2290100000049",
      email: `delta@${TEST_SLUG_PREFIX}.example`,
      photoUrl: "https://example.test/photo.jpg",
      bio: "Bio de test.",
      active: false,
    });

    const updated = await getAmbassador(created.id);
    expect(updated?.fullName).toBe(`${TEST_SLUG_PREFIX} Delta Updated`);
    expect(updated?.phone).toBe("+2290100000048");
    expect(updated?.active).toBe(false);
    // Slug never changes on update — the referral URL must stay stable.
    expect(updated?.slug).toBe(created.slug);
  });
});
```

- [ ] **Step 6: Run it, confirm it fails**

Run: `npx vitest run lib/admin/ambassadors.test.ts`
Expected: FAIL — `Cannot find module './ambassadors'`.

- [ ] **Step 7: Write `lib/admin/ambassadors.ts`**

```typescript
import { db } from "@/lib/db";
import { uniqueAmbassadorSlug } from "@/lib/ambassadors/slug";

export type AmbassadorWithStats = {
  id: string;
  slug: string;
  fullName: string;
  phone: string;
  whatsappNumber: string | null;
  email: string | null;
  photoUrl: string | null;
  bio: string | null;
  active: boolean;
  referredCount: number;
  attendedCount: number;
};

export async function listAmbassadorsWithStats(): Promise<AmbassadorWithStats[]> {
  const ambassadors = await db.ambassador.findMany({
    include: { participants: { select: { attendedAt: true } } },
    orderBy: { createdAt: "desc" },
  });

  return ambassadors.map((a) => ({
    id: a.id,
    slug: a.slug,
    fullName: a.fullName,
    phone: a.phone,
    whatsappNumber: a.whatsappNumber,
    email: a.email,
    photoUrl: a.photoUrl,
    bio: a.bio,
    active: a.active,
    referredCount: a.participants.length,
    attendedCount: a.participants.filter((p) => p.attendedAt !== null).length,
  }));
}

export type CreateAmbassadorInput = {
  fullName: string;
  phone: string;
  whatsappNumber?: string;
  email?: string;
  photoUrl?: string;
  bio?: string;
};

export async function createAmbassador(
  input: CreateAmbassadorInput
): Promise<{ id: string; slug: string }> {
  const slug = await uniqueAmbassadorSlug(input.fullName, async (candidate) => {
    const existing = await db.ambassador.findUnique({ where: { slug: candidate } });
    return existing !== null;
  });

  const ambassador = await db.ambassador.create({
    data: {
      slug,
      fullName: input.fullName,
      phone: input.phone,
      whatsappNumber: input.whatsappNumber || null,
      email: input.email || null,
      photoUrl: input.photoUrl || null,
      bio: input.bio || null,
    },
  });

  return { id: ambassador.id, slug: ambassador.slug };
}

export async function getAmbassador(id: string) {
  return db.ambassador.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      fullName: true,
      phone: true,
      whatsappNumber: true,
      email: true,
      photoUrl: true,
      bio: true,
      active: true,
    },
  });
}

export type UpdateAmbassadorInput = {
  fullName: string;
  phone: string;
  whatsappNumber?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  bio?: string | null;
  active: boolean;
};

export async function updateAmbassador(id: string, input: UpdateAmbassadorInput): Promise<void> {
  await db.ambassador.update({
    where: { id },
    data: {
      fullName: input.fullName,
      phone: input.phone,
      whatsappNumber: input.whatsappNumber || null,
      email: input.email || null,
      photoUrl: input.photoUrl || null,
      bio: input.bio || null,
      active: input.active,
    },
  });
}
```

- [ ] **Step 8: Run it, confirm it passes**

Run: `npx vitest run lib/admin/ambassadors.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 9: Run the full suite to confirm nothing else broke**

Run: `npx vitest run`
Expected: all PASS.

- [ ] **Step 10: Commit**

```bash
git add lib/ambassadors/ lib/admin/ambassadors.ts lib/admin/ambassadors.test.ts
git commit -m "feat: add ambassador data layer with slug generation and live stats"
```

---

### Task 2: Admin ambassadors list page

**Files:**
- Create: `app/(admin)/admin/(protected)/ambassadors/page.tsx`
- Create: `app/(admin)/admin/(protected)/ambassadors/CopyReferralLink.tsx`
- Modify: `app/(admin)/admin/(protected)/layout.tsx`

**Interfaces:**
- Consumes: `listAmbassadorsWithStats()` from `@/lib/admin/ambassadors` (Task 1).
- Produces: the `/admin/ambassadors` route, which Task 3/4's "back to list" links and the layout's nav both target by this exact path.

This task has no automated test of its own — it's a presentational page over an already-tested data function, matching the pattern Foundation's dashboard/participants pages used. Verification is the build + a route-table check.

- [ ] **Step 1: Write `CopyReferralLink.tsx` (small client component for the copy button)**

```typescript
"use client";

import { useState } from "react";

export default function CopyReferralLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-full border border-leaf-600 px-3 py-1 text-xs font-semibold text-leaf-700 transition-colors hover:bg-leaf-50"
    >
      {copied ? "Copié !" : "Copier le lien"}
    </button>
  );
}
```

- [ ] **Step 2: Write the list page**

`app/(admin)/admin/(protected)/ambassadors/page.tsx`:

```typescript
import Link from "next/link";
import { listAmbassadorsWithStats } from "@/lib/admin/ambassadors";
import CopyReferralLink from "./CopyReferralLink";

const SITE_URL = "https://ongtriomphedelinterieur.com";

export default async function AmbassadorsPage() {
  const ambassadors = await listAmbassadorsWithStats();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-leaf-900">Ambassadeurs</h1>
        <Link href="/admin/ambassadors/new" className="rounded-full bg-leaf-600 px-5 py-2.5 text-sm font-semibold text-mist-50">
          Nouvel ambassadeur
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-ink/8">
        <table className="w-full text-sm">
          <thead className="bg-mist-50 text-left text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Lien de parrainage</th>
              <th className="px-4 py-3">Inscrit·e·s</th>
              <th className="px-4 py-3">Présent·e·s</th>
              <th className="px-4 py-3">Taux</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {ambassadors.map((a) => {
              const referralUrl = `${SITE_URL}/cigibm-2026?ref=${a.slug}`;
              // Taux de présence parmi les personnes parrainées : n'a de sens
              // que s'il y a au moins un·e inscrit·e, sinon on affiche un tiret
              // plutôt qu'un 0% trompeur (division par zéro évitée).
              const rate = a.referredCount > 0 ? Math.round((a.attendedCount / a.referredCount) * 100) : null;
              return (
                <tr key={a.id} className="border-t border-ink/8">
                  <td className="px-4 py-3 font-medium text-leaf-900">{a.fullName}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-mist-100 px-2 py-1 text-xs text-ink/70">/cigibm-2026?ref={a.slug}</code>
                      <CopyReferralLink url={referralUrl} />
                    </div>
                  </td>
                  <td className="px-4 py-3">{a.referredCount}</td>
                  <td className="px-4 py-3">{a.attendedCount}</td>
                  <td className="px-4 py-3">{rate === null ? "—" : `${rate}%`}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${a.active ? "bg-leaf-50 text-leaf-700" : "bg-ink/8 text-ink/50"}`}>
                      {a.active ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/ambassadors/${a.id}/edit`} className="text-leaf-700 underline underline-offset-2">
                      Modifier
                    </Link>
                  </td>
                </tr>
              );
            })}
            {ambassadors.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink/50">
                  Aucun ambassadeur pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add the nav link**

In `app/(admin)/admin/(protected)/layout.tsx`, the `navItems` array currently reads:

```typescript
const navItems = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/participants", label: "Participants" },
  { href: "/admin/messages", label: "Messages" },
];
```

Change it to add one entry after Participants:

```typescript
const navItems = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/participants", label: "Participants" },
  { href: "/admin/ambassadors", label: "Ambassadeurs" },
  { href: "/admin/messages", label: "Messages" },
];
```

Do not touch anything else in this file — `requireAdmin()`, the `signOut` action, and the rest of the layout markup are unrelated to this change and must stay byte-identical.

- [ ] **Step 4: Build and check the route table**

Run: `npx next build`
Expected: succeeds, route table includes `ƒ /admin/ambassadors`.

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/admin/(protected)/ambassadors/page.tsx" "app/(admin)/admin/(protected)/ambassadors/CopyReferralLink.tsx" "app/(admin)/admin/(protected)/layout.tsx"
git commit -m "feat: add admin ambassadors list page"
```

---

### Task 3: Admin ambassador create page + shared form

**Files:**
- Create: `app/(admin)/admin/(protected)/ambassadors/AmbassadorForm.tsx`
- Create: `app/(admin)/admin/(protected)/ambassadors/new/page.tsx`

**Interfaces:**
- Consumes: `createAmbassador()` from `@/lib/admin/ambassadors` (Task 1).
- Produces: `AmbassadorForm` (client component), imported by Task 4's edit page — props: `{ ambassador?: { fullName: string; phone: string; whatsappNumber: string | null; email: string | null; photoUrl: string | null; bio: string | null; active: boolean }; action: (formData: FormData) => Promise<void>; submitLabel: string; showActiveToggle: boolean }`.

This is a Server Action form — no client-side fetch, no dedicated test file (matches the `signOut` Server Action pattern already established in `layout.tsx`; verification is the build plus a manual flow check, consistent with how Foundation's own login/compose forms without a full integration-test harness were verified).

- [ ] **Step 1: Write the shared form component**

`app/(admin)/admin/(protected)/ambassadors/AmbassadorForm.tsx`:

```typescript
"use client";

type AmbassadorFormProps = {
  ambassador?: {
    fullName: string;
    phone: string;
    whatsappNumber: string | null;
    email: string | null;
    photoUrl: string | null;
    bio: string | null;
    active: boolean;
  };
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  showActiveToggle: boolean;
};

export default function AmbassadorForm({ ambassador, action, submitLabel, showActiveToggle }: AmbassadorFormProps) {
  return (
    <form action={action} className="max-w-xl space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">Nom complet</label>
        <input
          name="fullName"
          required
          defaultValue={ambassador?.fullName}
          className="w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">Téléphone</label>
        <input
          name="phone"
          required
          defaultValue={ambassador?.phone}
          placeholder="0196966501"
          className="w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">
          Numéro WhatsApp (optionnel, sinon le téléphone ci-dessus est utilisé)
        </label>
        <input
          name="whatsappNumber"
          defaultValue={ambassador?.whatsappNumber ?? ""}
          className="w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">Email (optionnel)</label>
        <input
          name="email"
          type="email"
          defaultValue={ambassador?.email ?? ""}
          className="w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">
          URL de la photo (optionnel, pour la section publique du site)
        </label>
        <input
          name="photoUrl"
          type="url"
          defaultValue={ambassador?.photoUrl ?? ""}
          placeholder="https://..."
          className="w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">
          Courte présentation (optionnel, pour la section publique du site)
        </label>
        <textarea
          name="bio"
          rows={3}
          defaultValue={ambassador?.bio ?? ""}
          className="w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm"
        />
      </div>
      {showActiveToggle && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={ambassador?.active ?? true} />
          Actif (visible dans la section publique du site)
        </label>
      )}
      <button type="submit" className="rounded-full bg-leaf-600 px-6 py-3 text-sm font-semibold text-mist-50">
        {submitLabel}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Write the create page**

`app/(admin)/admin/(protected)/ambassadors/new/page.tsx`:

```typescript
import { redirect } from "next/navigation";
import { createAmbassador } from "@/lib/admin/ambassadors";
import AmbassadorForm from "../AmbassadorForm";

export default async function NewAmbassadorPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;

  async function createAmbassadorAction(formData: FormData) {
    "use server";

    const fullName = formData.get("fullName")?.toString().trim();
    const phone = formData.get("phone")?.toString().trim();

    if (!fullName || !phone) {
      redirect("/admin/ambassadors/new?erreur=1");
    }

    await createAmbassador({
      fullName,
      phone,
      whatsappNumber: formData.get("whatsappNumber")?.toString().trim() || undefined,
      email: formData.get("email")?.toString().trim() || undefined,
      photoUrl: formData.get("photoUrl")?.toString().trim() || undefined,
      bio: formData.get("bio")?.toString().trim() || undefined,
    });

    redirect("/admin/ambassadors");
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-leaf-900">Nouvel ambassadeur</h1>
      {erreur && (
        <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
          Le nom et le téléphone sont obligatoires.
        </p>
      )}
      <div className="mt-6">
        <AmbassadorForm action={createAmbassadorAction} submitLabel="Créer l'ambassadeur" showActiveToggle={false} />
      </div>
    </div>
  );
}
```

This mirrors the `signOut` inline-Server-Action pattern already established in `app/(admin)/admin/(protected)/layout.tsx` — an async Server Component defining a `"use server"` closure directly in its body, no separate API route needed.

- [ ] **Step 3: Build and check the route table**

Run: `npx next build`
Expected: succeeds, route table includes `ƒ /admin/ambassadors/new`.

- [ ] **Step 4: Run the full test suite**

Run: `npx vitest run`
Expected: all PASS — this task added no new tests, confirm nothing regressed.

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/admin/(protected)/ambassadors/AmbassadorForm.tsx" "app/(admin)/admin/(protected)/ambassadors/new/"
git commit -m "feat: add admin ambassador create page"
```

---

### Task 4: Admin ambassador edit page

**Files:**
- Create: `app/(admin)/admin/(protected)/ambassadors/[id]/edit/page.tsx`

**Interfaces:**
- Consumes: `getAmbassador()`, `updateAmbassador()` from `@/lib/admin/ambassadors` (Task 1); `AmbassadorForm` from Task 3.

- [ ] **Step 1: Write the edit page**

`app/(admin)/admin/(protected)/ambassadors/[id]/edit/page.tsx`:

```typescript
import { notFound, redirect } from "next/navigation";
import { getAmbassador, updateAmbassador } from "@/lib/admin/ambassadors";
import AmbassadorForm from "../../AmbassadorForm";

export default async function EditAmbassadorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { id } = await params;
  const { erreur } = await searchParams;
  const ambassador = await getAmbassador(id);

  if (!ambassador) notFound();

  async function updateAmbassadorAction(formData: FormData) {
    "use server";

    const fullName = formData.get("fullName")?.toString().trim();
    const phone = formData.get("phone")?.toString().trim();

    if (!fullName || !phone) {
      redirect(`/admin/ambassadors/${id}/edit?erreur=1`);
    }

    await updateAmbassador(id, {
      fullName,
      phone,
      whatsappNumber: formData.get("whatsappNumber")?.toString().trim() || null,
      email: formData.get("email")?.toString().trim() || null,
      photoUrl: formData.get("photoUrl")?.toString().trim() || null,
      bio: formData.get("bio")?.toString().trim() || null,
      active: formData.get("active") === "on",
    });

    redirect("/admin/ambassadors");
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-leaf-900">Modifier {ambassador.fullName}</h1>
      {erreur && (
        <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
          Le nom et le téléphone sont obligatoires.
        </p>
      )}
      <div className="mt-6">
        <AmbassadorForm
          ambassador={ambassador}
          action={updateAmbassadorAction}
          submitLabel="Enregistrer"
          showActiveToggle={true}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build and check the route table**

Run: `npx next build`
Expected: succeeds, route table includes `ƒ /admin/ambassadors/[id]/edit`.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`. Log in at `/admin/login`, go to `/admin/ambassadors`, click **Nouvel ambassadeur**, fill in a name and phone, submit — confirm it redirects to the list and the new ambassador appears with a working "Copier le lien" button. Click **Modifier**, change the name, submit — confirm the change is reflected in the list and the referral slug is unchanged.

- [ ] **Step 4: Run the full test suite**

Run: `npx vitest run`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/admin/(protected)/ambassadors/[id]/"
git commit -m "feat: add admin ambassador edit page"
```

---

### Task 5: Referral-cookie capture on the public funnel page

**Files:**
- Create: `components/ReferralCapture.tsx`
- Create: `components/ReferralCapture.test.tsx`
- Modify: `app/(funnel)/cigibm-2026/page.tsx`

**Interfaces:**
- Produces: a `cigibm_ref` cookie (30-day max-age, `path=/`, `SameSite=Lax`), read by Task 6's registration route change. `<ReferralCapture />` renders nothing (`null`) — it's a side-effect-only component.

- [ ] **Step 1: Write the failing test**

`components/ReferralCapture.test.tsx`:

```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

const mockGet = vi.fn();
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: mockGet }),
}));

import ReferralCapture from "./ReferralCapture";

describe("ReferralCapture", () => {
  beforeEach(() => {
    mockGet.mockReset();
    document.cookie = "cigibm_ref=; path=/; max-age=0";
  });

  it("sets the referral cookie when ?ref= is present", () => {
    mockGet.mockImplementation((key: string) => (key === "ref" ? "ambassadeur-test" : null));

    render(<ReferralCapture />);

    expect(document.cookie).toContain("cigibm_ref=ambassadeur-test");
  });

  it("does nothing when no ref param is present", () => {
    mockGet.mockReturnValue(null);

    render(<ReferralCapture />);

    expect(document.cookie).not.toContain("cigibm_ref=");
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `npx vitest run components/ReferralCapture.test.tsx`
Expected: FAIL — `Cannot find module './ReferralCapture'`.

- [ ] **Step 3: Write `components/ReferralCapture.tsx`**

```typescript
"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const REFERRAL_COOKIE_NAME = "cigibm_ref";
const REFERRAL_COOKIE_MAX_AGE_DAYS = 30;

// Composant sans rendu visuel : capture le ?ref=<slug> d'un lien de
// parrainage dans un cookie, lu ensuite par /api/cigibm-register au moment
// de l'inscription. Pas de ref dans l'URL => rien ne se passe, l'attribution
// reste bien optionnelle.
export default function ReferralCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref) return;

    const maxAgeSeconds = REFERRAL_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
    document.cookie = `${REFERRAL_COOKIE_NAME}=${encodeURIComponent(ref)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
  }, [searchParams]);

  return null;
}
```

- [ ] **Step 4: Run it, confirm it passes**

Run: `npx vitest run components/ReferralCapture.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Wire it into the funnel page**

`app/(funnel)/cigibm-2026/page.tsx` currently starts with these imports (read the file fresh first — this plan quotes it as of the Foundation phase's last commit, confirm it still matches):

```typescript
import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import Photo from "@/components/Photo";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import QuoteBlock from "@/components/QuoteBlock";
import StatCounter from "@/components/StatCounter";
import RegistrationForm from "@/components/RegistrationForm";
import { cigibm, impactStats, presidentQuote } from "@/lib/content";
import { getNamedImage } from "@/lib/media";
import { pageMetadata } from "@/lib/seo";
```

Add two imports — `Suspense` from React (for the `useSearchParams()` requirement — verify this is still the current guidance by checking `node_modules/next/dist/docs/` before assuming, per this repo's AGENTS.md convention) and the new component:

```typescript
import { Suspense } from "react";
import ReferralCapture from "@/components/ReferralCapture";
```

Then, inside the `Cigibm2026Page` component's returned JSX, add the capture component as the very first child of the outermost fragment, wrapped in `Suspense` (client components calling `useSearchParams()` need this to avoid opting the whole page out of static rendering without an explicit boundary):

```tsx
return (
  <>
    <Suspense fallback={null}>
      <ReferralCapture />
    </Suspense>
    {/* Hero */}
    <section className="relative overflow-hidden bg-leaf-950">
```

Do not touch anything else on this page — the hero, pain points, approach, stats, registration, speakers, quote, FAQ, and final CTA sections are all unrelated to this task and must stay byte-identical. (Task 8 adds a new section here later; this task only adds the two lines above.)

- [ ] **Step 6: Build**

Run: `npx next build`
Expected: succeeds, no new warnings about `useSearchParams()` needing a Suspense boundary.

- [ ] **Step 7: Run the full test suite**

Run: `npx vitest run`
Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add components/ReferralCapture.tsx components/ReferralCapture.test.tsx "app/(funnel)/cigibm-2026/page.tsx"
git commit -m "feat: capture referral cookie on the CIGIBM funnel page"
```

---

### Task 6: Attribute ambassador on registration

**This task modifies the same live, adversarially-reviewed production route Task 8 of the Foundation plan hardened. Read `app/api/cigibm-register/route.ts` fresh before starting — do not assume the version below is still byte-exact. Preserve every existing property: the `maxDuration = 60` export, the `(editionId, email)` upsert dedup, the non-blocking try/catch around the Participant write, the Brevo duplicate-handling branches, and the confirmation-email step. This change is additive only.**

**Files:**
- Modify: `app/api/cigibm-register/route.ts`
- Modify: `app/api/cigibm-register/route.test.ts`

**Interfaces:**
- Consumes: `db` from `@/lib/db`, the `cigibm_ref` cookie produced by Task 5.
- Produces: nothing new consumed by later tasks — this is the terminal write of the attribution flow.

- [ ] **Step 1: Write the failing test**

`app/api/cigibm-register/route.test.ts` already has a `describe("POST /api/cigibm-register", ...)` block with existing tests (from the Foundation plan) — read the current file fully before editing, and append these new tests inside the same `describe` block, using the file's own existing `TEST_EMAIL_DOMAIN` constant and `buildRequest` helper (do not redefine them):

```typescript
  it("attributes the registration to the ambassador named in the cigibm_ref cookie", async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ id: 1 }), { status: 201 })) as typeof fetch;

    const ambassador = await db.ambassador.create({
      data: { slug: "test-plan-register-ambassador", fullName: "Ambassadeur Test", phone: "+2290100000090" },
    });

    const { POST } = await import("./route");
    const email = `referred${TEST_EMAIL_DOMAIN}`;
    const request = buildRequest({ name: "Referred Participant", phone: "0100000091", email, consent: "1" });
    request.cookies.set("cigibm_ref", ambassador.slug);

    await POST(request);

    const participant = await db.participant.findFirst({ where: { email } });
    expect(participant?.ambassadorId).toBe(ambassador.id);

    await db.ambassador.delete({ where: { id: ambassador.id } });
  });

  it("ignores an unknown or inactive ambassador slug without failing the registration", async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ id: 1 }), { status: 201 })) as typeof fetch;

    const { POST } = await import("./route");
    const email = `noref${TEST_EMAIL_DOMAIN}`;
    const request = buildRequest({ name: "No Ref Participant", phone: "0100000092", email, consent: "1" });
    request.cookies.set("cigibm_ref", "this-slug-does-not-exist");

    const response = await POST(request);

    expect(response.status).toBe(303);
    const participant = await db.participant.findFirst({ where: { email } });
    expect(participant?.ambassadorId).toBeNull();
  });

  it("does not overwrite an existing ambassador attribution on resubmission", async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ id: 1 }), { status: 201 })) as typeof fetch;

    const ambassadorA = await db.ambassador.create({
      data: { slug: "test-plan-register-ambassador-a", fullName: "Ambassadeur A", phone: "+2290100000093" },
    });
    const ambassadorB = await db.ambassador.create({
      data: { slug: "test-plan-register-ambassador-b", fullName: "Ambassadeur B", phone: "+2290100000094" },
    });

    const { POST } = await import("./route");
    const email = `resubmit-ref${TEST_EMAIL_DOMAIN}`;

    const firstRequest = buildRequest({ name: "Resubmit Participant", phone: "0100000095", email, consent: "1" });
    firstRequest.cookies.set("cigibm_ref", ambassadorA.slug);
    await POST(firstRequest);

    const secondRequest = buildRequest({ name: "Resubmit Participant", phone: "0100000095", email, consent: "1" });
    secondRequest.cookies.set("cigibm_ref", ambassadorB.slug);
    await POST(secondRequest);

    const participant = await db.participant.findFirst({ where: { email } });
    expect(participant?.ambassadorId).toBe(ambassadorA.id);

    await db.ambassador.deleteMany({ where: { id: { in: [ambassadorA.id, ambassadorB.id] } } });
  });
```

If the existing test file's `buildRequest` helper doesn't currently expose a way to attach cookies to the constructed `NextRequest`, check how it builds the request (it should be a plain `new NextRequest(url, { method: "POST", body: formData })` per the Foundation plan) — `NextRequest` instances expose a mutable `.cookies` (a `RequestCookies` object with a `.set(name, value)` method), so `request.cookies.set(...)` after construction, as used above, should work directly without needing to change the helper. If it doesn't, adapt minimally and explain why in your report.

- [ ] **Step 2: Run it, confirm it fails**

Run: `npx vitest run app/api/cigibm-register/route.test.ts`
Expected: FAIL — the three new tests fail because `ambassadorId` is never set (the field doesn't exist in the current write yet — it will resolve to `undefined`/not asserted, or the cookie is simply never read).

- [ ] **Step 3: Modify `app/api/cigibm-register/route.ts`**

Add a small resolver function near the top of the file, after `createBrevoContact`:

```typescript
async function resolveAmbassadorFromCookie(request: NextRequest): Promise<string | null> {
  const slug = request.cookies.get("cigibm_ref")?.value;
  if (!slug) return null;

  const ambassador = await db.ambassador.findUnique({ where: { slug } });
  if (!ambassador || !ambassador.active) return null;

  return ambassador.id;
}
```

Then, inside the `POST` handler, resolve the ambassador ID before the Participant write (right after the `const phone = normalizePhone(phoneRaw);` line, so it's available when the upsert runs) and pass it through:

```typescript
  const phone = normalizePhone(phoneRaw);
  const ambassadorId = await resolveAmbassadorFromCookie(request);
```

Then, inside the existing Participant-write `try` block, add `ambassadorId` to the `create` object only — **never to `update`**, so a resubmission cannot overwrite an already-attributed referral:

```typescript
      await db.participant.upsert({
        where: { editionId_email: { editionId: edition4.id, email } },
        create: {
          editionId: edition4.id,
          fullName: name,
          phone,
          email,
          consent: true,
          registrationSource: "form",
          ambassadorId,
        },
        update: {
          fullName: name,
          phone,
          consent: true,
        },
      });
```

Everything else in the file — the Brevo block, the confirmation-email block, `maxDuration`, error handling — must remain untouched.

- [ ] **Step 4: Run it, confirm it passes**

Run: `npx vitest run app/api/cigibm-register/route.test.ts`
Expected: PASS (all tests in the file, existing Foundation tests plus the 3 new ones).

- [ ] **Step 5: Run the full suite**

Run: `npx vitest run`
Expected: all PASS.

- [ ] **Step 6: Build**

Run: `npx next build`
Expected: succeeds.

- [ ] **Step 7: Verify database cleanup**

Query the live database directly (a throwaway script, deleted after) to confirm no ambassador or participant rows matching this task's test literals (`test-plan-register-ambassador*`, the test email domain) remain after the suite runs.

- [ ] **Step 8: Commit**

```bash
git add app/api/cigibm-register/route.ts app/api/cigibm-register/route.test.ts
git commit -m "feat: attribute registrations to the referring ambassador"
```

---

### Task 7: Public active-ambassador data layer

**Files:**
- Create: `lib/ambassadors/public.ts`
- Create: `lib/ambassadors/public.test.ts`

**Interfaces:**
- Consumes: `db` from `@/lib/db`.
- Produces: `type PublicAmbassador = { id: string; slug: string; fullName: string; photoUrl: string | null; bio: string | null; referredCount: number }`, `listActiveAmbassadors(): Promise<PublicAmbassador[]>` — consumed by Task 8's carousel section. Deliberately excludes `phone`, `whatsappNumber`, `email`, and `attendedCount` — none of those belong on the public site (attendance is explicitly an internal-only metric per spec §8).

- [ ] **Step 1: Write the failing test**

`lib/ambassadors/public.test.ts`:

```typescript
import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { listActiveAmbassadors } from "./public";

const TEST_SLUG_PREFIX = "test-plan-public-ambassadors";

describe("listActiveAmbassadors", () => {
  afterEach(async () => {
    await db.ambassador.deleteMany({ where: { slug: { startsWith: TEST_SLUG_PREFIX } } });
  });

  it("only returns active ambassadors, with referredCount but no contact fields", async () => {
    const active = await db.ambassador.create({
      data: { slug: `${TEST_SLUG_PREFIX}-active`, fullName: "Active Ambassador", phone: "+2290100000060", active: true },
    });
    await db.ambassador.create({
      data: { slug: `${TEST_SLUG_PREFIX}-inactive`, fullName: "Inactive Ambassador", phone: "+2290100000061", active: false },
    });

    const edition4 = await db.edition.findUniqueOrThrow({ where: { number: 4 } });
    await db.participant.create({
      data: {
        editionId: edition4.id,
        fullName: `${TEST_SLUG_PREFIX} Referred`,
        phone: "+2290100000062",
        email: `public-referred@${TEST_SLUG_PREFIX}.example`,
        registrationSource: "form",
        ambassadorId: active.id,
      },
    });

    const result = await listActiveAmbassadors();
    const found = result.find((a) => a.slug === active.slug);

    expect(found).toBeDefined();
    expect(found?.referredCount).toBeGreaterThanOrEqual(1);
    expect(result.some((a) => a.slug === `${TEST_SLUG_PREFIX}-inactive`)).toBe(false);
    expect(found).not.toHaveProperty("phone");
    expect(found).not.toHaveProperty("attendedCount");

    await db.participant.deleteMany({ where: { fullName: { startsWith: TEST_SLUG_PREFIX } } });
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `npx vitest run lib/ambassadors/public.test.ts`
Expected: FAIL — `Cannot find module './public'`.

- [ ] **Step 3: Write `lib/ambassadors/public.ts`**

```typescript
import { db } from "@/lib/db";

export type PublicAmbassador = {
  id: string;
  slug: string;
  fullName: string;
  photoUrl: string | null;
  bio: string | null;
  referredCount: number;
};

export async function listActiveAmbassadors(): Promise<PublicAmbassador[]> {
  const ambassadors = await db.ambassador.findMany({
    where: { active: true },
    include: { _count: { select: { participants: true } } },
    orderBy: { createdAt: "asc" },
  });

  return ambassadors.map((a) => ({
    id: a.id,
    slug: a.slug,
    fullName: a.fullName,
    photoUrl: a.photoUrl,
    bio: a.bio,
    referredCount: a._count.participants,
  }));
}
```

- [ ] **Step 4: Run it, confirm it passes**

Run: `npx vitest run lib/ambassadors/public.test.ts`
Expected: PASS (1 test)

- [ ] **Step 5: Run the full suite**

Run: `npx vitest run`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/ambassadors/public.ts lib/ambassadors/public.test.ts
git commit -m "feat: add public active-ambassador data layer"
```

---

### Task 8: Public ambassador carousel section

**Files:**
- Create: `components/AmbassadorSlider.tsx`
- Modify: `app/(funnel)/cigibm-2026/page.tsx`

**Interfaces:**
- Consumes: `listActiveAmbassadors()` from `@/lib/ambassadors/public` (Task 7); follows the exact scroll-snap + prev/next-button pattern already established by `components/MediaCoverageSlider.tsx` (the homepage's press-coverage section) — the spec explicitly calls for reusing this pattern, so this task adapts it rather than inventing a new carousel mechanism.

- [ ] **Step 1: Read `components/MediaCoverageSlider.tsx` and `components/ImagePlaceholder.tsx` fresh**

Confirm both still match what this task assumes: `MediaCoverageSlider` uses a `useRef` scroll track with `flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth` and two round prev/next buttons calling `track.scrollBy(...)`; `ImagePlaceholder` accepts at least a `label` prop and a `ratio` class the way it's used elsewhere on the CIGIBM page (`<ImagePlaceholder label="Affiche, CIGIBM 2026" ratio="aspect-[4/5]" />`). If either has drifted from this description, adapt this task's code to match the real current API rather than the description here.

- [ ] **Step 2: Write `components/AmbassadorSlider.tsx`**

```typescript
"use client";

import { useRef } from "react";
import Image from "next/image";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import type { PublicAmbassador } from "@/lib/ambassadors/public";

export default function AmbassadorSlider({ ambassadors }: { ambassadors: PublicAmbassador[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollBy(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector("[data-card]") as HTMLElement | null;
    const step = card ? card.offsetWidth + 24 : 300;
    track.scrollBy({ left: step * direction, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {ambassadors.map((a) => (
          <div
            key={a.id}
            data-card
            className="flex w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-ink/8 bg-mist-50 shadow-sm sm:w-[280px]"
          >
            <div className="relative aspect-square w-full overflow-hidden">
              {a.photoUrl ? (
                <Image src={a.photoUrl} alt={a.fullName} fill sizes="280px" className="object-cover" />
              ) : (
                <ImagePlaceholder label={a.fullName} ratio="aspect-square" />
              )}
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-display text-lg text-leaf-900">{a.fullName}</h3>
              {a.bio && <p className="mt-2 text-sm leading-relaxed text-ink/70">{a.bio}</p>}
              <p className="mt-3 text-xs font-semibold text-leaf-600">
                {a.referredCount} personne{a.referredCount !== 1 ? "s" : ""} inscrite{a.referredCount !== 1 ? "s" : ""} grâce à {a.fullName.split(" ")[0]}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Ambassadeur précédent"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/12 text-leaf-700 transition-colors hover:border-leaf-400 hover:bg-leaf-50"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Ambassadeur suivant"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/12 text-leaf-700 transition-colors hover:border-leaf-400 hover:bg-leaf-50"
        >
          →
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire the section into the funnel page**

In `app/(funnel)/cigibm-2026/page.tsx`, add one import:

```typescript
import AmbassadorSlider from "@/components/AmbassadorSlider";
import { listActiveAmbassadors } from "@/lib/ambassadors/public";
```

The page component needs to become able to fetch this data — it's already an `async function Cigibm2026Page(...)`, so add the fetch near the top of the function body, alongside the existing `const poster = getNamedImage(...)` line:

```typescript
  const activeAmbassadors = await listActiveAmbassadors();
```

Then insert a new section between the existing "Speakers" section (which ends with its closing `</section>`) and the "President quote" section (`<div className="bg-mist-warm">` containing `<QuoteBlock ... />`). Only render the section at all when there's at least one active ambassador — with zero ambassadors (the real state on day one), nothing renders, which is the correct behavior rather than an awkward empty-state block:

```tsx
      {/* Ambassadors */}
      {activeAmbassadors.length > 0 && (
        <section className="bg-mist-200 py-20 sm:py-24">
          <div className="mx-auto max-w-5xl px-6 sm:px-8">
            <Reveal className="text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-leaf-600">
                Programme Ambassadeurs
              </p>
              <h2 className="font-display text-3xl leading-tight text-leaf-900 sm:text-4xl">
                Ils et elles ont déjà invité leur entourage
              </h2>
            </Reveal>
            <div className="mt-10">
              <AmbassadorSlider ambassadors={activeAmbassadors} />
            </div>
          </div>
        </section>
      )}
```

Do not modify the Speakers or President-quote sections themselves, or anything else on the page beyond these additions and Task 5's earlier `ReferralCapture` addition.

- [ ] **Step 4: Build**

Run: `npx next build`
Expected: succeeds.

- [ ] **Step 5: Manual verification**

Run: `npm run dev`. Visit `/cigibm-2026` — with zero ambassadors in the database, confirm the page renders exactly as before (no empty section, no layout gap). Then, using the admin UI from Task 4, create one ambassador with a photo URL and a bio, and reload `/cigibm-2026` — confirm the new "Programme Ambassadeurs" section appears with that ambassador's card, and that visiting `/cigibm-2026?ref=<their-slug>` and completing a test registration attributes correctly (check via `/admin/participants` that the new participant's Ambassadeur column shows their name, and via `/admin/ambassadors` that their referred count increased by one).

- [ ] **Step 6: Run the full test suite one final time**

Run: `npx vitest run`
Expected: all PASS — this is the last task in the plan.

- [ ] **Step 7: Commit**

```bash
git add components/AmbassadorSlider.tsx "app/(funnel)/cigibm-2026/page.tsx"
git commit -m "feat: add public ambassador carousel section to the CIGIBM page"
```

---

## Spec sections covered by this plan

§8 (Ambassador program flow — admin CRUD, referral capture, attribution, public display) in full. §5's `Ambassador` model and `Participant.ambassadorId` were already migrated during the Foundation phase — this plan is the first to actually write and read them. §6's ambassador-attribution half of the registration-route integration point (the Participant-write half was Foundation's Task 8; QR-driven attendance updating ambassador stats is Phase 2/QR-attendance, not this plan, since stats are computed live from `Participant.attendedAt` with no separate update step required — Phase 2 only needs to keep setting `attendedAt`, which it will already do).
