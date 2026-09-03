# "J'y serai" shareable badge + QR check-in — design spec

## Goal

Give each CIGIBM 2026 registrant a personal, shareable "J'y serai" image (their
photo composited onto a branded template, alongside their name and a personal
QR code) that also doubles as their entry pass: the same QR gets scanned at
the door to mark attendance.

Two previously-separate ideas converge here on purpose: the schema already had
unused groundwork for door check-in (`Participant.attendanceToken`,
`attendedAt`, `checkedInByAdminId`, `AdminRole.scanner`,
`RegistrationSource.qr_walkin`), and the brainstorming session confirmed the
badge's QR should be wired to that real flow from day one rather than shipped
as a decorative placeholder.

## Scope decisions (confirmed during brainstorming)

- QR encodes the participant's real `attendanceToken` and is scanned by a real
  admin-side check-in flow — not a placeholder link.
- The badge page is reachable two ways: a link on `/cigibm-2026/merci` right
  after registering, and the same link included in the confirmation email —
  so it's not a one-time-only surface.
- Three template designs ship (not two, per the final iteration of this
  session) — participant picks whichever they like before uploading their
  photo.
- Templates are code-driven (React/CSS), not externally supplied design
  files, so they stay easy to tweak.
- The badge shows the participant's name (pulled from their registration),
  not just their photo.
- The check-in scanner page is restricted to accounts with `role: "scanner"`
  (full admins can reach it too); it is **not** available to every logged-in
  admin the way the rest of the CRM is.
- No new database field is needed for "which template a participant chose" —
  the badge page is stateless per visit; picking a template and generating
  the image is a client-side, ephemeral action with no downstream effect on
  check-in (only the token matters there). Revisiting the badge link lets
  them pick again, including a different template.

## The three templates

All three are portrait cards, 4:5 aspect ratio (base size 320×400 for the
verified CSS below; the real build renders at a larger export resolution —
see "Rendering approach"). Each was iterated live during brainstorming and
verified with a headless-browser measurement pass (Playwright) to confirm no
content clips — a real bug found along the way (see "Known pitfalls").
Common content across all three: ONG name, "CIGIBM" mark, edition 4 marker,
the motto "Le vaccin de la dépression", the participant's photo, "J'y serai"
in script type, the participant's name, the event date/venue, and their QR
code.

The verified CSS/markup for each currently lives in
`.superpowers/brainstorm/1548-1788441796/content/` from this session
(`badge-final-v4.html`, `badge-tv-v3.html`, `badge-template3-restored.html`).
That directory is a brainstorming scratch space, not part of the repo — an
implementation task should port each one into a real component and must not
assume that directory still exists later. The descriptions below are the
spec of record; the HTML files are a reference implementation detail.

### Template 1 — dark green certificate, Christelle's "vaccin" watermark

- Deep green gradient background with a subtle dot-grid texture, gold-bordered
  card.
- Header row: "ONG Triomphe de l'Intérieur · CIGIBM" on one line (small caps,
  "CIGIBM" in gold) on the left; a round gold seal reading "4ᵉ Édition" on the
  right.
- Motto in gold script below the header divider.
- A large circular photo (participant's upload), gold ring frame, soft gold
  ambient glow behind it.
- Below the photo: the real campaign photo `public/images/christelle-avec-le-vaccin.jpg`
  (Christelle in scrubs, syringe held in a heart shape by gloved hands) used
  as a full-card background watermark — cropped to exclude her face entirely
  (crop starts below the chin), tinted dark green, low-key so it never
  competes with the participant's own photo.
- "J'y serai" in large gold script, then the participant's name in small caps.
- Footer: date/venue (left) + a QR code in a white, gold-bordered card (right).

### Template 2 — CIGIBM "TV-promo" style

- Full-bleed photo area (participant's upload) filling roughly the top 60% of
  the card, fading to dark at the top and bottom edges for legibility.
- Top row: "CIGIBM" as a neon-glow wordmark (white text, layered gold glow)
  on the left; a round gold seal "4ᵉ Édition" on the right.
- Bottom section (pinned to the card's bottom): huge bold stacked "J'Y /
  SERAI" in gold with a hard drop-shadow; "Le vaccin de la dépression" as a
  neon-glow green line (no background pill — it's meant to glow, not sit in a
  box); the participant's name; then the same date/venue + QR footer pattern
  as template 1, styled to match it exactly (same QR size, same gold-bordered
  white card, same text sizing) for visual consistency across templates.

### Template 3 — restored "original poster" style

- Same dark green textured background as template 1, but **no** watermark.
- A gold ribbon reading "ÉDITION 4" across the top-right corner (diagonal),
  instead of the round seal.
- "CIGIBM" as a neon-glow wordmark (replacing a full descriptive congress
  headline that didn't fit well at this size).
- A large **rectangular**, gold-framed photo (not circular) with a soft
  blue/gold ambient glow behind it — closest to the very first reference
  poster the ONG supplied at the start of this conversation.
- "J'y serai" in large gold script, centered.
- The participant's name, centered, on its own line under the script.
- Footer: **QR on the left**, date/venue on the right (deliberately mirrored
  from templates 1 & 2 — confirmed explicitly during review, not an
  oversight).

## Known pitfalls to avoid re-discovering during implementation

- **`<p>` default margins.** Browsers give `<p>` elements an invisible
  `1em` top+bottom margin by default. Every template's CSS resets this
  (`p { margin: 0; }`) and applies spacing explicitly instead. Skipping this
  reset silently overflows a fixed-height card — this was the actual root
  cause behind a long stretch of "the footer/QR keeps getting clipped"
  reports during brainstorming, not the photo size or QR size as it first
  appeared.
- **Verify layout with a real headless browser, not by eyeballing generated
  HTML or computing box heights by hand.** Manual arithmetic on this project
  was repeatedly wrong (browser font-metrics and margin-collapse rules don't
  match naive estimates). Whatever renders the final export (see below)
  should be checked against its actual content height vs. the fixed card
  height before considering a template "done", the same way this session
  used Playwright (`getBoundingClientRect`) to confirm fit before showing a
  revision.
- Template 1's watermark crop coordinates (`background-size`/
  `background-position` in the reference CSS) were tuned by hand against the
  specific source image; if that source photo ever changes, the crop needs
  re-tuning, not just a straight swap.

## Technical architecture

### Data flow

1. Registration (already shipped) creates/updates a `Participant` row with an
   `attendanceToken`.
2. `POST /api/cigibm-register` redirects to `/cigibm-2026/merci`. It needs to
   carry the participant's token so `/merci` can link to their badge:
   redirect to `/cigibm-2026/merci?badge=<attendanceToken>` instead of the
   bare path.
3. `/cigibm-2026/merci` reads `badge` from `searchParams` and, if present,
   shows a "Créez votre badge « J'y serai »" link to
   `/cigibm-2026/badge/<token>`. The confirmation email
   (`buildConfirmationEmail` in `lib/email.ts`, called from
   `app/api/cigibm-register/route.ts`) gets the same link with the same
   token, so the visitor can find it again later without digging through
   browser history.
4. `/cigibm-2026/badge/[token]` (new public route): server component looks up
   the `Participant` by `attendanceToken`. Unknown/invalid token → a plain
   "lien invalide" message, not a hard 404 crash. Valid token → renders a
   client component with the participant's `fullName` and the event content
   already in `lib/content.ts` (`cigibm.nextEdition`).
5. That client component: lets the visitor pick one of the 3 templates,
   upload a photo (client-side compression via the existing
   `lib/client/compressImage.ts`, the same helper already used for ambassador
   photo uploads), and renders a live preview. A "Télécharger mon badge"
   button rasterizes the composited card to a PNG the visitor saves locally
   (no upload to the server — this is a client-only, ephemeral render, same
   trust boundary as the reference watermark image being a static public
   asset).

### Rendering approach

Recommend rendering the actual styled template markup (real DOM, real CSS —
port each template's verified CSS from this session into a React component)
into an off-screen container with the visitor's photo, name, and a generated
QR code slotted in, then rasterizing that DOM to a PNG with a library such as
`html-to-image` (or `dom-to-image-more`) rather than hand-translating the
gradients/shadows/neon text-shadow glows into raw `<canvas>` drawing calls.
The templates lean heavily on CSS effects (radial gradients, multi-layer
text-shadow glows, `border-radius`, blend-adjacent watermark treatment on
template 1) that are cheap in CSS and expensive to reimplement by hand in
Canvas. Export at a higher resolution than the 320×400 preview (e.g. render
the container at 3x scale, ~960×1200) so the downloaded image looks sharp
when shared on WhatsApp/Instagram.

### QR generation (badge page)

Generate the QR client-side with the `qrcode` package, encoding the raw
`attendanceToken` as plain text — not a URL. A public GET link that marks
someone present on load would let anyone self-check-in by just opening it;
keeping the QR payload to a bare token means the *scanner* (an authenticated
admin/scanner action) is the only thing that can turn "I decoded this token"
into "this person is marked present."

### Check-in scanner (new admin surface)

- New route `/admin/scan`, **not** nested under the existing
  `app/(admin)/admin/(protected)/` route group (that group's layout calls
  `requireAdmin()`, which is strictly `role === "admin"` and is relied on
  elsewhere — e.g. ambassador/message server actions — so it must stay
  strict). Add a new guard, e.g. `requireScanAccess()` in `lib/admin/auth.ts`,
  that accepts `role === "admin" || role === "scanner"` and redirects to
  `/admin/login` otherwise. `/admin/scan` gets its own minimal chrome (no
  CRM sidebar) using that guard.
- Fix the current dead end: `app/(admin)/admin/(protected)/layout.tsx` calls
  `requireAdmin()` directly, which bounces a scanner-role session to
  `/admin/login?acces=refuse` — there is currently no working destination for
  a scanner account at all. Change that layout to check the session itself
  (`getAdminSession()`) and redirect a non-admin, authenticated session to
  `/admin/scan` instead of the login error page. `requireAdmin()` itself
  should NOT change — other callers depend on it staying admin-only.
- Add a "Scanner" entry to `AdminSidebarNav`/`AdminBottomNav`
  (`app/(admin)/admin/(protected)/AdminNav.tsx`) so full admins can reach it
  from inside the CRM too. The mobile bottom-nav comment in that file already
  anticipated this ("l'usage de référence (scan QR le jour du congrès) se
  fait au téléphone, à une main") — the design was already planned around
  this, it just wasn't built.
- Scan page: camera-based QR decode (getUserMedia video + a decode library
  such as `jsqr` sampling frames onto a canvas) plus a manual fallback (search
  by name/phone) for bad lighting or camera failures on the actual event day
  — a pure-camera flow with no fallback is a single point of failure for a
  live event.
- On a decoded/submitted token: look up `Participant` by `attendanceToken`.
  - Unknown token → clear "billet invalide" state, no write.
  - Known, `attendedAt` already set → show "déjà enregistré à HH:MM" (their
    name + original check-in time), no second write — must not silently
    overwrite an existing check-in on a rescan.
  - Known, not yet attended → a server action sets `attendedAt = now()` and
    `checkedInByAdminId = <scanner's own id>`, then shows the participant's
    name + photo-derived confirmation (name is enough; there's no stored
    photo to show) so staff can visually confirm it's the right person before
    waving them in.

## Testing

- `route.test.ts`-style coverage for the new check-in server action: marks
  attendance once, is a no-op (not an error, not a double-write) on a
  rescan, rejects an unknown token, and enforces `requireScanAccess()`.
- A test for `/cigibm-2026/badge/[token]` covering: valid token renders with
  the participant's name; invalid/unknown token renders the "lien invalide"
  state instead of throwing.
- No test coverage is expected for the client-side rasterization itself
  (canvas/image export) — treat that as a manually-verified UI path, per the
  project's existing pattern for other client-only visual flows.

## Explicitly out of scope

- Any change to the registration flow itself (`POST /api/cigibm-register`)
  beyond adding the `?badge=` query param to its redirect.
- Editing a badge after it's generated (no persistence of the composited
  image; visitors can always revisit the link and regenerate).
- Bulk/CSV check-in or an offline scanning mode.
