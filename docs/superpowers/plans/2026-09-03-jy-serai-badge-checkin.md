# J'y serai badge + QR check-in Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a registered CIGIBM participant generate a personal "J'y serai" share image (their photo + name + a QR encoding their real `attendanceToken`), and let a scanner-role admin scan that QR at the door to mark attendance.

**Architecture:** Three self-contained badge template components (CSS Modules, real DOM/CSS — not hand-drawn Canvas) render into an off-screen preview on a new public `/cigibm-2026/badge/[token]` page; a "download" button rasterizes that DOM node to a PNG client-side. The QR encodes the participant's raw `attendanceToken` as plain text (not a URL). A new `/admin/scan` surface — reachable by `role: "admin"` or `role: "scanner"`, not the general CRM's `role: "admin"`-only gate — decodes that text from the camera (or manual entry) and calls a Server Action that looks the token up and marks `attendedAt`.

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, Prisma 7, Vitest. New deps: `qrcode` (QR generation), `jsqr` (QR decoding from camera frames), `html-to-image` (DOM-to-PNG rasterization), self-hosted script font via `next/font/local`.

**Spec:** `docs/superpowers/specs/2026-09-03-jy-serai-badge-checkin-design.md`

## Global Constraints

- QR payload is the raw `attendanceToken` string — never a URL. A scannable public link that marks attendance on load would let anyone self-check-in.
- `requireAdmin()` (`lib/admin/auth.ts`) must keep its exact current behavior (`role === "admin"` only) — it's relied on by existing ambassador/message Server Actions. Do not loosen it; add a new function instead.
- `/admin/scan` lives outside `app/(admin)/admin/(protected)/` — that route group's layout is CRM chrome (sidebar, full nav) that a scanner-role account should never see.
- No new Prisma fields/migrations — `Participant.attendanceToken`, `attendedAt`, `checkedInByAdminId` and `AdminRole.scanner` already exist.
- Every new Vitest file that touches Prisma needs an `afterEach` that deletes only rows matching a unique test-prefix/domain, to avoid colliding with other test files running in parallel against the same shared database (see `lib/admin/ambassadors.test.ts`). A file that also uses `NextRequest`/`FormData` additionally needs `// @vitest-environment node` at the top (see `app/api/cigibm-register/route.test.ts:1`) — jsdom, the project default, handles those server primitives inconsistently. Don't add that pragma to a file that also needs `render`/`screen` from `@testing-library/react` (Task 11's test) — those need the DOM jsdom provides, and Prisma calls work fine under jsdom on their own (`lib/admin/ambassadors.test.ts` has no such pragma and does real `db.ambassador.create()` calls).
- Fonts are self-hosted via `next/font/local` project-wide (see the comment at `app/layout.tsx:6-8`) specifically to avoid a Google Fonts CDN build dependency — the new script font must follow the same pattern, not `next/font/google`.

---

### Task 1: Scanner auth guard + fix the scanner-role dead end

**Files:**
- Modify: `lib/admin/auth.ts`
- Create: `lib/admin/auth.test.ts`
- Modify: `app/(admin)/admin/(protected)/layout.tsx`

**Interfaces:**
- Produces: `resolveAccessRedirect(session: AdminSession | null, allowedRoles: Array<"admin" | "scanner">): string | null` — pure function, returns a redirect path or `null` if access is allowed.
- Produces: `requireScanAccess(): Promise<AdminSession>` — same shape as the existing `requireAdmin()`, but allows `role === "scanner"` too.
- Consumes (unchanged): `AdminSession`, `getAdminSession()` (both already exist in this file).

Right now, a `scanner`-role account that logs in gets bounced by `app/(admin)/admin/(protected)/layout.tsx` (which calls `requireAdmin()`) straight back to `/admin/login?acces=refuse` — there is currently no page a scanner account can ever reach. This task fixes that and adds the guard the new `/admin/scan` page needs, without changing `requireAdmin()`'s behavior for its existing callers.

- [ ] **Step 1: Write the failing test for the new pure redirect logic**

Create `lib/admin/auth.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { resolveAccessRedirect } from "./auth";

describe("resolveAccessRedirect", () => {
  it("sends an unauthenticated visitor to login", () => {
    expect(resolveAccessRedirect(null, ["admin"])).toBe("/admin/login");
  });

  it("allows a session whose role is in the allowed list", () => {
    const session = { id: "1", fullName: "Test", role: "admin" as const };
    expect(resolveAccessRedirect(session, ["admin"])).toBeNull();
  });

  it("sends a session with a disallowed role to the access-refused page", () => {
    const session = { id: "1", fullName: "Test", role: "scanner" as const };
    expect(resolveAccessRedirect(session, ["admin"])).toBe("/admin/login?acces=refuse");
  });

  it("allows a scanner session when scanner is in the allowed list", () => {
    const session = { id: "1", fullName: "Test", role: "scanner" as const };
    expect(resolveAccessRedirect(session, ["admin", "scanner"])).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run lib/admin/auth.test.ts`
Expected: FAIL — `resolveAccessRedirect` is not exported from `./auth`.

- [ ] **Step 3: Add `resolveAccessRedirect` and `requireScanAccess`, keep `requireAdmin` behavior identical**

Replace the body of `lib/admin/auth.ts` from `export async function requireAdmin` onward with:

```ts
export function resolveAccessRedirect(
  session: AdminSession | null,
  allowedRoles: Array<"admin" | "scanner">
): string | null {
  if (!session) return "/admin/login";
  if (!allowedRoles.includes(session.role)) return "/admin/login?acces=refuse";
  return null;
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  const redirectTo = resolveAccessRedirect(session, ["admin"]);
  if (redirectTo) redirect(redirectTo);
  return session!;
}

// Distinct from requireAdmin(): the door-scanning flow must work for a
// scanner-role account too, not just full admins. requireAdmin() itself
// stays admin-only unchanged — other callers (ambassador/message Server
// Actions) depend on that.
export async function requireScanAccess(): Promise<AdminSession> {
  const session = await getAdminSession();
  const redirectTo = resolveAccessRedirect(session, ["admin", "scanner"]);
  if (redirectTo) redirect(redirectTo);
  return session!;
}
```

- [ ] **Step 4: Run the test again to confirm it passes**

Run: `npx vitest run lib/admin/auth.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Fix the scanner-role dead end in the CRM layout**

In `app/(admin)/admin/(protected)/layout.tsx`, replace:

```tsx
import { requireAdmin } from "@/lib/admin/auth";
```

with:

```tsx
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/auth";
```

and replace the line `const session = await requireAdmin();` with:

```tsx
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  // A scanner-role account has no business inside the full CRM — send it to
  // the one page it's actually meant to use instead of the generic
  // "acces=refuse" dead end this used to hit via requireAdmin().
  if (session.role !== "admin") redirect("/admin/scan");
```

- [ ] **Step 6: Type-check and run the full suite**

Run: `npx tsc --noEmit -p .` — expect no errors.
Run: `npm test` — expect all existing tests still pass plus the 4 new ones.

- [ ] **Step 7: Commit**

```bash
git add lib/admin/auth.ts lib/admin/auth.test.ts "app/(admin)/admin/(protected)/layout.tsx"
git commit -m "feat: add scanner-role access guard, fix its dead-end redirect"
```

---

### Task 2: Check-in domain logic

**Files:**
- Create: `lib/checkin/checkin.ts`
- Create: `lib/checkin/checkin.test.ts`

**Interfaces:**
- Produces: `type CheckInResult = { status: "not_found" } | { status: "already"; fullName: string; attendedAt: Date } | { status: "success"; fullName: string }`
- Produces: `checkInParticipant(token: string, scannerAdminId: string): Promise<CheckInResult>`
- Consumes: `db` from `@/lib/db`.

- [ ] **Step 1: Write the failing tests**

Create `lib/checkin/checkin.ts` as an empty stub first so the import resolves:

```ts
import { db } from "@/lib/db";

export type CheckInResult =
  | { status: "not_found" }
  | { status: "already"; fullName: string; attendedAt: Date }
  | { status: "success"; fullName: string };

export async function checkInParticipant(token: string, scannerAdminId: string): Promise<CheckInResult> {
  throw new Error("not implemented");
}
```

Create `lib/checkin/checkin.test.ts`:

```ts
// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { checkInParticipant } from "./checkin";

const TEST_EMAIL_DOMAIN = "@test.plan.checkin.example";

async function createTestParticipant(overrides: { attendedAt?: Date } = {}) {
  const edition4 = await db.edition.findUniqueOrThrow({ where: { number: 4 } });
  return db.participant.create({
    data: {
      editionId: edition4.id,
      fullName: "Checkin Test Person",
      phone: "+2290100000090",
      email: `checkin${TEST_EMAIL_DOMAIN}`,
      registrationSource: "form",
      ...overrides,
    },
  });
}

describe("checkInParticipant", () => {
  afterEach(async () => {
    await db.participant.deleteMany({ where: { email: { endsWith: TEST_EMAIL_DOMAIN } } });
  });

  it("returns not_found for an unknown token", async () => {
    const result = await checkInParticipant("does-not-exist-token", "admin-1");
    expect(result.status).toBe("not_found");
  });

  it("marks a not-yet-attended participant present", async () => {
    const participant = await createTestParticipant();

    const result = await checkInParticipant(participant.attendanceToken, "admin-1");

    expect(result).toEqual({ status: "success", fullName: "Checkin Test Person" });
    const updated = await db.participant.findUniqueOrThrow({ where: { id: participant.id } });
    expect(updated.attendedAt).not.toBeNull();
    expect(updated.checkedInByAdminId).toBe("admin-1");
  });

  it("reports already-checked-in without overwriting the original check-in", async () => {
    const originalAttendedAt = new Date("2026-10-17T09:15:00.000Z");
    const participant = await createTestParticipant({ attendedAt: originalAttendedAt });
    await db.participant.update({ where: { id: participant.id }, data: { checkedInByAdminId: "admin-original" } });

    const result = await checkInParticipant(participant.attendanceToken, "admin-2");

    expect(result).toEqual({ status: "already", fullName: "Checkin Test Person", attendedAt: originalAttendedAt });
    const row = await db.participant.findUniqueOrThrow({ where: { id: participant.id } });
    // Confirms the second scan did not steal credit for the check-in.
    expect(row.checkedInByAdminId).toBe("admin-original");
  });
});
```

- [ ] **Step 2: Run to confirm the tests fail**

Run: `npx vitest run lib/checkin/checkin.test.ts`
Expected: the "not implemented" tests FAIL with the thrown error.

- [ ] **Step 3: Implement `checkInParticipant`**

Replace the stub body in `lib/checkin/checkin.ts` with:

```ts
import { db } from "@/lib/db";

export type CheckInResult =
  | { status: "not_found" }
  | { status: "already"; fullName: string; attendedAt: Date }
  | { status: "success"; fullName: string };

// A near-simultaneous double-scan of the same QR (two scanners, same
// visitor) can both pass the `!participant.attendedAt` check before either
// writes — an accepted, low-stakes race: worst case is the door briefly
// shows "success" twice for one person, never a duplicate row or a lost
// check-in, so no locking is added for it.
export async function checkInParticipant(token: string, scannerAdminId: string): Promise<CheckInResult> {
  const participant = await db.participant.findUnique({ where: { attendanceToken: token } });
  if (!participant) return { status: "not_found" };

  if (participant.attendedAt) {
    return { status: "already", fullName: participant.fullName, attendedAt: participant.attendedAt };
  }

  const updated = await db.participant.update({
    where: { id: participant.id },
    data: { attendedAt: new Date(), checkedInByAdminId: scannerAdminId },
  });

  return { status: "success", fullName: updated.fullName };
}
```

- [ ] **Step 4: Run the tests again to confirm they pass**

Run: `npx vitest run lib/checkin/checkin.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/checkin/checkin.ts lib/checkin/checkin.test.ts
git commit -m "feat: add check-in domain logic for QR scanning"
```

---

### Task 3: QR generation utility

**Files:**
- Create: `lib/qr.ts`
- Create: `lib/qr.test.ts`
- Modify: `package.json`, `package-lock.json` (via `npm install`)

**Interfaces:**
- Produces: `generateQrDataUrl(text: string): Promise<string>` — resolves to a `data:image/png;base64,...` URL.
- Consumes: `qrcode` npm package.

- [ ] **Step 1: Install dependencies**

Run: `npm install qrcode && npm install -D @types/qrcode`

- [ ] **Step 2: Write the failing test**

Create `lib/qr.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { generateQrDataUrl } from "./qr";

describe("generateQrDataUrl", () => {
  it("resolves to a PNG data URL", async () => {
    const dataUrl = await generateQrDataUrl("some-attendance-token");
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it("produces different output for different input tokens", async () => {
    const a = await generateQrDataUrl("token-a");
    const b = await generateQrDataUrl("token-b");
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 3: Run to confirm it fails**

Run: `npx vitest run lib/qr.test.ts`
Expected: FAIL — `./qr` has no exports yet (module not found).

- [ ] **Step 4: Implement `generateQrDataUrl`**

Create `lib/qr.ts`:

```ts
import QRCode from "qrcode";

// Encodes the raw token as plain text, never a URL — see the "Global
// Constraints" note in the plan this file was built from: a public link
// that marks attendance on load would let anyone self-check-in just by
// opening it.
export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    margin: 1,
    width: 512,
    color: { dark: "#0e2118", light: "#ffffff" },
  });
}
```

- [ ] **Step 5: Run the test again to confirm it passes**

Run: `npx vitest run lib/qr.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add lib/qr.ts lib/qr.test.ts package.json package-lock.json
git commit -m "feat: add QR code generation utility"
```

---

### Task 4: Scanner page — server action + UI

**Files:**
- Create: `app/admin/scan/actions.ts`
- Create: `app/admin/scan/page.tsx`
- Create: `app/admin/scan/ScannerClient.tsx`
- Modify: `package.json`, `package-lock.json` (via `npm install`)

**Interfaces:**
- Consumes: `requireScanAccess` (Task 1), `checkInParticipant`/`CheckInResult` (Task 2).
- Produces: `checkInAction(token: string): Promise<CheckInResult>` — a Server Action other tasks don't need to call directly.

This is the door-facing scan screen: camera-based QR decode with a manual-entry fallback (a live event with bad lighting or a flaky camera can't be a single point of failure), calling the same Server Action either way.

- [ ] **Step 1: Install the camera-decode dependency**

Run: `npm install jsqr`

- [ ] **Step 2: Write the Server Action**

Create `app/admin/scan/actions.ts`:

```ts
"use server";

import { requireScanAccess } from "@/lib/admin/auth";
import { checkInParticipant, type CheckInResult } from "@/lib/checkin/checkin";

export async function checkInAction(token: string): Promise<CheckInResult> {
  const session = await requireScanAccess();
  return checkInParticipant(token.trim(), session.id);
}
```

- [ ] **Step 3: Write the scanner page (server component)**

Create `app/admin/scan/page.tsx`:

```tsx
import type { Metadata } from "next";
import { requireScanAccess } from "@/lib/admin/auth";
import ScannerClient from "./ScannerClient";

export const metadata: Metadata = {
  title: "Scanner, Admin",
  robots: { index: false },
};

export default async function ScanPage() {
  const session = await requireScanAccess();

  return (
    <div className="flex min-h-screen flex-col bg-leaf-950 px-4 py-6 text-mist-50">
      <p className="text-center text-xs uppercase tracking-[0.2em] text-leaf-300">
        Connecté(e) en tant que {session.fullName}
      </p>
      <h1 className="mt-2 text-center font-display text-2xl">Scanner d&apos;entrée CIGIBM</h1>
      <ScannerClient />
    </div>
  );
}
```

- [ ] **Step 4: Write the client scanner component**

Create `app/admin/scan/ScannerClient.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { checkInAction } from "./actions";
import type { CheckInResult } from "@/lib/checkin/checkin";

type ScanState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "result"; result: CheckInResult };

export default function ScannerClient() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastSubmittedToken = useRef<string | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [state, setState] = useState<ScanState>({ kind: "idle" });
  const [manualToken, setManualToken] = useState("");

  const submitToken = useCallback(async (token: string) => {
    if (!token || lastSubmittedToken.current === token) return;
    lastSubmittedToken.current = token;
    setState({ kind: "checking" });
    const result = await checkInAction(token);
    setState({ kind: "result", result });
  }, []);

  // Après un résultat affiché, on autorise à nouveau le même jeton (au cas
  // où le même visiteur reviendrait volontairement se faire re-scanner) une
  // fois que l'agent a repris un nouveau scan.
  const resetForNextScan = useCallback(() => {
    lastSubmittedToken.current = null;
    setState({ kind: "idle" });
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        scanLoop();
      } catch (err) {
        console.error("Camera access failed", err);
        setCameraError("Impossible d'accéder à la caméra. Utilisez la saisie manuelle ci-dessous.");
      }
    }

    function scanLoop() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(scanLoop);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        rafRef.current = requestAnimationFrame(scanLoop);
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const decoded = jsQR(imageData.data, imageData.width, imageData.height);
      if (decoded?.data) {
        void submitToken(decoded.data);
      }
      rafRef.current = requestAnimationFrame(scanLoop);
    }

    startCamera();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [submitToken]);

  return (
    <div className="mx-auto mt-6 flex w-full max-w-sm flex-1 flex-col gap-4">
      <div className="relative overflow-hidden rounded-2xl border border-mist-50/15 bg-black">
        <video ref={videoRef} className="w-full" muted playsInline />
        <canvas ref={canvasRef} className="hidden" />
      </div>
      {cameraError && <p className="text-sm text-red-300">{cameraError}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submitToken(manualToken.trim());
        }}
        className="flex gap-2"
      >
        <input
          value={manualToken}
          onChange={(e) => setManualToken(e.target.value)}
          placeholder="Saisie manuelle du jeton"
          className="min-w-0 flex-1 rounded-xl border border-mist-50/20 bg-mist-50/5 px-3 py-2 text-sm text-mist-50 outline-none placeholder:text-mist-50/40"
        />
        <button type="submit" className="rounded-xl bg-leaf-500 px-4 py-2 text-sm font-semibold text-leaf-950">
          Valider
        </button>
      </form>

      {state.kind === "checking" && <p className="text-center text-sm text-mist-50/70">Vérification…</p>}

      {state.kind === "result" && (
        <div
          className={`rounded-2xl p-5 text-center ${
            state.result.status === "success"
              ? "bg-leaf-500/20 text-leaf-200"
              : state.result.status === "already"
                ? "bg-amber-500/20 text-amber-200"
                : "bg-red-500/20 text-red-200"
          }`}
        >
          {state.result.status === "not_found" && <p className="font-semibold">Billet invalide</p>}
          {state.result.status === "already" && (
            <>
              <p className="font-semibold">{state.result.fullName}</p>
              <p className="mt-1 text-sm">Déjà enregistré(e) à {state.result.attendedAt.toLocaleTimeString("fr-FR")}</p>
            </>
          )}
          {state.result.status === "success" && (
            <>
              <p className="font-semibold">{state.result.fullName}</p>
              <p className="mt-1 text-sm">Enregistré(e) avec succès</p>
            </>
          )}
          <button
            type="button"
            onClick={resetForNextScan}
            className="mt-4 rounded-full border border-current px-5 py-2 text-sm font-semibold"
          >
            Scanner suivant
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit -p .`
Expected: no errors. (No automated test for this task — it's a live-camera UI; `checkInAction` itself is a thin pass-through already covered by Task 2's tests plus `requireScanAccess`'s own tests from Task 1. Manually verify in a browser: `npm run dev`, log in as an admin, visit `/admin/scan`, and confirm the camera preview loads and the manual-entry field submits.)

- [ ] **Step 6: Commit**

```bash
git add app/admin/scan package.json package-lock.json
git commit -m "feat: add door check-in scanner page"
```

---

### Task 5: Add "Scanner" to the admin navigation

**Files:**
- Modify: `app/(admin)/admin/(protected)/AdminNav.tsx`

**Interfaces:**
- Consumes: nothing new — pure addition to the existing `navItems` array.

- [ ] **Step 1: Add the nav item and its icon**

In `app/(admin)/admin/(protected)/AdminNav.tsx`, add a new icon function after `MailIcon` (around line 41):

```tsx
function ScanIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  );
}
```

Then add an entry to `navItems` (currently at line 43):

```tsx
const navItems = [
  { href: "/admin", label: "Tableau de bord", shortLabel: "Accueil", Icon: HomeIcon, exact: true },
  { href: "/admin/participants", label: "Participants", shortLabel: "Participants", Icon: PeopleIcon },
  { href: "/admin/ambassadors", label: "Ambassadeurs", shortLabel: "Ambassad.", Icon: StarIcon },
  { href: "/admin/messages", label: "Messages", shortLabel: "Messages", Icon: MailIcon },
  { href: "/admin/scan", label: "Scanner", shortLabel: "Scanner", Icon: ScanIcon },
];
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit -p .`
Expected: no errors.

- [ ] **Step 3: Manually verify**

Run: `npm run dev`, log in as a full admin, confirm "Scanner" appears in both the desktop sidebar and the mobile bottom nav, and clicking it navigates to `/admin/scan` (a full page load — it's outside the CRM's route group, which is expected).

- [ ] **Step 4: Commit**

```bash
git add "app/(admin)/admin/(protected)/AdminNav.tsx"
git commit -m "feat: add Scanner link to admin navigation"
```

---

### Task 6: Self-hosted script font

**Files:**
- Create: `app/fonts/dancing-script-variable.woff2`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Produces: CSS custom property `--font-script`, usable in any CSS/CSS Module in the app (consumed by Task 7-9's badge templates).

The badge mockups used `"Brush Script MT"` for the "J'y serai" script text — a Windows/Office-only proprietary font. A visitor on Mac, Linux, Android, or iOS would silently get a generic fallback that looks nothing like the verified design. This task adds a real, licensed, self-hosted font instead, following the exact pattern already used for the site's two existing fonts.

- [ ] **Step 1: Acquire the font file**

Download the "Dancing Script" font as WOFF2 directly (SIL Open Font License) from google-webfonts-helper — a static mirror built specifically for self-hosting Google Fonts, so no format conversion step is needed:

Run: `curl -L -o app/fonts/dancing-script-variable.woff2 "https://gwfh.mranftl.com/api/fonts/dancing-script?download=zip&subsets=latin&variants=regular,700" `

This returns a zip, not the raw file — unzip it first and copy the woff2 out:

```bash
curl -L -o /tmp/dancing-script.zip "https://gwfh.mranftl.com/api/fonts/dancing-script?download=zip&subsets=latin&variants=regular,700"
unzip -o /tmp/dancing-script.zip -d /tmp/dancing-script
cp /tmp/dancing-script/dancing-script-v26-latin-700.woff2 app/fonts/dancing-script-variable.woff2
```

(This mirror serves static weights, not a true variable font — that's fine here: the `700` weight file covers this component's needs, since every badge template only ever uses the script font at one weight. If the exact filename in the zip differs from `dancing-script-v26-latin-700.woff2`, `ls /tmp/dancing-script` to find the real name before the `cp`.)

- [ ] **Step 2: Register the font**

In `app/layout.tsx`, add a third `localFont` call after `manrope` (line 21):

```tsx
const dancingScript = localFont({
  src: "./fonts/dancing-script-variable.woff2",
  variable: "--font-script",
  weight: "700",
  display: "swap",
});
```

Then add it to the `<html>` `className` (line 83):

```tsx
      className={`${displayFont.variable} ${manrope.variable} ${dancingScript.variable} h-full antialiased`}
```

- [ ] **Step 3: Verify it loads**

Run: `npm run dev`, open any page, open devtools, and confirm `--font-script` resolves to a non-empty value on `document.documentElement` (`getComputedStyle(document.documentElement).getPropertyValue('--font-script')`).

- [ ] **Step 4: Commit**

```bash
git add app/fonts/dancing-script-variable.woff2 app/layout.tsx
git commit -m "feat: add self-hosted script font for the badge generator"
```

---

### Task 7: Badge Template 1 (dark green certificate, Christelle watermark)

**Files:**
- Create: `components/badge/Badge1.tsx`
- Create: `components/badge/Badge1.module.css`

**Interfaces:**
- Produces: `<Badge1 photoUrl={string | null} name={string} qrDataUrl={string | null} />` — a `forwardRef`-free plain component; the DOM node to rasterize is identified by the caller wrapping it (Task 10 passes a `ref` via a wrapper `div`, not into this component — keeps this component a pure presentational unit).
- Consumes: `cigibm` from `@/lib/content` (for `nextEdition.theme`, `dates`, `venue`).

This ports the verified CSS/markup from `badge-final-v4.html` (the brainstorming session's final Template 1) into a real component. Photo and QR are real `<img>` elements now instead of the mockup's emoji/generated placeholder.

- [ ] **Step 1: Create the CSS Module**

Create `components/badge/Badge1.module.css`:

```css
.badge {
  width: 320px;
  aspect-ratio: 4 / 5;
  border-radius: 18px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 4px 10px rgba(24, 58, 26, 0.15), 0 22px 46px -8px rgba(24, 58, 26, 0.4);
  font-family: var(--font-display), Georgia, serif;
  border: 1px solid rgba(201, 165, 54, 0.4);
  color: #fcfdfd;
  display: flex;
  flex-direction: column;
  background: #0e2118;
}
.badge p {
  margin: 0;
}

.watermarkFull {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image: url("/images/christelle-avec-le-vaccin.jpg");
  background-repeat: no-repeat;
  background-size: 505px 674px;
  background-position: -92px -274px;
  filter: grayscale(0.35) sepia(0.3) hue-rotate(50deg) saturate(1.5) brightness(1.05);
}
.overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(180deg, rgba(14, 33, 24, 0.85) 0%, rgba(14, 33, 24, 0.6) 32%, rgba(20, 45, 24, 0.6) 68%, rgba(14, 33, 24, 0.85) 100%);
}
.sheen {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(115deg, transparent 40%, rgba(255, 255, 255, 0.07) 50%, transparent 60%);
}
.content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
}

.headerRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 3px 15px 1px;
  border-bottom: 1px solid rgba(232, 200, 74, 0.35);
}
.masthead {
  font-family: var(--font-sans), sans-serif;
  font-size: 7px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}
.cigibm {
  color: #f3dd8a;
}
.seal {
  flex-shrink: 0;
  min-width: 34px;
  height: 26px;
  padding: 0 6px;
  border-radius: 13px;
  background: linear-gradient(135deg, #f9e9ae, #e8c84a 55%, #c9a536);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: #1a2f16;
  font-family: var(--font-sans), sans-serif;
  font-weight: 800;
  text-align: center;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.35);
}
.sealNum {
  font-size: 11px;
  line-height: 1;
}
.sealOrd {
  font-size: 6.5px;
  vertical-align: super;
}
.sealLbl {
  font-size: 6px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.motto {
  font-family: var(--font-script), cursive;
  font-style: italic;
  font-size: 16px;
  text-align: center;
  margin-top: 3px;
  color: #f3dd8a;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
}
.motto::before,
.motto::after {
  content: "";
  width: 18px;
  height: 1px;
  background: rgba(232, 200, 74, 0.5);
}

.photoGlow {
  margin: 10px auto 0;
  width: 182px;
  height: 182px;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.photoGlow::before {
  content: "";
  position: absolute;
  inset: -16px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(243, 221, 138, 0.35), transparent 70%);
}
.photoFrame {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  padding: 5px;
  background: linear-gradient(135deg, #f9e9ae, #e8c84a 45%, #8a6f22);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3), 0 14px 28px rgba(0, 0, 0, 0.5);
  position: relative;
  z-index: 1;
}
.photoBox {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #87b7de, #3684c4);
  border: 3px solid rgba(255, 255, 255, 0.92);
  box-shadow: inset 0 -28px 36px -8px rgba(0, 0, 0, 0.4);
}
.photoImg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.panelBottom {
  margin-top: 2px;
  padding: 2px 15px 18px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.script {
  font-family: var(--font-script), cursive;
  font-size: 52px;
  color: #f9e9ae;
  text-align: center;
  line-height: 1;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.7), 0 0 26px rgba(232, 200, 74, 0.45);
}
.name {
  text-align: center;
  font-family: var(--font-sans), sans-serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  margin-top: 2px;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
}

.footerRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 5px;
  padding-top: 5px;
  border-top: 1px dashed rgba(255, 255, 255, 0.3);
}
.details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.date {
  font-family: var(--font-sans), sans-serif;
  font-size: 9.5px;
  font-weight: 700;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}
.venue {
  font-family: var(--font-sans), sans-serif;
  font-size: 7.5px;
  opacity: 0.85;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}
.qrCard {
  background: #fff;
  border-radius: 8px;
  padding: 5px;
  border: 1px solid #e8c84a;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3), 0 6px 12px rgba(0, 0, 0, 0.35);
  line-height: 0;
  overflow: hidden;
}
.qrImg {
  width: 50px;
  height: 50px;
  display: block;
}
```

- [ ] **Step 2: Create the component**

Create `components/badge/Badge1.tsx`:

```tsx
import { cigibm } from "@/lib/content";
import styles from "./Badge1.module.css";

export type BadgeTemplateProps = {
  photoUrl: string | null;
  name: string;
  qrDataUrl: string | null;
};

export default function Badge1({ photoUrl, name, qrDataUrl }: BadgeTemplateProps) {
  return (
    <div className={styles.badge}>
      <div className={styles.watermarkFull} />
      <div className={styles.overlay} />
      <div className={styles.sheen} />
      <div className={styles.content}>
        <div className={styles.headerRow}>
          <p className={styles.masthead}>
            ONG Triomphe de l&apos;Intérieur <span className={styles.cigibm}>· CIGIBM</span>
          </p>
          <div className={styles.seal}>
            <span className={styles.sealNum}>
              4<span className={styles.sealOrd}>e</span>
            </span>
            <span className={styles.sealLbl}>Édition</span>
          </div>
        </div>
        <p className={styles.motto}>{cigibm.nextEdition.theme}</p>
        <div className={styles.photoGlow}>
          <div className={styles.photoFrame}>
            <div className={styles.photoBox}>
              {photoUrl && <img src={photoUrl} alt="" className={styles.photoImg} />}
            </div>
          </div>
        </div>
        <div className={styles.panelBottom}>
          <p className={styles.script}>J&apos;y serai</p>
          <p className={styles.name}>{name}</p>
          <div className={styles.footerRow}>
            <div className={styles.details}>
              <span className={styles.date}>{cigibm.nextEdition.dates}</span>
              <span className={styles.venue}>{cigibm.nextEdition.venue}</span>
            </div>
            <div className={styles.qrCard}>
              {qrDataUrl && <img src={qrDataUrl} alt="Code QR" className={styles.qrImg} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit -p .`
Expected: no errors.

- [ ] **Step 3: Manual visual check**

This component has no page to render on yet (Task 10 wires it up). Skip manual verification until Task 10 — commit now, the component is complete and correctly typed on its own.

- [ ] **Step 4: Commit**

```bash
git add components/badge/Badge1.tsx components/badge/Badge1.module.css
git commit -m "feat: add badge template 1 (dark certificate + watermark)"
```

---

### Task 8: Badge Template 2 (CIGIBM TV-promo style)

**Files:**
- Create: `components/badge/Badge2.tsx`
- Create: `components/badge/Badge2.module.css`

**Interfaces:**
- Produces: `<Badge2 photoUrl={string | null} name={string} qrDataUrl={string | null} />` — same prop shape as `Badge1` (`BadgeTemplateProps`, defined in Task 7's `Badge1.tsx`).
- Consumes: `BadgeTemplateProps` (Task 7), `cigibm` from `@/lib/content`.

Ports `badge-tv-v3.html`'s final CSS. The full-bleed photo area now holds a real `<img>` (`object-fit: cover`) instead of the mockup's centered emoji.

- [ ] **Step 1: Create the CSS Module**

Create `components/badge/Badge2.module.css`:

```css
.badge {
  width: 320px;
  aspect-ratio: 4 / 5;
  border-radius: 18px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 4px 10px rgba(24, 58, 26, 0.15), 0 22px 46px -8px rgba(24, 58, 26, 0.4);
  background: #0e2118;
  display: flex;
  flex-direction: column;
  color: #fcfdfd;
  border: 1px solid rgba(201, 165, 54, 0.4);
  font-family: var(--font-sans), sans-serif;
}
.badge p {
  margin: 0;
}

.photoFull {
  position: absolute;
  inset: 0;
  bottom: 38%;
  overflow: hidden;
  background: linear-gradient(155deg, #87b7de, #3684c4 55%, #307335);
}
.photoImg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.photoFull::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(14, 33, 24, 0.6) 0%, transparent 24%, transparent 58%, rgba(14, 33, 24, 1) 100%);
}

.topRow {
  position: relative;
  z-index: 3;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 13px 16px 0;
}
.brand {
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #fff;
  text-shadow: 0 0 4px #fff, 0 0 12px #f3dd8a, 0 0 22px #e8c84a, 0 0 38px #c9a536;
}
.seal {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f9e9ae, #e8c84a 55%, #c9a536);
  color: #1a2f16;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3), 0 8px 16px rgba(0, 0, 0, 0.45);
}
.sealNum {
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
}
.sealLbl {
  font-size: 5.8px;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.lower {
  position: relative;
  z-index: 3;
  margin-top: auto;
  padding: 0 16px 14px;
}
.jyserai {
  font-weight: 900;
  font-size: 38px;
  line-height: 0.84;
  color: #f9e9ae;
  text-transform: uppercase;
  letter-spacing: -0.01em;
  text-shadow: 3px 4px 0 rgba(14, 33, 24, 0.8), 0 0 24px rgba(232, 200, 74, 0.35);
}
.themeBlock {
  display: block;
  margin-top: 8px;
  color: #7de08a;
  font-weight: 800;
  font-size: 13px;
  text-transform: uppercase;
  line-height: 1.3;
  text-shadow: 0 0 4px #d7f5da, 0 0 12px #4ab051, 0 0 22px #307335, 0 0 34px #245627;
}
.nameTag {
  margin-top: 8px;
  font-weight: 700;
  font-size: 10.5px;
  letter-spacing: 0.05em;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.footerRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 5px;
  padding-top: 5px;
  border-top: 1px dashed rgba(255, 255, 255, 0.3);
}
.details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.date {
  font-size: 9.5px;
  font-weight: 700;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}
.venue {
  font-size: 7.5px;
  opacity: 0.85;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}
.qrCard {
  background: #fff;
  border-radius: 8px;
  padding: 5px;
  border: 1px solid #e8c84a;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3), 0 6px 12px rgba(0, 0, 0, 0.35);
  line-height: 0;
  overflow: hidden;
}
.qrImg {
  width: 50px;
  height: 50px;
  display: block;
}
```

- [ ] **Step 2: Create the component**

Create `components/badge/Badge2.tsx`:

```tsx
import { cigibm } from "@/lib/content";
import type { BadgeTemplateProps } from "./Badge1";
import styles from "./Badge2.module.css";

export default function Badge2({ photoUrl, name, qrDataUrl }: BadgeTemplateProps) {
  return (
    <div className={styles.badge}>
      <div className={styles.photoFull}>
        {photoUrl && <img src={photoUrl} alt="" className={styles.photoImg} />}
      </div>
      <div className={styles.topRow}>
        <span className={styles.brand}>CIGIBM</span>
        <div className={styles.seal}>
          <span className={styles.sealNum}>4e</span>
          <span className={styles.sealLbl}>Édition</span>
        </div>
      </div>
      <div className={styles.lower}>
        <p className={styles.jyserai}>
          J&apos;Y
          <br />
          SERAI
        </p>
        <span className={styles.themeBlock}>{cigibm.nextEdition.theme}</span>
        <p className={styles.nameTag}>{name.toUpperCase()}</p>
        <div className={styles.footerRow}>
          <div className={styles.details}>
            <span className={styles.date}>{cigibm.nextEdition.dates}</span>
            <span className={styles.venue}>{cigibm.nextEdition.venue}</span>
          </div>
          <div className={styles.qrCard}>
            {qrDataUrl && <img src={qrDataUrl} alt="Code QR" className={styles.qrImg} />}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit -p .`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/badge/Badge2.tsx components/badge/Badge2.module.css
git commit -m "feat: add badge template 2 (CIGIBM TV-promo style)"
```

---

### Task 9: Badge Template 3 (restored poster style)

**Files:**
- Create: `components/badge/Badge3.tsx`
- Create: `components/badge/Badge3.module.css`

**Interfaces:**
- Produces: `<Badge3 photoUrl={string | null} name={string} qrDataUrl={string | null} />` — same `BadgeTemplateProps` (Task 7).
- Consumes: `BadgeTemplateProps` (Task 7), `cigibm` from `@/lib/content`.

Ports `badge-template3-restored.html`'s final CSS — the only one of the three with a rectangular (not circular) photo frame, and the only one with the QR on the left / date+venue on the right (confirmed deliberate during brainstorming, not a mistake to "fix" back to matching the other two).

- [ ] **Step 1: Create the CSS Module**

Create `components/badge/Badge3.module.css`:

```css
.badge {
  width: 320px;
  aspect-ratio: 4 / 5;
  border-radius: 18px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 16px 38px rgba(0, 0, 0, 0.35);
  font-family: var(--font-display), Georgia, serif;
  border: 1px solid rgba(232, 200, 74, 0.35);
  background:
    radial-gradient(circle at 88% 6%, rgba(232, 200, 74, 0.1) 0 1.5px, transparent 1.5px) 0 0/24px 24px,
    radial-gradient(circle at 60% 100%, rgba(255, 255, 255, 0.05), transparent 60%),
    linear-gradient(165deg, #0e2118 0%, #183a1a 42%, #245627 75%, #307335 100%);
  color: #fcfdfd;
  display: flex;
  flex-direction: column;
  padding: 14px 16px 0;
}
.badge p {
  margin: 0;
}

.ribbon {
  position: absolute;
  top: 16px;
  right: -34px;
  width: 130px;
  background: linear-gradient(135deg, #f3dd8a, #e8c84a 55%, #c9a536);
  color: #1a2f16;
  font-family: var(--font-sans), sans-serif;
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.06em;
  text-align: center;
  padding: 4px 0;
  transform: rotate(40deg);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.35);
  z-index: 2;
}

.masthead {
  font-family: var(--font-sans), sans-serif;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  text-align: center;
  padding-bottom: 3px;
  margin-bottom: 1px;
  border-bottom: 1px solid rgba(232, 200, 74, 0.3);
}

.neon {
  font-family: var(--font-sans), sans-serif;
  font-weight: 900;
  font-size: 22px;
  letter-spacing: 0.05em;
  text-align: center;
  margin-top: 3px;
  color: #fff;
  text-shadow: 0 0 4px #fff, 0 0 12px #f3dd8a, 0 0 22px #e8c84a, 0 0 38px #c9a536;
}
.motto {
  font-family: var(--font-script), cursive;
  font-style: italic;
  font-size: 11px;
  text-align: center;
  margin-top: 3px;
  color: #f3dd8a;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.motto::before,
.motto::after {
  content: "";
  width: 20px;
  height: 1px;
  background: rgba(232, 200, 74, 0.5);
}

.photoGlow {
  margin: 1px auto 0;
  width: 168px;
  position: relative;
  display: flex;
  justify-content: center;
}
.photoGlow::before {
  content: "";
  position: absolute;
  inset: -20px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(87, 154, 209, 0.55), rgba(232, 200, 74, 0.25) 55%, transparent 75%);
  filter: blur(2px);
}
.photoFrame {
  width: 168px;
  height: 168px;
  border-radius: 14px;
  padding: 4px;
  background: linear-gradient(135deg, #e8c84a, #8a6f22);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
  position: relative;
  z-index: 1;
}
.photoBox {
  width: 100%;
  height: 100%;
  border-radius: 11px;
  overflow: hidden;
  background: linear-gradient(135deg, #87b7de, #3684c4);
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-shadow: inset 0 -30px 40px -10px rgba(0, 0, 0, 0.35);
}
.photoImg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.script {
  font-family: var(--font-script), cursive;
  font-size: 48px;
  color: #f9e9ae;
  text-align: center;
  margin-top: 3px;
  line-height: 1;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.6), 0 0 26px rgba(232, 200, 74, 0.45);
}
.nameTag {
  margin-top: 5px;
  text-align: center;
  font-family: var(--font-sans), sans-serif;
  font-weight: 700;
  font-size: 10.5px;
  letter-spacing: 0.05em;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.footerRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 0;
  padding-top: 2px;
  border-top: 1px dashed rgba(255, 255, 255, 0.3);
}
.details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: right;
}
.date {
  font-family: var(--font-sans), sans-serif;
  font-size: 9.5px;
  font-weight: 700;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}
.venue {
  font-family: var(--font-sans), sans-serif;
  font-size: 7.5px;
  opacity: 0.85;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}
.qrCard {
  background: #fff;
  border-radius: 8px;
  padding: 5px;
  border: 1px solid #e8c84a;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3), 0 6px 12px rgba(0, 0, 0, 0.35);
  line-height: 0;
  overflow: hidden;
}
.qrImg {
  width: 50px;
  height: 50px;
  display: block;
}
```

- [ ] **Step 2: Create the component**

Create `components/badge/Badge3.tsx`:

```tsx
import { cigibm } from "@/lib/content";
import type { BadgeTemplateProps } from "./Badge1";
import styles from "./Badge3.module.css";

export default function Badge3({ photoUrl, name, qrDataUrl }: BadgeTemplateProps) {
  return (
    <div className={styles.badge}>
      <div className={styles.ribbon}>ÉDITION 4</div>
      <p className={styles.masthead}>ONG Triomphe de l&apos;Intérieur</p>
      <p className={styles.neon}>CIGIBM</p>
      <p className={styles.motto}>{cigibm.nextEdition.theme}</p>
      <div className={styles.photoGlow}>
        <div className={styles.photoFrame}>
          <div className={styles.photoBox}>
            {photoUrl && <img src={photoUrl} alt="" className={styles.photoImg} />}
          </div>
        </div>
      </div>
      <p className={styles.script}>J&apos;y serai</p>
      <p className={styles.nameTag}>{name.toUpperCase()}</p>
      <div className={styles.footerRow}>
        <div className={styles.qrCard}>
          {qrDataUrl && <img src={qrDataUrl} alt="Code QR" className={styles.qrImg} />}
        </div>
        <div className={styles.details}>
          <span className={styles.date}>{cigibm.nextEdition.dates}</span>
          <span className={styles.venue}>{cigibm.nextEdition.venue}</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit -p .`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/badge/Badge3.tsx components/badge/Badge3.module.css
git commit -m "feat: add badge template 3 (restored poster style)"
```

---

### Task 10: Badge generator (picker, upload, export)

**Files:**
- Create: `components/badge/BadgeGenerator.tsx`
- Modify: `package.json`, `package-lock.json` (via `npm install`)

**Interfaces:**
- Produces: `<BadgeGenerator fullName={string} attendanceToken={string} />` — the component Task 11's page renders.
- Consumes: `Badge1`/`Badge2`/`Badge3` (Tasks 7-9), `BadgeTemplateProps` (Task 7), `generateQrDataUrl` (Task 3), `compressPhoto` from `@/lib/client/compressImage` (existing).

- [ ] **Step 1: Install the rasterization dependency**

Run: `npm install html-to-image`

- [ ] **Step 2: Write the component**

Create `components/badge/BadgeGenerator.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { compressPhoto } from "@/lib/client/compressImage";
import { generateQrDataUrl } from "@/lib/qr";
import Badge1 from "./Badge1";
import Badge2 from "./Badge2";
import Badge3 from "./Badge3";

const TEMPLATES = [
  { id: 1, label: "Certificat", Component: Badge1 },
  { id: 2, label: "Affiche TV", Component: Badge2 },
  { id: 3, label: "Poster", Component: Badge3 },
] as const;

export default function BadgeGenerator({ fullName, attendanceToken }: { fullName: string; attendanceToken: string }) {
  const [templateId, setTemplateId] = useState<(typeof TEMPLATES)[number]["id"]>(1);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    generateQrDataUrl(attendanceToken).then(setQrDataUrl);
  }, [attendanceToken]);

  // Revoke the previous object URL whenever the photo changes or the
  // component unmounts, so we don't leak blob: URLs as visitors try
  // multiple photos before downloading.
  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressPhoto(file);
    setPhotoUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return URL.createObjectURL(compressed);
    });
  }

  async function handleDownload() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3 });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "jy-serai-cigibm-2026.png";
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  const ActiveTemplate = TEMPLATES.find((t) => t.id === templateId)!.Component;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTemplateId(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              t.id === templateId ? "bg-leaf-500 text-leaf-950" : "bg-mist-50/10 text-mist-50/70 hover:bg-mist-50/20"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div ref={cardRef}>
        <ActiveTemplate photoUrl={photoUrl} name={fullName} qrDataUrl={qrDataUrl} />
      </div>

      <label className="cursor-pointer rounded-full border border-mist-50/25 px-6 py-3 text-sm font-semibold text-mist-50 transition-colors hover:bg-mist-50/10">
        {photoUrl ? "Changer la photo" : "Ajouter ma photo"}
        <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
      </label>

      <button
        type="button"
        onClick={handleDownload}
        disabled={!photoUrl || downloading}
        className="rounded-full bg-leaf-500 px-8 py-3.5 text-sm font-semibold text-leaf-950 transition-opacity disabled:opacity-40"
      >
        {downloading ? "Préparation…" : "Télécharger mon badge"}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit -p .`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/badge/BadgeGenerator.tsx package.json package-lock.json
git commit -m "feat: add badge generator (template picker, photo upload, PNG export)"
```

---

### Task 11: Badge page route

**Files:**
- Create: `app/(funnel)/cigibm-2026/badge/[token]/page.tsx`
- Create: `app/(funnel)/cigibm-2026/badge/[token]/page.test.tsx`

**Interfaces:**
- Consumes: `BadgeGenerator` (Task 10), `db` from `@/lib/db`.

- [ ] **Step 1: Write the failing test**

Create `app/(funnel)/cigibm-2026/badge/[token]/page.test.tsx`. No `@vitest-environment node` pragma here, unlike some of the other new test files in this plan — this one needs `render`/`screen`, which need the DOM jsdom (the project default) provides; the Prisma calls below work fine under jsdom too:

```tsx
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
```

- [ ] **Step 2: Run to confirm it fails**

Run: `npx vitest run "app/(funnel)/cigibm-2026/badge/[token]/page.test.tsx"`
Expected: FAIL — `./page` module does not exist yet.

- [ ] **Step 3: Write the page**

Create `app/(funnel)/cigibm-2026/badge/[token]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { db } from "@/lib/db";
import BadgeGenerator from "@/components/badge/BadgeGenerator";

export const metadata: Metadata = {
  title: "Mon badge « J'y serai », CIGIBM 2026",
  robots: { index: false },
};

export default async function BadgePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const participant = await db.participant.findUnique({ where: { attendanceToken: token } });

  if (!participant) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-leaf-950 px-6 text-center">
        <p className="text-mist-50">
          Lien invalide. Vérifiez le lien reçu par email, ou{" "}
          <a href="/cigibm-2026" className="underline">
            inscrivez-vous
          </a>{" "}
          si ce n&apos;est pas déjà fait.
        </p>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-leaf-950 px-6 py-16">
      <div className="mx-auto max-w-md">
        <h1 className="mb-8 text-center font-display text-2xl text-mist-50">Votre badge « J&apos;y serai »</h1>
        <BadgeGenerator fullName={participant.fullName} attendanceToken={participant.attendanceToken} />
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run the test again to confirm it passes**

Run: `npx vitest run "app/(funnel)/cigibm-2026/badge/[token]/page.test.tsx"`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add "app/(funnel)/cigibm-2026/badge/[token]"
git commit -m "feat: add public badge generator page"
```

---

### Task 12: Wire the registration flow to the badge page

**Files:**
- Modify: `app/api/cigibm-register/route.ts`
- Modify: `app/api/cigibm-register/route.test.ts`
- Modify: `app/(funnel)/cigibm-2026/merci/page.tsx`

**Interfaces:**
- Consumes: nothing new.

The final redirect on a successful registration needs to carry the participant's `attendanceToken` so `/merci` can link to their badge. The duplicate-registration branch (`?deja=1`) is untouched — it never reaches `/merci`.

- [ ] **Step 1: Add a failing assertion to the existing registration test**

In `app/api/cigibm-register/route.test.ts`, extend the first test (`"creates a Participant row tied to édition 4 on successful registration"`, around line 56) to also assert the redirect carries the token:

```ts
  it("creates a Participant row tied to édition 4 on successful registration", async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ id: 1 }), { status: 201 })) as typeof fetch;

    const { POST } = await import("./route");
    const email = `newparticipant${TEST_EMAIL_DOMAIN}`;
    const response = await POST(buildRequest({ name: "New Participant", phone: "0100000010", email, consent: "1" }));

    const edition4 = await db.edition.findUniqueOrThrow({ where: { number: 4 } });
    const participant = await db.participant.findFirst({ where: { email } });

    expect(participant).not.toBeNull();
    expect(participant?.editionId).toBe(edition4.id);
    expect(participant?.registrationSource).toBe("form");
    expect(participant?.phone).toBe("+2290100000010");
    expect(response.headers.get("location")).toContain(`/cigibm-2026/merci?badge=${participant?.attendanceToken}`);
  });
```

- [ ] **Step 2: Run to confirm it fails**

Run: `npx vitest run app/api/cigibm-register/route.test.ts -t "creates a Participant row"`
Expected: FAIL — the current redirect location doesn't contain `?badge=`.

- [ ] **Step 3: Update the route to carry the token**

In `app/api/cigibm-register/route.ts`, the final line (359) currently reads:

```ts
  return NextResponse.redirect(`${origin}/cigibm-2026/merci`, 303);
```

This runs after the `create()`/`update()` block, but neither branch currently keeps a reference to the resulting row's token in a variable available here. Add one: right after the `let isDuplicate = false;` / `let shouldNotifyAmbassador = false;` / `let edition4...` declarations (around line 139), add:

```ts
  let attendanceToken: string | null = null;
```

Then, in the `create()` success path (inside the `try` block starting around line 241), after `await db.participant.create({ ... })` capture the return value instead of discarding it:

```ts
        const created = await db.participant.create({
          data: {
            editionId: edition4.id,
            fullName: name,
            phone,
            email,
            consent: true,
            registrationSource: "form",
            ambassadorId: ambassador?.id,
          },
        });
        attendanceToken = created.attendanceToken;
        shouldNotifyAmbassador = ambassador !== null;
```

And in the P2002 update path (the `db.participant.update({ where: { editionId_email: ... } })` call around line 280), capture its return value the same way:

```ts
          const updatedParticipant = await db.participant.update({
            where: { editionId_email: { editionId: edition4.id, email } },
            data: {
              fullName: name,
              phone,
              consent: true,
              ...(shouldBackfillAmbassador ? { ambassadorId: ambassador?.id } : {}),
            },
          });
          attendanceToken = updatedParticipant.attendanceToken;

          shouldNotifyAmbassador = shouldBackfillAmbassador;
```

Finally, change the last line of the file to:

```ts
  return NextResponse.redirect(
    attendanceToken ? `${origin}/cigibm-2026/merci?badge=${attendanceToken}` : `${origin}/cigibm-2026/merci`,
    303
  );
```

(The `attendanceToken ? ... : ...` fallback matters: if `edition4` was missing, or the Participant write failed for a reason other than P2002 — both already-handled, best-effort-only paths elsewhere in this file — `attendanceToken` stays `null` and the visitor still reaches a working `/merci`, just without a badge link. Losing the badge link is an acceptable degradation; failing the whole registration because of it would not be.)

- [ ] **Step 4: Run the test again to confirm it passes**

Run: `npx vitest run app/api/cigibm-register/route.test.ts -t "creates a Participant row"`
Expected: PASS

- [ ] **Step 5: Run the full route test file to confirm nothing else broke**

Run: `npx vitest run app/api/cigibm-register/route.test.ts`
Expected: all tests PASS (the P2002/update path is already exercised by the existing "resubmission" tests in this file, which will now also flow through the new `attendanceToken` capture).

- [ ] **Step 6: Show the badge link on `/merci`**

In `app/(funnel)/cigibm-2026/merci/page.tsx`, change the component signature and add a link. Replace:

```tsx
export default function MerciPage() {
```

with:

```tsx
export default async function MerciPage({ searchParams }: { searchParams: Promise<{ badge?: string }> }) {
  const { badge } = await searchParams;
```

Then, inside the first `<Reveal scale>` block, right after the closing `</p>` of "Merci de nous faire confiance..." (around line 53), add:

```tsx
          {badge && (
            <a
              href={`/cigibm-2026/badge/${badge}`}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-leaf-500 px-7 py-3.5 text-sm font-semibold text-leaf-950 transition-colors hover:bg-leaf-400"
            >
              Créer mon badge « J&apos;y serai »
            </a>
          )}
```

- [ ] **Step 7: Type-check and run the full suite**

Run: `npx tsc --noEmit -p .` — expect no errors.
Run: `npm test` — expect all tests pass.

- [ ] **Step 8: Commit**

```bash
git add app/api/cigibm-register/route.ts app/api/cigibm-register/route.test.ts "app/(funnel)/cigibm-2026/merci/page.tsx"
git commit -m "feat: link to the badge generator from the confirmation page"
```

---

### Task 13: Wire the confirmation email to the badge page

**Files:**
- Modify: `lib/email.ts`
- Create: `lib/email.test.ts`
- Modify: `app/api/cigibm-register/route.ts`

**Interfaces:**
- Modifies: `buildConfirmationEmail(firstName: string)` → `buildConfirmationEmail(firstName: string, badgeUrl: string)`.

- [ ] **Step 1: Write the failing test**

Create `lib/email.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildConfirmationEmail } from "./email";

describe("buildConfirmationEmail", () => {
  it("includes a link to the badge page", () => {
    const message = buildConfirmationEmail("Aïcha", "https://ongtriomphedelinterieur.com/cigibm-2026/badge/abc123");

    expect(message.html).toContain("https://ongtriomphedelinterieur.com/cigibm-2026/badge/abc123");
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

Run: `npx vitest run lib/email.test.ts`
Expected: FAIL — `buildConfirmationEmail` currently only accepts one argument, and the badge URL isn't in the output.

- [ ] **Step 3: Update `buildConfirmationEmail`**

In `lib/email.ts`, change the function signature (line 123) from:

```ts
export function buildConfirmationEmail(firstName: string) {
```

to:

```ts
export function buildConfirmationEmail(firstName: string, badgeUrl: string) {
```

Then, right before the closing `${ctaButton("Voir les détails du congrès", ...)}` line (153), add a second button:

```ts
    ${ctaButton("Créer mon badge « J'y serai »", badgeUrl)}
    ${ctaButton("Voir les détails du congrès", `${SITE_URL}/cigibm-2026`)}
```

- [ ] **Step 4: Run the test again to confirm it passes**

Run: `npx vitest run lib/email.test.ts`
Expected: PASS

- [ ] **Step 5: Update the caller**

In `app/api/cigibm-register/route.ts`, the confirmation-email block (lines 299-307) currently reads:

```ts
    try {
      const message = buildConfirmationEmail(name);
      const emailRes = await sendTransactionalEmail(apiKey, { email, name }, message);
      if (!emailRes.ok) {
        console.error("Confirmation email failed", emailRes.status, await emailRes.text().catch(() => ""));
      }
    } catch (err) {
      console.error("Confirmation email request failed", err);
    }
```

`attendanceToken` is already in scope at this point (set by Task 12, a few lines above this block). Replace that whole block with:

```ts
    try {
      if (!attendanceToken) {
        console.error("Skipping confirmation email: no attendanceToken available", { email, name });
      } else {
        const message = buildConfirmationEmail(name, `${origin}/cigibm-2026/badge/${attendanceToken}`);
        const emailRes = await sendTransactionalEmail(apiKey, { email, name }, message);
        if (!emailRes.ok) {
          console.error("Confirmation email failed", emailRes.status, await emailRes.text().catch(() => ""));
        }
      }
    } catch (err) {
      console.error("Confirmation email request failed", err);
    }
```

- [ ] **Step 6: Type-check and run the full suite**

Run: `npx tsc --noEmit -p .` — expect no errors.
Run: `npm test` — expect all tests pass, including `app/api/cigibm-register/route.test.ts`'s existing confirmation-email-related tests (they mock `fetch`, not `buildConfirmationEmail`, so they exercise this real code path).

- [ ] **Step 7: Commit**

```bash
git add lib/email.ts lib/email.test.ts app/api/cigibm-register/route.ts
git commit -m "feat: include the badge link in the confirmation email"
```

---

## Manual end-to-end verification (after all tasks)

Automated tests cover the data/logic layer; the visual/interactive layer needs a real run:

1. `npm run dev`
2. Register a test participant at `/cigibm-2026`.
3. Follow the "Créer mon badge" link from `/merci` (or copy the `?badge=` token from the redirect URL if testing without email delivery configured).
4. On `/cigibm-2026/badge/<token>`: switch between all 3 templates, upload a photo, confirm the live preview updates, download the PNG, and open the downloaded file to confirm it looks right at full resolution (not just in the browser preview).
5. Log in as an admin, confirm the "Scanner" nav link works and `/admin/scan` loads the camera.
6. On a second device (or the same one), open the downloaded badge PNG and point the scanner's camera at its QR code — confirm it reports success and shows the participant's name.
7. Scan the same QR again — confirm it reports "already checked in" with the original time, not a second success.
8. Log in with a `scanner`-role account (create one via `db:studio` if none exists) and confirm it lands on `/admin/scan` directly and cannot reach `/admin/participants` or any other CRM page.
