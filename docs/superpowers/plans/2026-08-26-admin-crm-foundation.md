# Admin CRM Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the admin CRM's foundation — database, authentication, participants-per-édition views, and a working Email/SMS messaging system — so the team has a real, usable CRM, and so the QR-attendance and Ambassador-program plans (written separately, after this ships) have real interfaces to build against.

**Architecture:** Same Next.js 16 App Router project, new protected route group `app/(admin)/admin/...`. Supabase provides Postgres + Auth; Prisma is the ORM talking to that same Postgres database directly (not through Supabase's REST API). The existing public registration route gains a second write to this database, additive only — its existing Brevo-only behavior must keep working even if the new write fails.

**Tech Stack:** Next.js 16 (existing), Prisma + `@prisma/client`, Supabase (`@supabase/ssr`, `@supabase/supabase-js`) for Postgres + Auth, Vitest + Testing Library for tests, Brevo (existing) for Email/SMS sending.

**Spec:** `docs/superpowers/specs/2026-08-26-admin-crm-ambassador-design.md`

## Global Constraints

- Team size: 2-10 admin accounts. Two roles only: `admin` (full access) and `scanner` (scan screen only — not built in this plan, but the role must exist now so Phase 2 can use it).
- The existing `/api/cigibm-register` route's current behavior (Brevo contact + confirmation email + redirect to `/merci`) must never regress. Any new database write is additive; if it fails, log it and continue.
- SMS and Email both go through Brevo, reusing the existing `BREVO_API_KEY` env var — no new SMS vendor.
- WhatsApp is a visible-but-disabled channel option in this plan — no Business API integration yet.
- Tests that touch the database run against the real (dev) Supabase Postgres instance — there is no mocked/in-memory Postgres in this stack. Each test creates uniquely-prefixed data (e.g. emails under `@test.plan.example`) and deletes it in an `afterEach`, so runs stay isolated without needing a transactional test harness.
- Money quote from the spec, repeated here because it constrains every task: attribution/ambassador fields exist in the schema now (this plan creates the `Ambassador` model and the `ambassadorId` column) but there is no UI to manage ambassadors yet — that's the next plan.

---

## Prerequisite — blocks Task 2 onward (you do this, not the agent)

Before any task past Task 1 can run, a Supabase project must exist:

1. Go to [supabase.com](https://supabase.com) → **New Project**. Pick a region close to Bénin/Europe (e.g. Frankfurt or Paris) for latency.
2. **Project Settings → API**: copy the **Project URL** and the **`publishable` key** (not `service_role` — that one must never be used in this project).
3. **Project Settings → Database → Connection string**: copy the **Connection pooling** URI (transaction mode, port `6543`) and the **direct connection** URI (port `5432`).
4. Add four values to `.env.local` (create this file at the project root if it doesn't exist — it's already gitignored via the existing `.env*` rule):

```bash
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_xxxxx"
DATABASE_URL="postgresql://postgres.xxxxx:PASSWORD@aws-x-xx-xxxx-x.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxxx:PASSWORD@aws-x-xx-xxxx-x.pooler.supabase.com:5432/postgres"
```

5. Add the same four to the Vercel project's environment variables (Production) once the app is ready to deploy — `vercel env add NEXT_PUBLIC_SUPABASE_URL production`, etc., same pattern already used for `BREVO_API_KEY`.

Tell the implementer these four values exist in `.env.local` before starting Task 2. Task 1 does not need them.

---

### Task 1: Extract and test phone normalization, set up the test runner

This project has zero test infrastructure today. This task adds it, and proves it works using a real, useful extraction rather than a throwaway example — the phone-normalization logic currently inline in `/api/cigibm-register/route.ts`.

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `lib/phone.ts`
- Create: `lib/phone.test.ts`
- Modify: `app/api/cigibm-register/route.ts:5-13` (remove inline `normalizePhone`, import from `lib/phone.ts`)
- Modify: `package.json`

**Interfaces:**
- Produces: `normalizePhone(raw: string): string` from `lib/phone.ts`, used by every later task that needs to reach a participant/ambassador by phone.

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Write `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 3: Write `vitest.setup.ts`**

```typescript
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Add the test script to `package.json`**

In the `"scripts"` block, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Write the failing test**

`lib/phone.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it("prefixes a local Bénin number with +229", () => {
    expect(normalizePhone("0196966501")).toBe("+2290196966501");
  });

  it("leaves an already-international number untouched", () => {
    expect(normalizePhone("+2290196966501")).toBe("+2290196966501");
  });

  it("converts a 00-prefixed international number to +", () => {
    expect(normalizePhone("00229 01 68 28 06 75")).toBe("+2290168280675");
  });

  it("strips spaces, dots, dashes and parentheses before prefixing", () => {
    expect(normalizePhone("01 68-28.06(75)")).toBe("+2290168280675");
  });
});
```

- [ ] **Step 6: Run the test, confirm it fails**

Run: `npx vitest run lib/phone.test.ts`
Expected: FAIL — `Cannot find module './phone'` (the file doesn't exist yet).

- [ ] **Step 7: Create `lib/phone.ts` with the extracted logic**

```typescript
// Numéros locaux béninois saisis sans indicatif (ex. "0196966501") : on
// préfixe +229 par défaut, seul public visé par le CRM. Les numéros déjà
// internationaux (+ ou 00) sont laissés tels quels.
export function normalizePhone(raw: string): string {
  const cleaned = raw.replace(/[\s.\-()]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("00")) return `+${cleaned.slice(2)}`;
  return `+229${cleaned}`;
}
```

- [ ] **Step 8: Run the test again, confirm it passes**

Run: `npx vitest run lib/phone.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 9: Update the route to import from the new module**

In `app/api/cigibm-register/route.ts`, delete lines 5-13 (the comment and the inline `normalizePhone` function) and add this import at the top instead:

```typescript
import { normalizePhone } from "@/lib/phone";
```

- [ ] **Step 10: Confirm the site still builds**

Run: `npx next build`
Expected: succeeds, no type errors, no missing-import errors.

- [ ] **Step 11: Commit**

```bash
git add vitest.config.ts vitest.setup.ts lib/phone.ts lib/phone.test.ts app/api/cigibm-register/route.ts package.json package-lock.json
git commit -m "test: add Vitest, extract and test normalizePhone"
```

---

### Task 2: Prisma schema, migration, and Edition seed data

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `lib/db.ts`
- Create: `lib/db.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `DATABASE_URL`, `DIRECT_URL` env vars (from the prerequisite above).
- Produces: `db` (a `PrismaClient` singleton) from `lib/db.ts`, imported by every later task that touches the database. Produces the `Edition`, `Ambassador`, `Participant`, `AdminProfile`, `MessagingLog` tables and the `AdminRole`, `RegistrationSource`, `MessageChannel`, `MessageStatus` enums, exactly as specified in the design doc §5.

- [ ] **Step 1: Install Prisma**

```bash
npm install prisma @prisma/client
npm install -D tsx
```

(`tsx` runs the TypeScript seed script directly, no separate build step.)

- [ ] **Step 2: Add Prisma scripts to `package.json`**

```json
"db:generate": "prisma generate",
"db:migrate": "prisma migrate dev",
"db:seed": "tsx prisma/seed.ts",
"db:studio": "prisma studio"
```

Also add this block at the top level of `package.json` (Prisma reads it to find the seed command):

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 3: Write `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum AdminRole {
  admin
  scanner
}

enum RegistrationSource {
  form
  qr_walkin
  admin_manual
}

enum MessageChannel {
  email
  sms
  whatsapp
}

enum MessageStatus {
  queued
  sent
  failed
}

model Edition {
  id                 Int           @id @default(autoincrement())
  number             Int           @unique
  theme              String
  dates              String
  venue              String
  hasParticipantData Boolean       @default(false)
  participants       Participant[]
  createdAt          DateTime      @default(now())
}

model Ambassador {
  id             String        @id @default(uuid())
  slug           String        @unique
  fullName       String
  phone          String
  whatsappNumber String?
  email          String?
  photoUrl       String?
  bio            String?
  active         Boolean       @default(true)
  participants   Participant[]
  createdAt      DateTime      @default(now())
}

model Participant {
  id                 String             @id @default(uuid())
  editionId          Int
  edition            Edition            @relation(fields: [editionId], references: [id])

  fullName           String
  phone              String
  email              String?
  consent            Boolean            @default(false)

  attendanceToken    String             @unique @default(cuid())
  registrationSource RegistrationSource

  ambassadorId       String?
  ambassador         Ambassador?        @relation(fields: [ambassadorId], references: [id])

  attendedAt         DateTime?
  checkedInByAdminId String?

  registeredAt       DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  @@index([editionId])
  @@index([ambassadorId])
}

model AdminProfile {
  id         String    @id
  fullName   String
  role       AdminRole @default(scanner)
  testBypass Boolean   @default(false)
  createdAt  DateTime  @default(now())
}

model MessagingLog {
  id                String         @id @default(uuid())
  channel           MessageChannel
  recipientPhone    String?
  recipientEmail    String?
  participantId     String?
  subject           String?
  status            MessageStatus  @default(queued)
  providerMessageId String?
  errorMessage      String?
  batchId           String?
  batchLabel        String?
  sentByAdminId     String?
  sentAt            DateTime       @default(now())

  @@index([participantId])
  @@index([batchId])
}
```

- [ ] **Step 4: Run the first migration**

Run: `npx prisma migrate dev --name init`
Expected: creates `prisma/migrations/<timestamp>_init/migration.sql`, applies it to the Supabase database, prints "Your database is now in sync with your schema."

If this fails with a connection error, stop and confirm `DATABASE_URL`/`DIRECT_URL` in `.env.local` match exactly what Supabase's dashboard shows (a wrong password is the most common cause).

- [ ] **Step 5: Write `lib/db.ts` (Prisma client singleton)**

Next.js hot-reloads modules in dev, which would otherwise create a new `PrismaClient` (and a new DB connection pool) on every file save. This is the standard fix:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
```

- [ ] **Step 6: Write the failing test for the seed script**

`lib/db.test.ts`:

```typescript
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "./db";

describe("database connection and Edition seed", () => {
  beforeAll(async () => {
    // The seed script is idempotent (upsert by `number`), safe to run again here.
    const { seedEditions } = await import("../prisma/seed");
    await seedEditions();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("connects and returns exactly 4 éditions", async () => {
    const editions = await db.edition.findMany({ orderBy: { number: "asc" } });
    expect(editions).toHaveLength(4);
  });

  it("marks éditions 1-3 as having no participant data, and édition 4 as having it", async () => {
    const editions = await db.edition.findMany({ orderBy: { number: "asc" } });
    expect(editions.map((e) => e.hasParticipantData)).toEqual([false, false, false, true]);
  });

  it("stores the real théme/dates/venue for the 4th édition", async () => {
    const edition4 = await db.edition.findUniqueOrThrow({ where: { number: 4 } });
    expect(edition4.theme).toBe("Le vaccin de la dépression");
    expect(edition4.dates).toBe("17 et 18 octobre 2026");
  });
});
```

- [ ] **Step 7: Run it, confirm it fails**

Run: `npx vitest run lib/db.test.ts`
Expected: FAIL — `seedEditions is not a function` or similar (the seed script doesn't exist yet).

- [ ] **Step 8: Write `prisma/seed.ts`**

Values below match the real édition data already in `lib/content.ts` (`cigibm.pastEditions` and `cigibm.nextEdition`) — copied here rather than imported, since this file must also be runnable standalone by `prisma migrate reset`.

```typescript
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

export async function seedEditions() {
  const editions = [
    { number: 1, theme: "La dépression, parlons-en", dates: "29 mars 2023", venue: "Very Nice Hôtel", hasParticipantData: false },
    { number: 2, theme: "Réinvente-toi", dates: "27 avril 2024", venue: "Lucide Palace, Godomey", hasParticipantData: false },
    { number: 3, theme: "Équilibre", dates: "29-30 novembre 2025", venue: "Godomey puis Cotonou", hasParticipantData: false },
    { number: 4, theme: "Le vaccin de la dépression", dates: "17 et 18 octobre 2026", venue: "Palais des Congrès de Cotonou", hasParticipantData: true },
  ];

  for (const edition of editions) {
    await db.edition.upsert({
      where: { number: edition.number },
      update: edition,
      create: edition,
    });
  }
}

async function main() {
  await seedEditions();
  console.log("Seeded 4 éditions.");
}

// Only run automatically when executed directly (via `npm run db:seed`),
// not when imported by a test.
if (require.main === module) {
  main()
    .then(() => db.$disconnect())
    .catch(async (err) => {
      console.error(err);
      await db.$disconnect();
      process.exit(1);
    });
}
```

- [ ] **Step 9: Run the test again, confirm it passes**

Run: `npx vitest run lib/db.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 10: Commit**

```bash
git add prisma/ lib/db.ts lib/db.test.ts package.json package-lock.json
git commit -m "feat: add Prisma schema, migration, and Edition seed"
```

---

### Task 3: Supabase Auth clients and session-refresh middleware

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `middleware.ts`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` env vars.
- Produces: `createClient()` (browser) from `lib/supabase/client.ts`, `createClient()` (server, async) from `lib/supabase/server.ts` — both used by Task 5's `requireAdmin()` and the login page.

This task has no automated test — it's Supabase's own documented SSR wiring, and the meaningful verification is manual (Step 5). Task 5 (login) is where this gets exercised by a real test.

- [ ] **Step 1: Install the Supabase packages**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Write the browser client, `lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
```

- [ ] **Step 3: Write the server client, `lib/supabase/server.ts`**

Server Components can read cookies but not write them (only Route Handlers, Server Actions, and Middleware can) — this client tolerates that by catching the write and letting `middleware.ts` (next step) be the thing that actually persists refreshed sessions.

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — middleware.ts refreshes
            // the session on the next request instead. Safe to ignore.
          }
        },
      },
    }
  );
}
```

- [ ] **Step 4: Write `middleware.ts` at the project root**

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Touches the session so expired tokens get refreshed and the new
  // cookies are attached to the response, on every request that matches.
  await supabase.auth.getClaims();

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

- [ ] **Step 5: Manual verification**

Run: `npm run dev`, visit `http://localhost:3000/admin` (this route doesn't exist yet, a 404 is fine). In the browser devtools Network tab, confirm the request to `/admin` completes with no 500 error and no error logged in the terminal — this proves the middleware runs without crashing before any admin pages exist to actually test against.

- [ ] **Step 6: Commit**

```bash
git add lib/supabase/ middleware.ts package.json package-lock.json
git commit -m "feat: add Supabase Auth clients and session-refresh middleware"
```

---

### Task 4: AdminProfile auto-provisioning trigger

New Supabase Auth users need a matching `AdminProfile` row (role defaults to the least-privileged `scanner`). This is a Postgres trigger, applied as a raw-SQL Prisma migration, so it fires no matter how the user was created (dashboard invite, magic link, etc.) without the app having to remember to do it.

**Files:**
- Create: `prisma/migrations/<timestamp>_admin_profile_trigger/migration.sql`
- Test: `lib/db.test.ts` (extended)

**Interfaces:**
- Consumes: `AdminProfile` model (Task 2).
- Produces: guarantees every row in Supabase's `auth.users` has a matching `AdminProfile` row — Task 5's `requireAdmin()` relies on this never being null for a logged-in user.

- [ ] **Step 1: Create an empty migration to hand-edit**

Run: `npx prisma migrate dev --create-only --name admin_profile_trigger`
Expected: creates an empty `prisma/migrations/<timestamp>_admin_profile_trigger/migration.sql`.

- [ ] **Step 2: Write the trigger SQL into that file**

```sql
-- Chaque nouvel utilisateur Supabase Auth reçoit automatiquement une ligne
-- AdminProfile (rôle "scanner" par défaut) : le trigger tourne côté
-- Postgres, donc il s'applique peu importe comment le compte a été créé
-- (invitation dashboard, lien magique, etc.).
create or replace function public.handle_new_admin_user()
returns trigger as $$
begin
  insert into public."AdminProfile" (id, "fullName", role, "testBypass", "createdAt")
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'scanner',
    false,
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_admin_user();
```

- [ ] **Step 3: Apply the migration**

Run: `npx prisma migrate dev`
Expected: applies the trigger, no errors.

- [ ] **Step 4: Write the failing test**

Append to `lib/db.test.ts`:

```typescript
describe("AdminProfile auto-provisioning trigger", () => {
  const testUserId = "00000000-0000-0000-0000-000000000001";

  afterAll(async () => {
    await db.adminProfile.deleteMany({ where: { id: testUserId } });
    await db.$executeRawUnsafe(`delete from auth.users where id = '${testUserId}'`);
  });

  it("creates an AdminProfile row when a new auth.users row is inserted", async () => {
    await db.$executeRawUnsafe(`
      insert into auth.users (id, email, raw_user_meta_data)
      values ('${testUserId}', 'trigger-test@test.plan.example', '{"full_name": "Trigger Test"}'::jsonb)
    `);

    const profile = await db.adminProfile.findUnique({ where: { id: testUserId } });
    expect(profile).not.toBeNull();
    expect(profile?.fullName).toBe("Trigger Test");
    expect(profile?.role).toBe("scanner");
  });
});
```

- [ ] **Step 5: Run it, confirm it fails**

Run: `npx vitest run lib/db.test.ts`
Expected: FAIL if the trigger isn't applied yet in this environment, or PASS if Step 3 already ran successfully — if it already passes, that's fine, it means Steps 1-3 worked; skip to Step 6.

- [ ] **Step 6: Run it again to confirm it's green**

Run: `npx vitest run lib/db.test.ts`
Expected: PASS (all tests in the file, including this new one)

- [ ] **Step 7: Commit**

```bash
git add prisma/migrations/ lib/db.test.ts
git commit -m "feat: auto-create AdminProfile on new Supabase Auth user"
```

---

### Task 5: Admin auth helper and login page

**Files:**
- Create: `lib/admin/auth.ts`
- Create: `lib/admin/auth.test.ts`
- Create: `app/(admin)/admin/login/page.tsx`
- Create: `app/(admin)/admin/login/LoginForm.tsx`
- Create: `app/(admin)/admin/login/LoginForm.test.tsx`

**Interfaces:**
- Consumes: `createClient()` from `lib/supabase/server.ts` (Task 3), `AdminProfile` (Task 2).
- Produces: `type AdminSession = { id: string; fullName: string; role: "admin" | "scanner" }`, `getAdminSession(): Promise<AdminSession | null>`, `requireAdmin(): Promise<AdminSession>` (redirects to `/admin/login` if not signed in) — every later admin page/layout imports `requireAdmin` from `lib/admin/auth.ts`.

- [ ] **Step 1: Write the failing test for the auth helper**

`lib/admin/auth.test.ts`:

```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockGetClaims = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: mockGetClaims },
  }),
}));

const mockFindUnique = vi.fn();
vi.mock("@/lib/db", () => ({
  db: { adminProfile: { findUnique: (...args: unknown[]) => mockFindUnique(...args) } },
}));

import { getAdminSession } from "./auth";

describe("getAdminSession", () => {
  beforeEach(() => {
    mockGetClaims.mockReset();
    mockFindUnique.mockReset();
  });

  it("returns null when there is no logged-in Supabase user", async () => {
    mockGetClaims.mockResolvedValue({ data: { claims: null }, error: null });

    const session = await getAdminSession();

    expect(session).toBeNull();
  });

  it("returns the matching AdminProfile fields when a session exists", async () => {
    mockGetClaims.mockResolvedValue({ data: { claims: { sub: "user-123" } }, error: null });
    mockFindUnique.mockResolvedValue({ id: "user-123", fullName: "Christelle", role: "admin" });

    const session = await getAdminSession();

    expect(session).toEqual({ id: "user-123", fullName: "Christelle", role: "admin" });
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: "user-123" } });
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `npx vitest run lib/admin/auth.test.ts`
Expected: FAIL — `Cannot find module './auth'`.

- [ ] **Step 3: Write `lib/admin/auth.ts`**

```typescript
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export type AdminSession = {
  id: string;
  fullName: string;
  role: "admin" | "scanner";
};

export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const profile = await db.adminProfile.findUnique({ where: { id: userId } });
  if (!profile) return null;

  return { id: profile.id, fullName: profile.fullName, role: profile.role };
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}
```

- [ ] **Step 4: Run it, confirm it passes**

Run: `npx vitest run lib/admin/auth.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Write the failing test for the login form component**

`app/(admin)/admin/login/LoginForm.test.tsx`:

```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockSignIn = vi.fn();
const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signInWithPassword: mockSignIn } }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

import LoginForm from "./LoginForm";

describe("LoginForm", () => {
  beforeEach(() => {
    mockSignIn.mockReset();
    mockPush.mockReset();
    mockRefresh.mockReset();
  });

  it("shows an error message when sign-in fails", async () => {
    mockSignIn.mockResolvedValue({ error: { message: "Invalid login credentials" } });
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/mot de passe/i), "wrongpassword");
    fireEvent.click(screen.getByRole("button", { name: /se connecter/i }));

    expect(await screen.findByText(/identifiants incorrects/i)).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("redirects to /admin on successful sign-in", async () => {
    mockSignIn.mockResolvedValue({ error: null });
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/mot de passe/i), "correctpassword");
    fireEvent.click(screen.getByRole("button", { name: /se connecter/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/admin"));
    expect(mockRefresh).toHaveBeenCalled();
  });
});
```

- [ ] **Step 6: Run it, confirm it fails**

Run: `npx vitest run app/\(admin\)/admin/login/LoginForm.test.tsx`
Expected: FAIL — `Cannot find module './LoginForm'`.

- [ ] **Step 7: Write `app/(admin)/admin/login/LoginForm.tsx`**

```typescript
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (signInError) {
      setError("Identifiants incorrects. Vérifiez votre email et mot de passe.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm outline-none focus:border-leaf-500"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm outline-none focus:border-leaf-500"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-leaf-600 px-6 py-3 text-sm font-semibold text-mist-50 transition-colors hover:bg-leaf-700 disabled:opacity-60"
      >
        {loading ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
```

- [ ] **Step 8: Run it, confirm it passes**

Run: `npx vitest run app/\(admin\)/admin/login/LoginForm.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 9: Write `app/(admin)/admin/login/page.tsx`**

```typescript
import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Connexion, Admin",
  robots: { index: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-mist-100 px-6">
      <div className="w-full max-w-sm rounded-2xl border border-ink/8 bg-mist-50 p-8 shadow-sm">
        <h1 className="font-display text-2xl text-leaf-900">Espace admin</h1>
        <p className="mt-1 text-sm text-ink/60">ONG Triomphe de l&apos;Intérieur</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 10: Commit**

```bash
git add lib/admin/ "app/(admin)/admin/login/"
git commit -m "feat: add admin auth helper and login page"
```

---

### Task 6: Protected admin layout and dashboard

**Files:**
- Create: `app/(admin)/admin/(protected)/layout.tsx`
- Create: `app/(admin)/admin/(protected)/page.tsx`
- Create: `lib/admin/dashboard.ts`
- Create: `lib/admin/dashboard.test.ts`

**Interfaces:**
- Consumes: `requireAdmin()` (Task 5), `db` (Task 2).
- Produces: `getDashboardStats(): Promise<{ totalParticipants: number; participantsByEdition: { editionNumber: number; count: number }[]; attendedToday: number }>` from `lib/admin/dashboard.ts`.

- [ ] **Step 1: Write the failing test**

`lib/admin/dashboard.test.ts`:

```typescript
import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getDashboardStats } from "./dashboard";

const TEST_EMAIL_DOMAIN = "@test.plan.example";

describe("getDashboardStats", () => {
  afterEach(async () => {
    await db.participant.deleteMany({ where: { email: { endsWith: TEST_EMAIL_DOMAIN } } });
  });

  it("counts participants per édition and total", async () => {
    const edition4 = await db.edition.findUniqueOrThrow({ where: { number: 4 } });

    await db.participant.createMany({
      data: [
        { editionId: edition4.id, fullName: "A", phone: "+2290100000001", email: `a${TEST_EMAIL_DOMAIN}`, registrationSource: "form" },
        { editionId: edition4.id, fullName: "B", phone: "+2290100000002", email: `b${TEST_EMAIL_DOMAIN}`, registrationSource: "form" },
      ],
    });

    const stats = await getDashboardStats();

    const edition4Stats = stats.participantsByEdition.find((e) => e.editionNumber === 4);
    expect(edition4Stats?.count).toBeGreaterThanOrEqual(2);
    expect(stats.totalParticipants).toBeGreaterThanOrEqual(2);
  });

  it("counts today's attendance separately from total registrations", async () => {
    const edition4 = await db.edition.findUniqueOrThrow({ where: { number: 4 } });

    await db.participant.create({
      data: {
        editionId: edition4.id,
        fullName: "Attended Today",
        phone: "+2290100000003",
        email: `c${TEST_EMAIL_DOMAIN}`,
        registrationSource: "form",
        attendedAt: new Date(),
      },
    });

    const stats = await getDashboardStats();

    expect(stats.attendedToday).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `npx vitest run lib/admin/dashboard.test.ts`
Expected: FAIL — `Cannot find module './dashboard'`.

- [ ] **Step 3: Write `lib/admin/dashboard.ts`**

```typescript
import { db } from "@/lib/db";

export async function getDashboardStats() {
  const editions = await db.edition.findMany({
    include: { _count: { select: { participants: true } } },
    orderBy: { number: "asc" },
  });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const attendedToday = await db.participant.count({
    where: { attendedAt: { gte: startOfToday } },
  });

  const totalParticipants = editions.reduce((sum, e) => sum + e._count.participants, 0);

  return {
    totalParticipants,
    participantsByEdition: editions.map((e) => ({ editionNumber: e.number, count: e._count.participants })),
    attendedToday,
  };
}
```

- [ ] **Step 4: Run it, confirm it passes**

Run: `npx vitest run lib/admin/dashboard.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Write the protected layout**

`app/(admin)/admin/(protected)/layout.tsx`:

```typescript
import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

const navItems = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/participants", label: "Participants" },
  { href: "/admin/messages", label: "Messages" },
];

export default async function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  return (
    <div className="flex min-h-screen bg-mist-100">
      <aside className="w-56 shrink-0 border-r border-ink/8 bg-mist-50 p-6">
        <p className="font-display text-lg text-leaf-900">Admin CIGIBM</p>
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-ink/75 transition-colors hover:bg-leaf-50 hover:text-leaf-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-10 border-t border-ink/8 pt-4 text-xs text-ink/50">
          <p>{session.fullName}</p>
          <p className="uppercase tracking-wide">{session.role}</p>
          <form action={signOut} className="mt-3">
            <button type="submit" className="text-leaf-700 underline underline-offset-2">
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 6: Write the dashboard page**

`app/(admin)/admin/(protected)/page.tsx`:

```typescript
import { getDashboardStats } from "@/lib/admin/dashboard";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div>
      <h1 className="font-display text-2xl text-leaf-900">Tableau de bord</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink/8 bg-mist-50 p-6">
          <p className="text-xs uppercase tracking-wide text-ink/50">Participants au total</p>
          <p className="mt-2 font-display text-3xl text-leaf-900">{stats.totalParticipants}</p>
        </div>
        <div className="rounded-2xl border border-ink/8 bg-mist-50 p-6">
          <p className="text-xs uppercase tracking-wide text-ink/50">Présents aujourd&apos;hui</p>
          <p className="mt-2 font-display text-3xl text-leaf-900">{stats.attendedToday}</p>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/60">Par édition</h2>
        <ul className="mt-3 space-y-2">
          {stats.participantsByEdition.map((e) => (
            <li key={e.editionNumber} className="flex justify-between rounded-xl border border-ink/8 bg-mist-50 px-4 py-3 text-sm">
              <span>Édition {e.editionNumber}</span>
              <span className="font-semibold">{e.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Manual verification**

Run: `npm run dev`. Visit `http://localhost:3000/admin` — expect a redirect to `/admin/login` (no session yet). This confirms `requireAdmin()` and the middleware matcher both work together.

- [ ] **Step 8: Commit**

```bash
git add "app/(admin)/admin/(protected)/" lib/admin/dashboard.ts lib/admin/dashboard.test.ts
git commit -m "feat: add protected admin layout and dashboard"
```

---

### Task 7: Participants-per-édition view

**Files:**
- Create: `lib/admin/participants.ts`
- Create: `lib/admin/participants.test.ts`
- Create: `app/(admin)/admin/(protected)/participants/page.tsx`

**Interfaces:**
- Consumes: `db` (Task 2).
- Produces: `getParticipantsForEdition(editionNumber: number): Promise<{ available: false } | { available: true; edition: { theme: string }; participants: ParticipantRow[] }>`, where `ParticipantRow = { id: string; fullName: string; phone: string; email: string | null; registeredAt: Date; attendedAt: Date | null; ambassadorName: string | null }`.

- [ ] **Step 1: Write the failing test**

`lib/admin/participants.test.ts`:

```typescript
import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getParticipantsForEdition } from "./participants";

const TEST_EMAIL_DOMAIN = "@test.plan.example";

describe("getParticipantsForEdition", () => {
  afterEach(async () => {
    await db.participant.deleteMany({ where: { email: { endsWith: TEST_EMAIL_DOMAIN } } });
  });

  it("reports unavailable data for éditions 1-3", async () => {
    const result = await getParticipantsForEdition(2);
    expect(result).toEqual({ available: false });
  });

  it("returns the participant list for édition 4", async () => {
    const edition4 = await db.edition.findUniqueOrThrow({ where: { number: 4 } });
    await db.participant.create({
      data: {
        editionId: edition4.id,
        fullName: "Test Participant",
        phone: "+2290100000099",
        email: `p${TEST_EMAIL_DOMAIN}`,
        registrationSource: "form",
      },
    });

    const result = await getParticipantsForEdition(4);

    expect(result.available).toBe(true);
    if (result.available) {
      expect(result.edition.theme).toBe("Le vaccin de la dépression");
      expect(result.participants.some((p) => p.fullName === "Test Participant")).toBe(true);
    }
  });

  it("throws for a non-existent édition number", async () => {
    await expect(getParticipantsForEdition(99)).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `npx vitest run lib/admin/participants.test.ts`
Expected: FAIL — `Cannot find module './participants'`.

- [ ] **Step 3: Write `lib/admin/participants.ts`**

```typescript
import { db } from "@/lib/db";

export type ParticipantRow = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  registeredAt: Date;
  attendedAt: Date | null;
  ambassadorName: string | null;
};

export async function getParticipantsForEdition(
  editionNumber: number
): Promise<{ available: false } | { available: true; edition: { theme: string }; participants: ParticipantRow[] }> {
  const edition = await db.edition.findUniqueOrThrow({ where: { number: editionNumber } });

  if (!edition.hasParticipantData) {
    return { available: false };
  }

  const participants = await db.participant.findMany({
    where: { editionId: edition.id },
    include: { ambassador: { select: { fullName: true } } },
    orderBy: { registeredAt: "desc" },
  });

  return {
    available: true,
    edition: { theme: edition.theme },
    participants: participants.map((p) => ({
      id: p.id,
      fullName: p.fullName,
      phone: p.phone,
      email: p.email,
      registeredAt: p.registeredAt,
      attendedAt: p.attendedAt,
      ambassadorName: p.ambassador?.fullName ?? null,
    })),
  };
}
```

- [ ] **Step 4: Run it, confirm it passes**

Run: `npx vitest run lib/admin/participants.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Write the participants page**

`app/(admin)/admin/(protected)/participants/page.tsx`:

```typescript
import { getParticipantsForEdition } from "@/lib/admin/participants";

const EDITIONS = [1, 2, 3, 4];

export default async function ParticipantsPage({
  searchParams,
}: {
  searchParams: Promise<{ edition?: string }>;
}) {
  const { edition } = await searchParams;
  const editionNumber = Number(edition) || 4;
  const result = await getParticipantsForEdition(editionNumber);

  return (
    <div>
      <h1 className="font-display text-2xl text-leaf-900">Participants</h1>
      <div className="mt-4 flex gap-2">
        {EDITIONS.map((n) => (
          <a
            key={n}
            href={`/admin/participants?edition=${n}`}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              n === editionNumber ? "border-leaf-600 bg-leaf-600 text-mist-50" : "border-ink/15 text-ink/70"
            }`}
          >
            Édition {n}
          </a>
        ))}
      </div>

      <div className="mt-6">
        {!result.available ? (
          <p className="rounded-xl border border-ink/8 bg-mist-50 p-6 text-sm text-ink/60">
            Données non disponibles pour cette édition.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-ink/8">
            <table className="w-full text-sm">
              <thead className="bg-mist-50 text-left text-xs uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="px-4 py-3">Nom</th>
                  <th className="px-4 py-3">Téléphone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Ambassadeur</th>
                  <th className="px-4 py-3">Présence</th>
                </tr>
              </thead>
              <tbody>
                {result.participants.map((p) => (
                  <tr key={p.id} className="border-t border-ink/8">
                    <td className="px-4 py-3">{p.fullName}</td>
                    <td className="px-4 py-3">{p.phone}</td>
                    <td className="px-4 py-3">{p.email ?? "—"}</td>
                    <td className="px-4 py-3">{p.ambassadorName ?? "—"}</td>
                    <td className="px-4 py-3">{p.attendedAt ? "Présent·e" : "—"}</td>
                  </tr>
                ))}
                {result.participants.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-ink/50">
                      Aucun participant pour l&apos;instant.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/admin/participants.ts lib/admin/participants.test.ts "app/(admin)/admin/(protected)/participants/"
git commit -m "feat: add participants-per-édition admin view"
```

---

### Task 8: Wire `/api/cigibm-register` to also create a Participant

This is the task with the tightest constraint in the whole plan: the existing Brevo-only behavior must survive even if this new write throws.

**Files:**
- Modify: `app/api/cigibm-register/route.ts`
- Create: `app/api/cigibm-register/route.test.ts`

**Interfaces:**
- Consumes: `db` (Task 2), `normalizePhone` (Task 1).
- Produces: nothing new consumed by later tasks in this plan, but the Ambassador plan will extend this same route to also read the referral cookie.

- [ ] **Step 1: Write the failing test**

`app/api/cigibm-register/route.test.ts`:

```typescript
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

vi.stubEnv("BREVO_API_KEY", "test-key");

const TEST_EMAIL_DOMAIN = "@test.plan.example";

function buildRequest(fields: Record<string, string>) {
  const formData = new FormData();
  Object.entries(fields).forEach(([k, v]) => formData.append(k, v));
  return new NextRequest("http://localhost:3000/api/cigibm-register", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/cigibm-register", () => {
  afterEach(async () => {
    await db.participant.deleteMany({ where: { email: { endsWith: TEST_EMAIL_DOMAIN } } });
    vi.restoreAllMocks();
  });

  it("creates a Participant row tied to édition 4 on successful registration", async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ id: 1 }), { status: 201 })) as typeof fetch;

    const { POST } = await import("./route");
    const email = `newparticipant${TEST_EMAIL_DOMAIN}`;
    await POST(buildRequest({ name: "New Participant", phone: "0100000010", email, consent: "1" }));

    const edition4 = await db.edition.findUniqueOrThrow({ where: { number: 4 } });
    const participant = await db.participant.findFirst({ where: { email } });

    expect(participant).not.toBeNull();
    expect(participant?.editionId).toBe(edition4.id);
    expect(participant?.registrationSource).toBe("form");
    expect(participant?.phone).toBe("+2290100000010");
  });

  it("still redirects to /merci even when the Participant write fails", async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ id: 1 }), { status: 201 })) as typeof fetch;
    vi.spyOn(db.participant, "create").mockRejectedValueOnce(new Error("DB is down"));

    const { POST } = await import("./route");
    const response = await POST(
      buildRequest({ name: "Resilience Test", phone: "0100000011", email: `resilient${TEST_EMAIL_DOMAIN}`, consent: "1" })
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/cigibm-2026/merci");
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `npx vitest run app/api/cigibm-register/route.test.ts`
Expected: FAIL — no `Participant` row gets created yet, first test fails.

- [ ] **Step 3: Modify `app/api/cigibm-register/route.ts`**

Add the import and the new write. Insert this block right after the existing Brevo `try`/`catch` (after line 85, `}`) and before the confirmation-email `try` block:

```typescript
import { db } from "@/lib/db";
```

(add near the top, alongside the existing imports)

```typescript
  // Deuxième écriture, additive : la CRM a besoin d'un Participant en base,
  // mais un échec ici ne doit jamais faire échouer l'inscription elle-même
  // (Brevo reste la preuve d'inscription tant que ce n'est pas le cas).
  try {
    const edition4 = await db.edition.findUnique({ where: { number: 4 } });
    if (edition4) {
      await db.participant.create({
        data: {
          editionId: edition4.id,
          fullName: name,
          phone,
          email,
          consent: true,
          registrationSource: "form",
        },
      });
    } else {
      console.error("Edition 4 not found, skipping Participant creation");
    }
  } catch (err) {
    console.error("Participant creation failed", err);
  }
```

(insert this block right before the `// L'envoi de l'email de confirmation...` comment)

- [ ] **Step 4: Run it, confirm it passes**

Run: `npx vitest run app/api/cigibm-register/route.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Run the full existing test suite to confirm nothing else broke**

Run: `npx vitest run`
Expected: all tests across the project PASS.

- [ ] **Step 6: Commit**

```bash
git add app/api/cigibm-register/
git commit -m "feat: create a Participant row on registration, resiliently"
```

---

### Task 9: Messaging log + SMS sending

**Files:**
- Create: `lib/messaging/log.ts`
- Create: `lib/messaging/log.test.ts`
- Create: `lib/messaging/sms.ts`
- Create: `lib/messaging/sms.test.ts`
- Modify: `lib/email.ts` (add logging to `sendTransactionalEmail` — see Step 7)

**Interfaces:**
- Consumes: `db` (Task 2).
- Produces: `logMessage(entry: { channel: "email" | "sms" | "whatsapp"; recipientPhone?: string; recipientEmail?: string; participantId?: string; subject?: string; status: "sent" | "failed"; providerMessageId?: string; errorMessage?: string; batchId?: string; batchLabel?: string; sentByAdminId?: string }): Promise<void>` from `lib/messaging/log.ts`. Produces `sendSms(to: string, text: string): Promise<{ ok: boolean; providerMessageId?: string; error?: string }>` from `lib/messaging/sms.ts`.

- [ ] **Step 1: Write the failing test for the logger**

`lib/messaging/log.test.ts`:

```typescript
import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { logMessage } from "./log";

describe("logMessage", () => {
  afterEach(async () => {
    await db.messagingLog.deleteMany({ where: { subject: "test-subject-log" } });
  });

  it("writes a MessagingLog row with the given fields", async () => {
    await logMessage({
      channel: "email",
      recipientEmail: "log-test@test.plan.example",
      subject: "test-subject-log",
      status: "sent",
      providerMessageId: "msg-123",
    });

    const row = await db.messagingLog.findFirst({ where: { subject: "test-subject-log" } });
    expect(row).not.toBeNull();
    expect(row?.channel).toBe("email");
    expect(row?.status).toBe("sent");
    expect(row?.providerMessageId).toBe("msg-123");
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `npx vitest run lib/messaging/log.test.ts`
Expected: FAIL — `Cannot find module './log'`.

- [ ] **Step 3: Write `lib/messaging/log.ts`**

```typescript
import { db } from "@/lib/db";
import type { MessageChannel, MessageStatus } from "@prisma/client";

export async function logMessage(entry: {
  channel: MessageChannel;
  recipientPhone?: string;
  recipientEmail?: string;
  participantId?: string;
  subject?: string;
  status: MessageStatus;
  providerMessageId?: string;
  errorMessage?: string;
  batchId?: string;
  batchLabel?: string;
  sentByAdminId?: string;
}): Promise<void> {
  await db.messagingLog.create({ data: entry });
}
```

- [ ] **Step 4: Run it, confirm it passes**

Run: `npx vitest run lib/messaging/log.test.ts`
Expected: PASS (1 test)

- [ ] **Step 5: Write the failing test for SMS sending**

`lib/messaging/sms.test.ts`:

```typescript
import { describe, expect, it, vi, afterEach } from "vitest";
import { sendSms } from "./sms";

describe("sendSms", () => {
  afterEach(() => vi.restoreAllMocks());

  it("calls Brevo's transactional SMS endpoint and returns the message id on success", async () => {
    global.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ reference: "sms-ref-1" }), { status: 201 })
    ) as typeof fetch;

    const result = await sendSms("+2290100000001", "Test message");

    expect(result.ok).toBe(true);
    expect(result.providerMessageId).toBe("sms-ref-1");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.brevo.com/v3/transactionalSMS/sms",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("returns ok: false with the error message when Brevo rejects the send", async () => {
    global.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ message: "Invalid sender" }), { status: 400 })
    ) as typeof fetch;

    const result = await sendSms("+2290100000001", "Test message");

    expect(result.ok).toBe(false);
    expect(result.error).toContain("Invalid sender");
  });
});
```

- [ ] **Step 6: Run it, confirm it fails**

Run: `npx vitest run lib/messaging/sms.test.ts`
Expected: FAIL — `Cannot find module './sms'`.

- [ ] **Step 7: Write `lib/messaging/sms.ts`**

```typescript
export async function sendSms(
  to: string,
  text: string
): Promise<{ ok: boolean; providerMessageId?: string; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "BREVO_API_KEY is not configured" };
  }

  const res = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: "TriompheI",
      recipient: to,
      content: text,
      type: "transactional",
    }),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    return { ok: false, error: body?.message ?? `Brevo SMS failed with status ${res.status}` };
  }

  return { ok: true, providerMessageId: body?.reference };
}
```

- [ ] **Step 8: Run it, confirm it passes**

Run: `npx vitest run lib/messaging/sms.test.ts`
Expected: PASS (2 tests)

**Note for the implementer:** the `sender: "TriompheI"` value is a placeholder alphanumeric sender ID (max 11 characters, Brevo's SMS requirement) — confirm with Brevo's dashboard (Senders → SMS) whether this needs to be pre-registered before it will actually deliver to +229 numbers, and adjust if Brevo requires something else. This is the "confirm Brevo SMS delivers to Bénin numbers" item flagged in the spec.

- [ ] **Step 9: Add logging to the existing email sender**

In `lib/email.ts`, import the logger:

```typescript
import { logMessage } from "./messaging/log";
```

Then wrap the existing `sendTransactionalEmail` function body (lines 150-181) so it logs after sending. Replace the function with:

```typescript
export async function sendTransactionalEmail(
  apiKey: string,
  to: { email: string; name?: string },
  message: { subject: string; html: string },
  meta?: { participantId?: string; batchId?: string; batchLabel?: string; sentByAdminId?: string }
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
    const body = await res.clone().text().catch(() => "");
    console.warn("Primary sender failed, retrying with fallback", res.status, body);
    res = await attempt(FALLBACK_SENDER);
  }

  const responseBody = await res.clone().json().catch(() => null);

  await logMessage({
    channel: "email",
    recipientEmail: to.email,
    subject: message.subject,
    status: res.ok ? "sent" : "failed",
    providerMessageId: responseBody?.messageId,
    errorMessage: res.ok ? undefined : await res.clone().text().catch(() => "unknown error"),
    participantId: meta?.participantId,
    batchId: meta?.batchId,
    batchLabel: meta?.batchLabel,
    sentByAdminId: meta?.sentByAdminId,
  });

  return res;
}
```

- [ ] **Step 10: Confirm the existing call sites still compile**

Run: `npx next build`
Expected: succeeds — the new `meta` parameter is optional, so `app/api/cigibm-register/route.ts`'s existing call (`sendTransactionalEmail(apiKey, { email, name }, message)`) still type-checks unchanged.

- [ ] **Step 11: Run the full test suite**

Run: `npx vitest run`
Expected: all PASS.

- [ ] **Step 12: Commit**

```bash
git add lib/messaging/ lib/email.ts
git commit -m "feat: add MessagingLog, SMS sending, and log email sends"
```

---

### Task 10: WhatsApp channel stub

**Files:**
- Create: `lib/messaging/whatsapp.ts`
- Create: `lib/messaging/whatsapp.test.ts`

**Interfaces:**
- Produces: `sendWhatsApp(to: string, text: string): Promise<{ ok: false; error: string }>` — always fails cleanly, no network call, until a real Business API integration replaces this in a future plan.

- [ ] **Step 1: Write the failing test**

`lib/messaging/whatsapp.test.ts`:

```typescript
import { describe, expect, it, vi } from "vitest";
import { sendWhatsApp } from "./whatsapp";

describe("sendWhatsApp", () => {
  it("returns a clear not-configured error without making a network call", async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    const result = await sendWhatsApp("+2290100000001", "Test");

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/pas encore configuré/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `npx vitest run lib/messaging/whatsapp.test.ts`
Expected: FAIL — `Cannot find module './whatsapp'`.

- [ ] **Step 3: Write `lib/messaging/whatsapp.ts`**

```typescript
// Canal WhatsApp : pas encore de compte WhatsApp Business Platform actif.
// Cette fonction garde la même interface que sendSms/sendTransactionalEmail
// pour que le sélecteur de canal dans l'admin puisse s'y brancher sans
// changement quand l'API sera configurée.
export async function sendWhatsApp(
  _to: string,
  _text: string
): Promise<{ ok: false; error: string }> {
  return {
    ok: false,
    error: "Le canal WhatsApp n'est pas encore configuré (compte WhatsApp Business Platform requis).",
  };
}
```

- [ ] **Step 4: Run it, confirm it passes**

Run: `npx vitest run lib/messaging/whatsapp.test.ts`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add lib/messaging/whatsapp.ts lib/messaging/whatsapp.test.ts
git commit -m "feat: add WhatsApp channel stub"
```

---

### Task 11: Audience resolver

**Files:**
- Create: `lib/messaging/audience.ts`
- Create: `lib/messaging/audience.test.ts`

**Interfaces:**
- Consumes: `db` (Task 2).
- Produces: `resolveAudience(filter: { editionNumber: number; onlyNonAttendees?: boolean }): Promise<{ id: string; fullName: string; phone: string; email: string | null }[]>`.

- [ ] **Step 1: Write the failing test**

`lib/messaging/audience.test.ts`:

```typescript
import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { resolveAudience } from "./audience";

const TEST_EMAIL_DOMAIN = "@test.plan.example";

describe("resolveAudience", () => {
  afterEach(async () => {
    await db.participant.deleteMany({ where: { email: { endsWith: TEST_EMAIL_DOMAIN } } });
  });

  it("returns every participant of the given édition by default", async () => {
    const edition4 = await db.edition.findUniqueOrThrow({ where: { number: 4 } });
    await db.participant.createMany({
      data: [
        { editionId: edition4.id, fullName: "Attended", phone: "+2290100000021", email: `att${TEST_EMAIL_DOMAIN}`, registrationSource: "form", attendedAt: new Date() },
        { editionId: edition4.id, fullName: "Not Attended", phone: "+2290100000022", email: `notatt${TEST_EMAIL_DOMAIN}`, registrationSource: "form" },
      ],
    });

    const audience = await resolveAudience({ editionNumber: 4 });

    expect(audience.some((p) => p.fullName === "Attended")).toBe(true);
    expect(audience.some((p) => p.fullName === "Not Attended")).toBe(true);
  });

  it("excludes participants who already attended when onlyNonAttendees is true", async () => {
    const edition4 = await db.edition.findUniqueOrThrow({ where: { number: 4 } });
    await db.participant.createMany({
      data: [
        { editionId: edition4.id, fullName: "Attended2", phone: "+2290100000023", email: `att2${TEST_EMAIL_DOMAIN}`, registrationSource: "form", attendedAt: new Date() },
        { editionId: edition4.id, fullName: "Not Attended2", phone: "+2290100000024", email: `notatt2${TEST_EMAIL_DOMAIN}`, registrationSource: "form" },
      ],
    });

    const audience = await resolveAudience({ editionNumber: 4, onlyNonAttendees: true });

    expect(audience.some((p) => p.fullName === "Attended2")).toBe(false);
    expect(audience.some((p) => p.fullName === "Not Attended2")).toBe(true);
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `npx vitest run lib/messaging/audience.test.ts`
Expected: FAIL — `Cannot find module './audience'`.

- [ ] **Step 3: Write `lib/messaging/audience.ts`**

```typescript
import { db } from "@/lib/db";

export async function resolveAudience(filter: {
  editionNumber: number;
  onlyNonAttendees?: boolean;
}): Promise<{ id: string; fullName: string; phone: string; email: string | null }[]> {
  const edition = await db.edition.findUniqueOrThrow({ where: { number: filter.editionNumber } });

  const participants = await db.participant.findMany({
    where: {
      editionId: edition.id,
      ...(filter.onlyNonAttendees ? { attendedAt: null } : {}),
    },
    select: { id: true, fullName: true, phone: true, email: true },
  });

  return participants;
}
```

- [ ] **Step 4: Run it, confirm it passes**

Run: `npx vitest run lib/messaging/audience.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/messaging/audience.ts lib/messaging/audience.test.ts
git commit -m "feat: add messaging audience resolver"
```

---

### Task 12: Compose-and-send admin route and page

**Files:**
- Create: `app/api/admin/messages/send/route.ts`
- Create: `app/api/admin/messages/send/route.test.ts`
- Create: `app/(admin)/admin/(protected)/messages/new/page.tsx`
- Create: `app/(admin)/admin/(protected)/messages/new/ComposeForm.tsx`

**Interfaces:**
- Consumes: `requireAdmin` (Task 5), `resolveAudience` (Task 11), `sendSms` (Task 9), `sendWhatsApp` (Task 10), `sendTransactionalEmail`/`buildConfirmationEmail`-style plain HTML sending (Task 9's updated `lib/email.ts`), `logMessage` (Task 9).

- [ ] **Step 1: Write the failing test**

`app/api/admin/messages/send/route.test.ts`:

```typescript
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

vi.mock("@/lib/admin/auth", () => ({
  requireAdmin: async () => ({ id: "admin-1", fullName: "Admin Test", role: "admin" }),
}));

const TEST_EMAIL_DOMAIN = "@test.plan.example";

describe("POST /api/admin/messages/send", () => {
  afterEach(async () => {
    await db.participant.deleteMany({ where: { email: { endsWith: TEST_EMAIL_DOMAIN } } });
    await db.messagingLog.deleteMany({ where: { batchLabel: "test-batch" } });
    vi.restoreAllMocks();
  });

  it("sends an SMS to every resolved recipient and logs one row each", async () => {
    const edition4 = await db.edition.findUniqueOrThrow({ where: { number: 4 } });
    await db.participant.createMany({
      data: [
        { editionId: edition4.id, fullName: "Recipient One", phone: "+2290100000031", email: `r1${TEST_EMAIL_DOMAIN}`, registrationSource: "form" },
        { editionId: edition4.id, fullName: "Recipient Two", phone: "+2290100000032", email: `r2${TEST_EMAIL_DOMAIN}`, registrationSource: "form" },
      ],
    });

    global.fetch = vi.fn(async () => new Response(JSON.stringify({ reference: "ref-1" }), { status: 201 })) as typeof fetch;

    const { POST } = await import("./route");
    const request = new NextRequest("http://localhost:3000/api/admin/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "sms", editionNumber: 4, message: "Rappel test", batchLabel: "test-batch" }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.sentCount).toBe(2);

    const logs = await db.messagingLog.findMany({ where: { batchLabel: "test-batch" } });
    expect(logs).toHaveLength(2);
    expect(logs.every((l) => l.status === "sent")).toBe(true);
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `npx vitest run app/api/admin/messages/send/route.test.ts`
Expected: FAIL — `Cannot find module './route'`.

- [ ] **Step 3: Write `app/api/admin/messages/send/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/admin/auth";
import { resolveAudience } from "@/lib/messaging/audience";
import { sendSms } from "@/lib/messaging/sms";
import { sendWhatsApp } from "@/lib/messaging/whatsapp";
import { sendTransactionalEmail } from "@/lib/email";
import { logMessage } from "@/lib/messaging/log";

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  const body = await request.json();

  const { channel, editionNumber, message, batchLabel, onlyNonAttendees } = body as {
    channel: "email" | "sms" | "whatsapp";
    editionNumber: number;
    message: string;
    batchLabel: string;
    onlyNonAttendees?: boolean;
  };

  const recipients = await resolveAudience({ editionNumber, onlyNonAttendees });
  const batchId = randomUUID();
  let sentCount = 0;

  for (const recipient of recipients) {
    if (channel === "sms") {
      const result = await sendSms(recipient.phone, message);
      await logMessage({
        channel: "sms",
        recipientPhone: recipient.phone,
        participantId: recipient.id,
        status: result.ok ? "sent" : "failed",
        providerMessageId: result.providerMessageId,
        errorMessage: result.error,
        batchId,
        batchLabel,
        sentByAdminId: admin.id,
      });
      if (result.ok) sentCount++;
    } else if (channel === "whatsapp") {
      const result = await sendWhatsApp(recipient.phone, message);
      await logMessage({
        channel: "whatsapp",
        recipientPhone: recipient.phone,
        participantId: recipient.id,
        status: "failed",
        errorMessage: result.error,
        batchId,
        batchLabel,
        sentByAdminId: admin.id,
      });
    } else if (recipient.email) {
      const apiKey = process.env.BREVO_API_KEY;
      if (!apiKey) continue;
      const res = await sendTransactionalEmail(
        apiKey,
        { email: recipient.email, name: recipient.fullName },
        { subject: batchLabel, html: `<p>${message}</p>` },
        { participantId: recipient.id, batchId, batchLabel, sentByAdminId: admin.id }
      );
      if (res.ok) sentCount++;
    }
  }

  return NextResponse.json({ sentCount, totalRecipients: recipients.length, batchId });
}
```

- [ ] **Step 4: Run it, confirm it passes**

Run: `npx vitest run app/api/admin/messages/send/route.test.ts`
Expected: PASS (1 test)

- [ ] **Step 5: Write the compose page and form**

`app/(admin)/admin/(protected)/messages/new/ComposeForm.tsx`:

```typescript
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function ComposeForm() {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setResult(null);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: form.get("channel"),
        editionNumber: Number(form.get("editionNumber")),
        onlyNonAttendees: form.get("onlyNonAttendees") === "on",
        message: form.get("message"),
        batchLabel: form.get("batchLabel"),
      }),
    });

    const json = await res.json();
    setSending(false);
    setResult(`Envoyé à ${json.sentCount} / ${json.totalRecipients} destinataires.`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">Canal</label>
        <select name="channel" defaultValue="email" className="w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm">
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="whatsapp" disabled>WhatsApp (non configuré)</option>
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">Édition</label>
        <select name="editionNumber" defaultValue="4" className="w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm">
          <option value="4">Édition 4</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="onlyNonAttendees" />
        Uniquement les personnes non présentes
      </label>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">Nom de l&apos;envoi</label>
        <input name="batchLabel" required className="w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm" placeholder="Rappel CIGIBM 2026" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">Message</label>
        <textarea name="message" required rows={5} className="w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm" />
      </div>
      <button type="submit" disabled={sending} className="rounded-full bg-leaf-600 px-6 py-3 text-sm font-semibold text-mist-50 disabled:opacity-60">
        {sending ? "Envoi..." : "Envoyer"}
      </button>
      {result && <p className="text-sm text-ink/70">{result}</p>}
    </form>
  );
}
```

`app/(admin)/admin/(protected)/messages/new/page.tsx`:

```typescript
import ComposeForm from "./ComposeForm";

export default function ComposeMessagePage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-leaf-900">Nouveau message</h1>
      <div className="mt-6">
        <ComposeForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add "app/api/admin/messages/" "app/(admin)/admin/(protected)/messages/new/"
git commit -m "feat: add message compose/send flow"
```

---

### Task 13: Messages dashboard (batch list)

**Files:**
- Create: `lib/messaging/batches.ts`
- Create: `lib/messaging/batches.test.ts`
- Create: `app/(admin)/admin/(protected)/messages/page.tsx`

**Interfaces:**
- Consumes: `db` (Task 2).
- Produces: `getMessageBatches(): Promise<{ batchId: string; batchLabel: string; channel: string; sentAt: Date; sentCount: number; failedCount: number }[]>`.

- [ ] **Step 1: Write the failing test**

`lib/messaging/batches.test.ts`:

```typescript
import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getMessageBatches } from "./batches";

describe("getMessageBatches", () => {
  afterEach(async () => {
    await db.messagingLog.deleteMany({ where: { batchLabel: "test-batch-dashboard" } });
  });

  it("groups messaging log rows by batchId and counts sent vs failed", async () => {
    await db.messagingLog.createMany({
      data: [
        { channel: "sms", status: "sent", batchId: "batch-test-1", batchLabel: "test-batch-dashboard" },
        { channel: "sms", status: "sent", batchId: "batch-test-1", batchLabel: "test-batch-dashboard" },
        { channel: "sms", status: "failed", batchId: "batch-test-1", batchLabel: "test-batch-dashboard" },
      ],
    });

    const batches = await getMessageBatches();
    const testBatch = batches.find((b) => b.batchId === "batch-test-1");

    expect(testBatch?.sentCount).toBe(2);
    expect(testBatch?.failedCount).toBe(1);
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `npx vitest run lib/messaging/batches.test.ts`
Expected: FAIL — `Cannot find module './batches'`.

- [ ] **Step 3: Write `lib/messaging/batches.ts`**

```typescript
import { db } from "@/lib/db";

export async function getMessageBatches() {
  const logs = await db.messagingLog.findMany({
    where: { batchId: { not: null } },
    orderBy: { sentAt: "desc" },
  });

  const byBatch = new Map<string, typeof logs>();
  for (const log of logs) {
    if (!log.batchId) continue;
    const existing = byBatch.get(log.batchId) ?? [];
    existing.push(log);
    byBatch.set(log.batchId, existing);
  }

  return Array.from(byBatch.entries()).map(([batchId, entries]) => ({
    batchId,
    batchLabel: entries[0].batchLabel ?? "(sans nom)",
    channel: entries[0].channel,
    sentAt: entries[0].sentAt,
    sentCount: entries.filter((e) => e.status === "sent").length,
    failedCount: entries.filter((e) => e.status === "failed").length,
  }));
}
```

- [ ] **Step 4: Run it, confirm it passes**

Run: `npx vitest run lib/messaging/batches.test.ts`
Expected: PASS (1 test)

- [ ] **Step 5: Write the messages list page**

`app/(admin)/admin/(protected)/messages/page.tsx`:

```typescript
import Link from "next/link";
import { getMessageBatches } from "@/lib/messaging/batches";

export default async function MessagesPage() {
  const batches = await getMessageBatches();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-leaf-900">Messages</h1>
        <Link href="/admin/messages/new" className="rounded-full bg-leaf-600 px-5 py-2.5 text-sm font-semibold text-mist-50">
          Nouveau message
        </Link>
      </div>
      <div className="mt-6 space-y-3">
        {batches.map((b) => (
          <div key={b.batchId} className="flex items-center justify-between rounded-xl border border-ink/8 bg-mist-50 px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{b.batchLabel}</p>
              <p className="text-xs text-ink/50">{b.channel} · {new Date(b.sentAt).toLocaleString("fr-FR")}</p>
            </div>
            <div className="text-right text-xs">
              <p className="text-leaf-700">{b.sentCount} envoyés</p>
              {b.failedCount > 0 && <p className="text-red-600">{b.failedCount} échoués</p>}
            </div>
          </div>
        ))}
        {batches.length === 0 && <p className="text-sm text-ink/50">Aucun envoi pour l&apos;instant.</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Run the full test suite one final time**

Run: `npx vitest run`
Expected: all tests across the whole plan PASS.

- [ ] **Step 7: Build the whole app**

Run: `npx next build`
Expected: succeeds, no type errors.

- [ ] **Step 8: Commit**

```bash
git add lib/messaging/batches.ts lib/messaging/batches.test.ts "app/(admin)/admin/(protected)/messages/page.tsx"
git commit -m "feat: add messages dashboard grouped by batch"
```

---

## After this plan ships (manual, one-time, not a task)

1. In Supabase Dashboard → Authentication → Providers, **disable public sign-ups** (or explicitly confirm they're already disabled). `requireAdmin()` now rejects any session whose `AdminProfile.role` isn't `admin`, but the Postgres trigger from Task 4 still auto-creates an `AdminProfile` with role `scanner` for every row inserted into `auth.users` — if public sign-up is left enabled, self-registered users can still create accounts and reach `/admin/login` (they just land on `scanner`, not `admin`, and get bounced). This toggle is Supabase-side and cannot be verified or changed from this codebase, so it must be checked manually.
2. In Supabase Dashboard → Authentication → Users → **Invite user**, create the first real admin account (Christelle, or whoever runs the team).
3. Open Prisma Studio (`npm run db:studio`), find that user's `AdminProfile` row, and set `role` to `admin` — it must be changed manually; the auto-provisioning trigger leaves every new row at its default `scanner`, which `requireAdmin()` now rejects. Also set `testBypass` to `true` (for whoever will test the QR flow before Oct 17).
4. Add the four Supabase env vars to Vercel's Production environment (see Prerequisite section) and redeploy.
5. Confirm login works end-to-end against the live site, not just `localhost`.

## Spec sections covered by this plan

§4 (tech stack — all of it except QR/Ambassador-specific libraries), §5 (full schema), §6 (the `/api/cigibm-register` integration point), §9 (messaging system, Email+SMS live, WhatsApp stubbed). §7 (QR attendance) and §8 (Ambassador program) are explicitly deferred to their own plans, per the design doc's phasing in §10.
