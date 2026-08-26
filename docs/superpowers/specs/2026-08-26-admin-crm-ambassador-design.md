# Smart Admin CRM + Ambassador Program — Design

Status: approved by user, pending spec review before implementation planning.
Owner context: ONG Triomphe de l'Intérieur, CIGIBM annual congress (currently building toward the 4th édition, Oct 17–18 2026).

## 1. Problem & scope

The public marketing site (Next.js on Vercel) currently sends CIGIBM 2026 registrations straight to Brevo (email marketing) with no local database — there's no way to see who's registered in one place, no attendance tracking, and no way to attribute registrations to the people helping recruit them (ambassadors).

This project adds:
- An authenticated admin CRM (new route group in the same Next.js app) for a small trusted team (2-10 people).
- A database (previously none existed) that becomes the source of truth for participants, ambassadors, and messaging history — Brevo remains the send provider for email/SMS, but is no longer the only record of who registered.
- A QR-code-based attendance flow for event-day check-in.
- An ambassador/referral program, both in the admin CRM and as a public-facing section on the site.

This is **new subsystem work**, not a modification of an existing flow. Building it changes the site's architecture (adds a database and auth where none existed) and touches one existing route (`/api/cigibm-register` gains a second write, to the new database, alongside its existing Brevo call).

## 2. Research: WhatsApp group member limits

No official mechanism exists for unlimited WhatsApp group members, from Meta or any legitimate third party:

| Mechanism | Real limit |
|---|---|
| Regular WhatsApp group | 1,024 members (hard cap) |
| WhatsApp Communities (umbrella of sub-groups) | ~2,000 total, split across sub-groups of ≤1,024 each |
| WhatsApp Business Platform Groups API (Meta's official API) | 8 participants per group, no add-participant endpoint, requires an Official Business Account |
| Third-party "unlimited member" tools | Not legitimate — these automate WhatsApp Web sessions in violation of WhatsApp's Terms of Service and risk the business number being banned |

**Conclusion**: the correct mechanism for reaching CIGIBM's full participant base isn't a group at all — it's the WhatsApp Business Platform's **broadcast/template messaging to opted-in contacts**, which has no participant cap. This is the same infrastructure this project's "WhatsApp channel" in the messaging system is built around (see §7), so pursuing "bigger groups" would be the wrong direction even if it were possible.

Sources: Unipile WhatsApp Group API guide, Meta for Developers Groups API docs, inviter.co WhatsApp Communities limit reference, wha.tools 2026 limits table.

## 3. Decisions already made (with the user)

- **Admin team size**: small, trusted, 2-10 people. Simple role model is sufficient — no need for granular permissions. `admin` has full access (participants, messaging, ambassadors, scanning). `scanner` is restricted to the `/admin/scan` screen only — for day-of-event volunteers who need check-in access but nothing else.
- **Database + Auth**: Supabase (Postgres + built-in Auth). Chosen over Vercel Postgres+Auth.js or Vercel Postgres+Clerk specifically to avoid hand-building session/password-reset logic, and to keep data + auth in one vendor.
- **Attendance window**: literally **only Oct 17, 2026**, despite the event running Oct 17–18. User confirmed this explicitly after the tension with the 2-day event was flagged. Admin accounts with `testBypass = true` can scan anytime, for testing.
- **QR token design**: an opaque, cryptographically random per-participant token (not a signed JWT). Chosen because a database lookup is required regardless (to check duplicate check-in, attribute ambassador stats), so a signed token's main advantage — verification without hitting the database — provides no real benefit here. Simpler, no key management.
- **Offline handling**: lightweight client-side retry queue (queue failed scans in local storage, auto-retry on reconnect, visible pending-count badge) — not full offline-first (which would require syncing the entire participant list to the device and handling conflicts). Explicit limitation accepted: if the phone is offline at the exact moment of a scan, the app cannot yet distinguish "already registered" from "not found" and will show a retry prompt instead of guessing.
- **WhatsApp Business API**: not set up yet. Messaging system is built with WhatsApp as a pluggable channel behind the same interface as Email/SMS, but it will not be functional until the ONG completes Meta Business verification and provider setup (external, non-technical dependency — not something built as part of this project, matches how the Brevo API key was supplied after the fact in the parent project).
- **SMS provider**: Brevo (same account/key already used for email), rather than adding a dedicated SMS vendor like Twilio. To be confirmed technically that Brevo SMS delivers cleanly to +229 (Bénin) numbers before the team relies on it operationally.
- **Ambassador public section placement**: on the `/cigibm-2026` funnel page (not a separate page) — referred visitors land there, so ambassador social proof appears exactly where conversion happens. Reuses the existing sliding-card carousel pattern already built for the homepage's media-coverage section.
- **Ambassador WhatsApp contact**: `Ambassador` gets an optional `whatsappNumber` field, separate from `phone`, since these can differ (e.g. dual-SIM). Falls back to `phone` when not set.

## 4. Tech stack

- **App**: same Next.js 16 (App Router) project, new route group `app/(admin)/admin/...`. One Vercel deployment — no second app/repo.
- **Database**: Supabase Postgres.
- **Auth**: Supabase Auth (email/password) for the 2-10 admin accounts.
- **ORM**: Prisma — migrations + Prisma Studio give the team a fallback way to browse/edit raw data without every admin screen needing to be hand-built.
- **Email + SMS**: Brevo (existing account, existing API key already stored as a Vercel env var).
- **WhatsApp**: designed, not connected (see §3).
- **QR scanning**: browser camera access (`getUserMedia`) + `@zxing/browser` for continuous in-browser QR decoding. No native app.
- **QR generation**: `qrcode` npm package, server-side, rendered into the confirmation email and the `/cigibm-2026/merci` page.

## 5. Database schema

```prisma
enum AdminRole {
  admin
  scanner
}

enum RegistrationSource {
  form         // public site
  qr_walkin    // registered on the spot at the door
  admin_manual // added directly by an admin, outside the scan flow
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
  id                   Int       @id @default(autoincrement())
  number               Int       @unique   // 1, 2, 3, 4...
  theme                String
  dates                String
  venue                String
  hasParticipantData   Boolean   @default(false)  // false for éditions 1-3
  participants         Participant[]
  createdAt            DateTime  @default(now())
}

model Ambassador {
  id              String    @id @default(uuid())
  slug            String    @unique   // referral URL: /cigibm-2026?ref=<slug>
  fullName        String
  phone           String
  whatsappNumber  String?               // falls back to phone if unset
  email           String?
  photoUrl        String?               // public carousel
  bio             String?               // public carousel
  active          Boolean   @default(true)
  participants    Participant[]         // referred participants
  createdAt       DateTime  @default(now())
}

model Participant {
  id                  String    @id @default(uuid())
  editionId           Int
  edition             Edition   @relation(fields: [editionId], references: [id])

  fullName            String
  phone               String
  email               String?               // optional: fast walk-in registration
  consent             Boolean   @default(false)

  attendanceToken     String    @unique @default(cuid())  // QR payload
  registrationSource  RegistrationSource

  ambassadorId        String?
  ambassador          Ambassador? @relation(fields: [ambassadorId], references: [id])

  attendedAt          DateTime?             // null = not checked in
  checkedInByAdminId  String?

  registeredAt        DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([editionId])
  @@index([ambassadorId])
}

model AdminProfile {
  id          String   @id            // same UUID as Supabase auth.users
  fullName    String
  role        AdminRole @default(scanner)
  testBypass  Boolean   @default(false)      // can scan outside Oct 17, 2026
  createdAt   DateTime @default(now())
}

model MessagingLog {
  id                String        @id @default(uuid())
  channel           MessageChannel
  recipientPhone    String?
  recipientEmail    String?
  participantId     String?
  subject           String?
  status            MessageStatus @default(queued)
  providerMessageId String?
  errorMessage      String?
  batchId           String?
  batchLabel        String?
  sentByAdminId     String?
  sentAt            DateTime  @default(now())

  @@index([participantId])
  @@index([batchId])
}
```

Deliberate omissions:
- **No separate `Attendance` table** — collapsed into `attendedAt` / `checkedInByAdminId` on `Participant` since attendance only happens once, on one day. Revisit if a future event needs multi-day/multi-session check-in.
- **No separate `Referral` table** — attribution is the `ambassadorId` foreign key. Ambassador stats (referred count, attended count) are computed by querying participants, never stored redundantly, so they can never drift out of sync with reality.

## 6. Integration with the existing site

- `/api/cigibm-register` (existing route, currently only calls Brevo) gains a second write: create a `Participant` row (edition = current édition, `registrationSource = "form"`, `ambassadorId` resolved from the referral cookie if present). This must not break the existing Brevo integration — both writes happen; if the new database write fails, the existing behavior (Brevo contact + confirmation email + redirect to `/merci`) must still succeed, since Brevo is the participant's actual proof of registration today. Database write failures should be logged, not surfaced as a failed registration.
- The confirmation email (`lib/email.ts`, already built) gains an embedded QR code image (the participant's `attendanceToken`, rendered via `qrcode`).
- `/cigibm-2026/merci` gains an on-screen QR code as a redundant way to access it, in case the email isn't checked before the event.
- `/cigibm-2026` gains the referral-cookie capture (`?ref=<slug>` on page load) and the public ambassador sliding-card section.

## 7. QR attendance flow

**Scan screen** (`/admin/scan`, requires login): opens the phone's back camera on load, continuously decodes QR frames (no button press), POSTs the decoded token immediately, shows a "checking..." state before the network reply lands so it never feels frozen.

**Server logic, in order:**
1. Date gate: reject unless today is Oct 17, 2026 (Bénin time) or the admin has `testBypass = true`.
2. Lookup `Participant` by `attendanceToken`:
   - **Not found** → client shows the minimal walk-in form (name, phone, email optional, consent). Submitting creates the participant *and* marks them attended in one request.
   - **Found, not yet attended** → marked attended immediately; green confirmation with name (+ ambassador, if referred); auto-clears after ~2s and resumes scanning.
   - **Found, already attended** → amber (not red) "Already checked in at [time]" — expected, not an error.

**Offline**: failed network calls queue in local storage, retried automatically on reconnect, with a visible pending-count badge. See §3 for the accepted limitation when genuinely offline at scan time.

## 8. Ambassador program flow

**Admin**: create an ambassador (name, phone, WhatsApp number, email, photo, bio) → auto-generated unique slug → referral URL `ongtriomphedelinterieur.com/cigibm-2026?ref=<slug>`. Ambassador list shows live stats (referred / attended / rate), computed directly from `Participant` rows — no separate update step, so stats are always consistent the instant someone is checked in at the door.

**Capture**: visiting `/cigibm-2026?ref=<slug>` sets a short-lived cookie; registration reads it and attaches the matching ambassador to the new participant. No `ref` param → no attribution, matching the requirement that this is optional and most participants won't have one.

**Public display**: sliding-card section on `/cigibm-2026`, only `active` ambassadors, showing photo/name/bio/referred-count (not attendance — kept as an internal metric). Reads from the same database the admin CRM uses, so there's no separate "sync" system — it's the same data read from two surfaces.

## 9. Messaging system

- Compose from `/admin/messages/new`: channel (Email / SMS live; WhatsApp shown but disabled pending Business API setup), audience (by édition, non-attendees only, ambassadors, or manual selection), message, send.
- One `MessagingLog` row per recipient, grouped by `batchId` so the dashboard shows one line per send ("Rappel CIGIBM 2026 — 340 sent, 12 failed"), expandable to individual failures.
- Provider: Brevo, for both Email and SMS.

## 10. Build phasing

1. **Foundation** — Supabase setup, Prisma schema + migrations, admin login/RBAC, participants table per édition (1-3 show "data not available," 4 wired to real registrations via the updated `/api/cigibm-register`), messaging system (Email + SMS live, WhatsApp stubbed).
2. **QR attendance** — token generation, QR embedding in confirmation email + `/merci` page, `/admin/scan` flow, date gate.
3. **Ambassador program** — admin CRUD + dashboard, referral capture, public sliding-card section on `/cigibm-2026`.

Each phase ships something independently useful; phase 1 alone already gives the team a real CRM.

## 11. Explicitly out of scope (for now)

- WhatsApp Business API setup itself (external/non-technical, on the ONG's side).
- Multi-day / multi-session attendance tracking.
- Referral link click-tracking (only completed registrations are attributed).
- Granular per-permission RBAC beyond `admin` / `scanner` (team is small enough that this isn't warranted yet).
- Full offline-first scanning (works with zero connectivity).
