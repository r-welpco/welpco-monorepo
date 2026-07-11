# Welper Shareable Profile — Product Plan

> **Date:** 2026-07-10 · strategy document, no development scheduled
> **Goal:** turn every welper's public profile into their professional storefront — something they're *proud* to share — and turn sharing into Welpco's cheapest acquisition channel.
> Grounded in what exists today: public `/welper/[id]` pages, real background-check badge, response time, "Booked through Welpco" reviews, first-name+initial privacy convention, S3 presigned-upload pattern (dispute evidence), a referral system, bilingual EN/FR, Montréal launch region, grass-toned brand, and the platform's honesty DNA (bible §22.6: never fabricate).

---

## 1. Why this matters (the strategy in one paragraph)

A welper who shares their profile is doing Welpco's marketing with more credibility than Welpco ever could — a person recommending *themselves* to their own network lands harder than any ad. Every share also solves the two-sided cold-start: it brings the welper's existing clients (people who already trust them) onto the platform as customers. The profile therefore has two jobs: **make the welper look genuinely professional** (so sharing feels like status, not spam) and **make every share traceable and bookable in two taps**. The design principle that keeps it Welpco: *everything on the profile is verifiable or clearly personal voice — no vanity metrics, no fake polish.*

---

## 2. The upgraded public profile — complete feature list

### 2.1 Identity & story
| Feature | Detail |
|---|---|
| **Vanity URL / handle** | `welpco.com/w/marie-m` — chosen once, moderated (no impersonation), redirects from the UUID URL. Short, printable, memorable. |
| **Headline** | One line under the name: "Housekeeping with hotel-level standards — Plateau & Villeray." Structured prompt, length-capped. |
| **My story** | Short bio sections with guided prompts ("Why I do this work", "What clients can expect") — prompts prevent blank-page paralysis and keep quality high. |
| **Intro video** | 15–30s self-presentation clip (v3). Nothing builds trust for in-home services like a face and a voice. Moderated before publish. |
| **Languages spoken** | Chips (FR/EN/others) — high-value in Montréal. |
| **Member since + last active** | Honest tenure signals, automatic. |

### 2.2 Proof of work (the user's core ask)
| Feature | Detail |
|---|---|
| **Work portfolio** | Photo gallery, organized per service offering. Cover photo + up to N per album. Captions. Drag-to-reorder. |
| **⭐ Verified job photos** | The killer differentiator: photos attached to a *real completed booking* get a "From a Welpco booking" checkmark (same honesty pattern as "Booked through Welpco" reviews). Uploaded-from-anywhere photos are allowed but unbadged. Nobody else in this market can prove their portfolio is real. |
| **Before / after pairs** | First-class UI for the strongest visual format in cleaning/maintenance/organization. Paired upload, slider or side-by-side display. |
| **Certifications & skills** | Upload → admin verifies → badge (First aid/CPR, specialized training). Unverified claims render as plain text, never as badges — consistent with the background-check badge rule. |
| **Featured/pinned items** | Welper pins their best photo, best review, and signature service to the top. |

### 2.3 Trust & performance (mostly already computed — surface it)
| Feature | Detail |
|---|---|
| Rating + review count, response time | Already live. |
| **Jobs completed** | Count of completed bookings (exists in data; render at honest thresholds — hide below 3). |
| **Repeat-client rate** | "60% of clients book again" — the single most persuasive stat a service pro can show. Computable from bookings. Hidden below a minimum sample. |
| **Pinned review** | Welper picks one; still displayed with the standard verified-booking pill. |
| **Achievement badges** | Earned, criteria-published, never purchasable: *First 10 jobs · 50 jobs · 1 year on Welpco · Fast responder (<1h median) · Top rated (quarterly, per category+region)*. Each badge auto-generates a shareable graphic (see §3). |
| **Service-area map** | Fuzzy radius circle on a map — never an address, never a precise centroid. |
| **Availability snapshot** | "Next available: Thu afternoon" — pulls from real availability; drives booking urgency honestly. |

### 2.4 Booking conversion on-page
- Sticky "Book now" / "Sign in to book" (exists) + the "How booking works" strip (shipped this sprint).
- **Per-welper FAQ** (v2): 3–5 welper-authored Q&As ("Do you bring supplies?").
- "Typically replies within X" beside the message CTA.

### 2.5 Welper controls & privacy
- Per-module visibility toggles (portfolio, map, stats) — the profile is theirs.
- **Google-indexing opt-in**: robots currently disallows `/welper` — flip to *opt-in per profile* ("Let clients find me on Google"). SEO upside with consent, default off at launch.
- Client-consent rule for any photo showing a client's home interior/children/pets — checkbox attestation at upload + moderation backstop. EXIF/GPS stripped server-side on every upload (reuse the presigned-S3 pipeline from dispute evidence).
- Standard report-content entry point on public profiles.

---

## 3. The share system — "your card, everywhere"

### 3.1 Digital card with QR (the user's ask, spec'd)
One generated **asset pack** per welper, auto-refreshed when their stats change:

| Format | Size | Use |
|---|---|---|
| Story card | 1080×1920 | IG/TikTok/FB stories |
| Square card | 1080×1080 | Feed posts, WhatsApp |
| Landscape card | 1200×630 | **doubles as the OG image** — the profile link unfurls beautifully everywhere it's pasted |
| Business card | CR80 print-ready PDF, bleed + CMYK-safe | Physical cards |
| **"Scan to book me" poster** | A6/A5 print PDF | Cafés, community boards, building lobbies — hyper-local Montréal play |

**Card anatomy:** grass-gradient brand frame · profile photo · name + headline · category chips · rating ⭐ + review count (only when real) · background-check badge if earned · **QR code with the Welpco logomark embedded** (error-correction level H tolerates the logo cutout; grass-on-cream, tested for scan contrast) · the vanity URL in human-readable type · FR/EN variants.
**QR target:** short link `welp.co/w/handle?src=qr` (or `/w/handle` on the main domain until a short domain exists) — every asset format gets its own `src` code (`qr`, `ig-story`, `card-print`, `poster`…), so channel performance is measurable per §5.

### 3.2 Share hub in the welper dashboard
A "Share your profile" page: live preview of every asset, one-tap download / native share sheet, copy-link, and a **"your link performance"** widget — *views → profile visits → bookings* attributed to their links. Seeing "your poster brought 2 bookings" is the loop-closer that makes welpers keep sharing.

### 3.3 Share moments (prompted, not nagging)
- **Go-live**: "You're live — here's your card" (extends the existing 'You're live' message; highest-intent moment).
- **First / every 5★ review**: auto-generate a branded **review quote card** (review text + "Booked through Welpco" pill, reviewer kept as "Welpco customer") — one tap to share.
- **Badge earned**: milestone graphic ("50 jobs on Welpco 🎉").
- **Year in review** (v3): a Wrapped-style annual shareable (jobs, hours, rating, kilometres of the city served).
- Each prompt max once, dismissible — bible voice rules, no growth-hack pestering.

### 3.4 Ecosystem hooks
- **Link-in-bio ready**: the profile *is* their linktree — pitch it that way in onboarding copy.
- **Referral tie-in**: shared links carry the welper's existing referral code, so a new *customer* who books via their card can credit the welper (referral infra already exists).
- **Repeat-booking QR on receipts** (v2): the service receipt includes a small "Book {name} again" QR.
- **Physical merch** (later): NFC tap card / branded stickers for top welpers — quarterly Top Rated program perk.

---

## 4. Trust guardrails (non-negotiable, in the platform's DNA)

1. **Every badge is earned and verifiable** — certifications admin-verified, achievements criteria-published, verified-job-photos tied to real bookings. Anything unverifiable renders as personal voice, not platform endorsement.
2. **Moderation before publish** for photos/video/headline/handle (admin queue extends the existing content/review moderation surface). Report button on everything public.
3. **Privacy defaults**: first name + initial everywhere (existing convention), EXIF stripped, fuzzy service area, indexing opt-in, client-consent attestation for interior/people photos.
4. **Honest empty states**: a new welper's profile shows story + portfolio + "New on Welpco" framing — never padded stats, never "0.0★".

---

## 5. Measurement (define before building)

Per-welper and aggregate: asset downloads/shares by format · link clicks by `src` · QR scans · profile views (unique) · view→booking conversion · % of new customer signups attributed to welper shares · repeat-share rate (do they share again after seeing results?). North-star: **bookings originated from welper-shared links**.

---

## 6. Phasing (for when dev is scheduled)

| Phase | Scope | Effort feel |
|---|---|---|
| **MVP** | Portfolio photos (albums, captions, moderation, EXIF strip) · vanity handle · dynamic OG/landscape card · share hub v1 (copy link, download story+square+OG, QR with logo) · go-live share prompt · `src` tracking | ~2–3 weeks |
| **V2** | Verified-job photos · before/after pairs · review quote cards · badges + milestone graphics · print PDFs (business card, poster) · repeat-client rate & jobs-completed stats · SEO opt-in · link-performance widget · receipt QR | ~3–4 weeks |
| **V3** | Intro video · per-welper FAQ · year-in-review · Top Rated quarterly program + physical merch · NFC | opportunistic |

Technical notes for later: card generation server-side (satori/@vercel/og-style SVG→PNG, or a small render service) keyed by profile-version hash so assets cache and auto-refresh; uploads reuse the presigned-S3 + content-type/size whitelist pattern from dispute evidence; moderation extends the admin console.

---

## 7. Open product decisions

1. Handle namespace rules (claiming, squatting, renames — suggest: one rename/year, reserved words list).
2. Indexing default at launch (recommend opt-in first cohort, revisit after moderation confidence).
3. Whether unbadged (non-booking) portfolio photos are allowed at MVP or everything must be booking-attached (recommend: allowed but visually distinct — supply is young, most work history predates Welpco).
4. Short domain (`welp.co`) purchase for QR/print aesthetics — nice-to-have, not a blocker.
