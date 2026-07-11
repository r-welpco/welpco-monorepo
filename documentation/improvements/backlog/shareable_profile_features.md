# Welpco — Shareable Welper Profile (SHARE) feature tickets

> **Source plan:** [../welper-shareable-profile-plan.md](../welper-shareable-profile-plan.md) · created 2026-07-10
> Status tags: 🔨 IN PROGRESS · 📋 PLANNED · ✅ SHIPPED · Format follows the repo backlog convention (priority / intent / acceptance criteria / effort / files).
> MVP = SHARE-001…006. V2 = 007…012. V3 = 013…016.

## MVP

### SHARE-001 — Work portfolio: storage, API, moderation state ✅ SHIPPED (BFF 2026-07-10 · web 2026-07-11)
- **Priority**: P1 (MVP core)
- **Intent**: welpers upload work photos (album per offering optional, captions, ordering); photos are `pending` until approved; public profile serves only `approved`.
- **Acceptance criteria**: presigned S3 upload (jpg/png/webp/heic, ≤10 MB, per-welper namespace — mirrors dispute-evidence pattern); CRUD for own photos (create/caption/reorder/delete); `GET` public returns approved only, ordered; photo count cap (24/welper); EXIF/GPS never served (client re-encode strips metadata — documented limitation until server-side processing exists).
- **Effort**: M
- **Files**: `apps/bff/src/domains/profile-management/` (entity `welper-portfolio-photo`, migration, service, controller routes), public read via service-discovery or profile public endpoint.
- **BFF shipped 2026-07-10** — entity `WelperPortfolioPhoto` + migration (`welper_portfolio_photos`, index on welper_id/status/sort_order); welper routes under `POST|GET /api/profiles/me/portfolio` (+`/presign`, `PATCH /reorder`, `PATCH|DELETE /:photoId`) with 24-photo cap (`409 PORTFOLIO_LIMIT_REACHED`), per-welper S3 namespace check, images-only presign (jpg/png/webp/heic ≤10 MB, 15-min PUT); public profile (`GET /api/search/welpers/:id` and by-handle) now returns `portfolioPhotos: [{id,url,caption,offeringId}]` (approved only, ordered, capped 24, public-bucket URLs like profilePhotoUrl); admin moderation `GET /api/admin/portfolio-photos?status=pending` + `PATCH /:id` (audit-logged; rejection notifies the welper, preference-aware). EXIF strip stays a client-side re-encode responsibility (documented limitation).
- **Web shipped 2026-07-11** — dashboard manager: "Portfolio" tab on `/dashboard/profile` (`welper-portfolio-panel.tsx`) with status chips (Pending review / Live / Not approved + `rejectionReason` surfaced verbatim), inline caption edit (200 chars), up/down reorder, AlertDialog delete (§17.6), 24-cap messaging, optional "Show under {offering}" association at upload time (create-only — the BFF PATCH doesn't accept `offeringId`), and the 48-hour review-expectation copy; en+fr under `dashboard.profile.portfolio`. **EXIF/GPS strip**: uploads are canvas re-encoded client-side (`lib/services/portfolio-service.ts` — decode via `createImageBitmap` `from-image` orientation with `<img>` fallback → downscale to 2048 px long edge → `toBlob('image/jpeg', 0.85)`), so only pixel data is PUT to S3; we always presign `image/jpeg`. HEIC is filtered from the client accept list (canvas can't decode it) with convert-to-JPG guidance. Public gallery: "Work photos" grid + Dialog lightbox in `app/welper/[id]/welper-profile-client.tsx`, approved-only, hidden entirely when empty; `portfolioPhotos` typed optional on `PublicWelperProfile`. Verified live against the local BFF: presign→PUT→create→caption→reorder→delete round-trip, admin approve, gallery + lightbox render, hidden-when-empty. ⚠️ Infra gap found during verification: the S3 bucket policy grants public read on `profiles/*` but **not** `portfolio/*` (objects 403) — approved photos won't display until the bucket policy is extended to the new prefix.

### SHARE-002 — Vanity handle ✅ SHIPPED (BFF 2026-07-10 · web claim UI 2026-07-11)
- **Priority**: P1 (MVP)
- **Intent**: `welpco.com/w/{handle}` — claimable once, resolves to the public profile.
- **Acceptance criteria**: `handle` column (unique, `^[a-z0-9][a-z0-9-]{2,29}$`, reserved-words list: admin, welpco, support, api, search, login, register…); claim endpoint (set-once; 409 on taken/reserved); public resolve endpoint; UUID URL keeps working; `/w/[handle]` web route renders the profile with canonical tag.
- **Effort**: S–M
- **Files**: BFF profile-management (+migration), `apps/web/app/w/[handle]/`.
- **BFF shipped 2026-07-10** — `handle` column (nullable, unique, lowercase) on `welper_profiles` + migration; `POST /api/profiles/me/handle` (welper-only, set-once): regex `^[a-z0-9][a-z0-9-]{2,29}$` → `400 INVALID_HANDLE`, reserved list in `sharing/handle.constants.ts` → `409 HANDLE_RESERVED`, `409 HANDLE_ALREADY_SET` / `409 HANDLE_TAKEN` (incl. unique-index race); public resolver `GET /api/search/welpers/by-handle/:handle` returns the identical public-profile payload (404 for unknown/not-visible — no hidden-profile oracle); `handle` included in the public payload and in `GET /api/profiles/me` for welpers. UUID URL keeps working. Kept 🔨 until the web claim UI exists (the `/w/[handle]` route from SHARE-003 unblocks once web wires the claim flow).

### SHARE-003 — Dynamic OG image + per-welper metadata ✅ SHIPPED (web, 2026-07-11)
- **Priority**: P1 (MVP — makes every pasted link a marketing asset)
- **Intent**: pasting a profile link anywhere unfurls a branded 1200×630 card: photo, name, headline/category, real rating, badge.
- **Acceptance criteria**: `/welper/[id]` (and `/w/[handle]`) gain server `generateMetadata` (title "Marie M. — Housekeeping | Welpco", honest description) + `opengraph-image` via next/og ImageResponse; grass brand frame; rating shown only when ≥1 review; badge only when earned; graceful fallback card when no photo.
- **Effort**: M (requires server-wrapper restructure of the client profile page)
- **Files**: `apps/web/app/welper/[id]/` (server wrapper + opengraph-image.tsx), shared card design module.
- **Shipped note (2026-07-11)**: `/welper/[id]` restructured into a server wrapper (`page.tsx`) + client page (`welper-profile-client.tsx`); shared helpers live in `apps/web/app/welper/_shared/` (`profile-data.ts` fetch/metadata, `profile-og.tsx` card design). OG + twitter image routes exist on both `/welper/[id]` and `/w/[handle]`; any fetch/render failure degrades to a static branded card (never 500). `/w/[handle]` (SHARE-002 web half) renders the same client page with `alternates.canonical: /w/{handle}` and 404s until the BFF by-handle resolver lands. The `src` view ping (SHARE-005 web half) is wired fire-and-forget in the client page. Note: `robots.txt` still disallows `/welper` (and now `/w`, same privacy default) — Twitterbot honors robots, so Twitter/X unfurls stay limited until the SHARE-012 indexing decision.

### SHARE-004 — Share hub v1 (welper dashboard) ✅ SHIPPED (web, 2026-07-11)
- **Priority**: P1 (MVP)
- **Intent**: one place to grab everything: copy profile link, claim handle, QR code **with Welpco logomark embedded** (error-correction H), download story (1080×1920) / square (1080×1080) / landscape cards.
- **Acceptance criteria**: dashboard page linked from welper profile area; QR PNG download with logo center, scan-tested contrast; card downloads rendered server-side (ImageResponse routes, sizes above) reusing the SHARE-003 design; every link/asset carries its `src` code (`link`, `qr`, `story`, `square`, `og`); en/fr.
- **Effort**: M
- **Files**: `apps/web/app/(dashboard)/dashboard/share/`, `apps/web/app/api/share-card/` routes, logomark asset.
- **Shipped note (2026-07-11)** — `/dashboard/share` (welper-only via `requireRole("welper")`): copy-link (`?src=link`), set-once handle claim (client mirror of the BFF regex, specific inline errors for `HANDLE_TAKEN`/`HANDLE_RESERVED`/`HANDLE_ALREADY_SET`, AlertDialog re-confirms permanence before claiming), QR code (lib `qrcode`, level **H**, near-black modules on white — no brand tinting, logomark SVG from `public/logos/` composited on a white rounded chip at ~20%, 1024px PNG download `welpco-{handle|id}-qr.png`, target `?src=qr`), card downloads via `GET /api/share-card/[welperId]?format=story|square|landscape` (ImageResponse; reuses the SHARE-003 design blocks now exported from `app/welper/_shared/profile-og.tsx`, three layouts in `_shared/share-card.tsx`; printed URL carries `?src=story|square|og`; unknown welper or render failure → static branded card, never 500; `Content-Disposition: attachment`), and the SHARE-005 views widget (last-30-days + all-time + per-src badges when >0, honest empty state "Share your link to start counting"). Nav entry: fourth welper quick-action tile on the dashboard home (the header tab strip lives in `packages/ui` — left untouched). Strings under `dashboard.share`, en+fr.
- **Refinement note (2026-07-11)** — share-card pass: every downloadable card (story/square/landscape) now embeds a **scannable QR code** rendered server-side (`QRCode.create` level **H** module matrix → single inline SVG path in satori — no canvas, no element blow-up) on a white rounded panel with the logomark on a centered white chip (~19% edge, ~7% occlusion, inside H's 30% budget); QR targets carry `?src=qr-story|qr-square|qr-landscape` (added to the BFF `PROFILE_VIEW_SOURCES` whitelist + share-hub badge labels; printed URLs keep `story|square|og` so scans and typed visits stay distinguishable). Cards gained a quiet contact footer `{host} · support@welpco.com` and a hierarchy pass (photo/name dominant → chips → honest trust row → QR + “Scan to book” CTA → footer; names/chips ellipsized, story uses the vertical space deliberately, square anchors the QR bottom-right, landscape adds a right-side QR panel). **No hardcoded domain**: the card route derives its origin from `x-forwarded-host`/`host` + `x-forwarded-proto` (`app/welper/_shared/app-origin.ts`); OG/twitter images use `NEXT_PUBLIC_APP_URL` (→ `NEXT_PUBLIC_SITE_URL` → prod literal; documented in `.env.example`); share-hub client + claim form use `window.location.origin` via `useAppOrigin()`. **EN + FR cards**: route accepts `?lang=en|fr` (inline dictionary — outside next-intl); the hub offers per-language download buttons (English / Français) per format, filenames `welpco-{slug}-{format}-{lang}.png`.

### SHARE-005 — Profile view tracking with source attribution ✅ SHIPPED (BFF 2026-07-10 · web ping + share-hub views widget 2026-07-11)
- **Priority**: P2 (MVP — the measurement loop)
- **Intent**: count public-profile views by `src` so the share hub can eventually show "your poster brought N visits".
- **Acceptance criteria**: fire-and-forget `POST` view event (welperId, src, day) aggregated in one table (no PII, no IP storage); public profile page sends it once per load; totals queryable by welper.
- **Effort**: S
- **Files**: BFF service-discovery or profile-management; public profile page-client.
- **BFF shipped 2026-07-10** — `welper_profile_view_counts` entity + migration (unique (welper_id, src, day), atomic `ON CONFLICT` increment); `POST /api/search/welpers/:welperId/view` public, body `{src?}` whitelisted to `link|qr|story|square|og|direct|unknown` (else `unknown`), ALWAYS 204 — including unknown/malformed welper ids (no enumeration oracle), zero PII (no IP/UA); `GET /api/profiles/me/profile-views` (welper) → `{total, last30DaysTotal, totalsBySrc:[{src,count}]}`. The web ping is already wired (SHARE-003 note). Deferred: rate limiting — the BFF has no throttler infrastructure yet; counts are inflatable but rows are bounded to one per (welper, src, day). Kept 🔨 until the share-hub widget consumes the stats.

### SHARE-006 — Go-live share prompt ✅ SHIPPED (web, 2026-07-11)
- **Priority**: P2 (MVP)
- **Intent**: the "You're live" moment offers the card: "Here's your profile — share it" → share hub.
- **Acceptance criteria**: extends the existing go-live checklist message (`en.json:1379` family) with a share CTA; shown once, dismissible; en/fr.
- **Effort**: XS
- **Files**: web dashboard checklist components + i18n.
- **Shipped note (2026-07-11)** — the go-live completed callout and the all-complete callout in `welper-setup-checklist.tsx` now append "Grab your share card and tell your network." plus an "Open the Share hub" button → `/dashboard/share` (keys `dashboard.setup.welperSections.goLive.sharePrompt`/`shareCta`, en+fr). Show-once/dismiss follows the completed-message's existing lifetime (static CTA inside it; no new persistence built), matching how the checklist renders completed states today.

### SHARE-00M — Admin moderation queue for portfolio photos ✅ SHIPPED (2026-07-11)
- **Priority**: P1 (blocks public visibility of SHARE-001 content)
- **Acceptance criteria**: admin page lists pending photos (welper, thumbnail, caption, date); approve/reject (+optional reason); reject notifies welper; audit-logged like other admin actions.
- **Effort**: S–M
- **Files**: `apps/admin/app/(dashboard)/portfolio/`, BFF admin endpoints.
- **Shipped note (2026-07-11)**: admin queue at `/portfolio` (`page.tsx` + `portfolio-photo-cells.tsx`, service `lib/services/admin-portfolio-service.ts`): pending-default status tabs, thumbnail grid with full-size dialog, one-click approve, reject-with-reason dialog; BFF audit-logs and notifies the welper on rejection. Nav entry added alongside reviews/disputes. Browser-verified flow interrupted by session limit — implementation type-checks; e2e admin click-through pending a manual pass.

## V2 (planned — see plan §6)

### SHARE-007 — Verified job photos (attach to completed booking → checkmark) 📋
### SHARE-008 — Before/after paired photos 📋
### SHARE-009 — Review quote cards + badge/milestone graphics 📋
### SHARE-010 — Print PDFs: CR80 business card + A6 "Scan to book me" poster 📋
### SHARE-011 — Jobs-completed & repeat-client-rate stats (honest thresholds) + link-performance widget 📋
### SHARE-012 — SEO opt-in per profile (robots currently disallows /welper) + receipt "book again" QR 📋

## V3 (planned)

### SHARE-013 — Intro video (moderated) 📋
### SHARE-014 — Per-welper FAQ 📋
### SHARE-015 — Year-in-review shareable 📋
### SHARE-016 — Top Rated quarterly program, NFC/merch 📋

---

**Open product decisions** (plan §7, unresolved): handle rename policy · indexing default · non-booking photos at MVP (working assumption: allowed, visually distinct once SHARE-007 exists) · short domain purchase.
