# Welpco web app — UI audit, polish & landing page redesign

> **You are a fresh agent.** This document is your full brief. Read it
> end-to-end before touching any code. The user expects **excellence**, not
> compliance — every page should feel intentional, every interaction
> considered, every visual decision tied to a journey.

You'll do two things:

1. **Audit and polish every authenticated page** in `apps/web/app/(dashboard)` and `apps/web/app/(auth)` against the design bible.
2. **Redesign the public landing page** from scratch — keep the existing background video, lay a grain texture and a subtle blur over it, and rebuild every section using design skills. The landing page is the front door of a two-sided marketplace; it has to earn trust in the first three seconds.

You'll be measured on outcomes (does the page feel right, does it convert, does it pass a11y) — not on how many lines you changed.

---

## 0. Required reading — before you start

Open these in this order. Skim the first time, return to them as references later. Don't skip.

| File | Why |
|---|---|
| [`packages/ui/ui-ux-bible.md`](../../packages/ui/ui-ux-bible.md) | The normative spec. Every UI decision has to be defensible against this. Pay special attention to §5 (color), §6 (typography), §7 (spacing), §15 (component principles), §16 (forms), §20 (trust patterns), §21 (a11y), §22 (voice). |
| [`packages/ui/src/tokens.ts`](../../packages/ui/src/tokens.ts) | Typed design tokens. Import from `@welpco/ui/tokens` — don't hand-write spacing/color values. |
| [`packages/ui/PLATFORM-UX.md`](../../packages/ui/PLATFORM-UX.md) | The UX framework: journeys, heuristics, trust audit. The same lenses apply to apps/web. |
| [`packages/ui/ROADMAP.md`](../../packages/ui/ROADMAP.md) | Where you fit in the milestone. Apps audit + landing page is the gate before D1 (browser walk) and 1.0. |
| [`packages/ui/src/platform/`](../../packages/ui/src/platform/) | The platform component library. **Use these — don't reinvent.** Every Card / Form / Dialog / List on the web is built from these. |

After you read them, you should be able to answer:

- What is `SEMANTIC_COLOR.primary` and why does it matter?
- Why is `<Heading size="4" mb="1">` the canonical card title?
- What's the canonical empty-state pattern (§17.3)?
- What's the difference between a status badge (§20.4) and a notification dot?
- What's the rule for required-field markers (§16.3)?

If any of those are fuzzy, re-read the relevant bible section.

---

## 1. Mission

Take `apps/web` from "uses the design system, mostly" to **excellence**:

- Every page reads like it was designed, not assembled.
- Every page is keyboard-navigable and passes WCAG 2.1 AA.
- Every page works at 375px and 1440px in both themes.
- Every page is built from `@welpco/ui` primitives — no custom CSS, no inline style violations.
- The landing page is a piece of marketing that makes a Welper or Customer say "I trust this."

**Two sub-missions:**

### A. Audit and polish — apps/web pages

You'll go page-by-page through 14 authenticated routes and 1 public detail page. For each, run the three lenses (§4) and apply targeted fixes that follow the bible.

### B. Landing page — full redesign

The current landing page (`apps/web/app/page.tsx` + `apps/web/components/features/landing/*`) is busy with experiments (multiple header styles, multiple background variants, scroll-effect playgrounds, prototype cards). Strip it back to a single intentional design. Keep the existing video background. Lay a grain texture + subtle blur over the video for legibility and atmosphere. Then redesign every section from scratch using the **frontend-design** skill — distinctive, production-grade, no generic AI aesthetic.

---

## 2. Design skills — when to use which

You'll invoke skills via the Skill tool. Match the skill to the task:

| Task | Skill | When |
|---|---|---|
| Critique an existing page | `design:design-critique` | First pass on every authenticated route — get a structured critique before deciding what to change. |
| Verify alignment with the system | `design:design-system` | Anytime you suspect a page is reinventing a pattern. The skill will tell you which platform component to reuse. |
| WCAG audit on a page | `design:accessibility-review` | Before declaring a page done. Required for: auth flow, booking flow, payment views, dispute flow. |
| Microcopy / button labels / error messages | `design:ux-copy` | When you find a wording question — "Cancel" vs "Discard", "Try again" vs "Retry", error message phrasing. Bible §17.5 + §22 are the rule, this skill helps you find the right phrasing inside the rule. |
| Spec a new component or pattern | `design:design-handoff` | If your audit surfaces a new pattern that should be promoted into `@welpco/ui`. |
| **Landing page creative work** | `frontend-design:frontend-design` | The landing page redesign. This skill is built for distinctive, production-grade frontend interfaces and avoids the generic AI aesthetic. **Don't try to design the landing page without this skill** — it's the difference between "another SaaS landing page" and something Welpco-specific. |

Skills are designed to be invoked at decision points. Don't invoke them on every micro-edit; do invoke them when the question is "what should this page actually be?"

---

## 3. The web app — inventory

```
apps/web/
├─ app/
│  ├─ page.tsx                     ← LANDING (mission B)
│  ├─ search/page.tsx              ← public search
│  ├─ welper/[id]/page.tsx         ← public welper profile
│  ├─ (auth)/                      ← unauthenticated routes
│  │  ├─ login/page.tsx
│  │  ├─ register/page.tsx          ← role fork
│  │  ├─ register/customer/page.tsx
│  │  ├─ register/welper/page.tsx
│  │  ├─ verification/page.tsx      ← OTP / email verify
│  │  ├─ forgot-password/page.tsx
│  │  ├─ reset-password/page.tsx
│  │  └─ onboarding-welcome/page.tsx
│  └─ (dashboard)/                  ← authenticated app shell
│     ├─ layout.tsx                  ← shell with header
│     └─ dashboard/
│        ├─ page-client.tsx           ← home dashboard
│        ├─ search/                    ← welper search (auth)
│        ├─ booking/new/                ← booking wizard
│        ├─ bookings/                   ← list of bookings
│        ├─ bookings/[id]/              ← booking detail
│        ├─ disputes/                    ← dispute list / detail
│        ├─ messages/                    ← inbox
│        ├─ messages/[bookingId]/        ← thread
│        ├─ notifications/                ← notification center
│        ├─ profile/                      ← profile editor
│        └─ settings/                     ← account settings
└─ components/
   ├─ layout/                       ← layout wrappers (header, footer)
   ├─ features/auth/                 ← auth-specific glue
   ├─ features/dashboard/            ← dashboard-specific glue
   ├─ features/landing/              ← LANDING components (mission B)
   ├─ features/payments/
   ├─ features/personalization/
   └─ ui/                            ← legacy local UI shims (verify these aren't shadowing @welpco/ui)
```

### Current lint baseline

`pnpm lint apps/web` → ~1100 warnings (most are `no-disallowed-inline-style`, some `no-raw-semantic-color`). **Your target: 0**. Don't suppress; fix or refactor.

### What's already canonical

- The shipping headers (`CustomerHeader`, `WelperHeader`) have already been refactored. Don't redesign them. If a dashboard page uses a custom header, replace it with the canonical one.
- All platform components (`@welpco/ui/platform/**`) are bible-compliant. **Always import from there**, never reinvent.
- The auth backdrop (`AuthBackground`) is canonical. Auth pages should wrap their forms in it.

### Known existing pain points (start here for the dashboard audit)

These are observations from the platform pass — verify and fix when you reach the relevant page:

1. **Many dashboard pages use ad-hoc Card layouts** instead of the canonical card pattern (§25.6). Look for: inline `style={{...}}` on Cards, custom title rows that don't follow `<Heading size="4" mb="1">`, action rows that aren't right-aligned.
2. **Form pages reuse platform forms but wrap them in custom containers** with raw colors / inline padding. Replace with `<Container size="2|3">` and Radix spacing.
3. **The `(dashboard)/layout.tsx`** likely wraps content in custom layout primitives. Verify it uses `Container` + `Section` from Radix.
4. **The booking wizard** (`booking/new`) uses a multi-step pattern — verify it follows the bible's wizard pattern (stepper at top, Back / Next / Confirm action row, summary persistent throughout).
5. **The messages thread** (`messages/[bookingId]`) — verify it uses `MessageThread` from the platform package and not a local re-implementation.

---

## 4. The audit framework — three lenses

Apply this to every authenticated page. The output of an audit is a **prioritized list of fixes**, not a comprehensive rewrite.

### 4.1 Journey lens (priority 1)

Welpco has 10 journeys (5 Customer, 5 Welper) — they're documented in [`PLATFORM-UX.md` §3](../../packages/ui/PLATFORM-UX.md). For each page, ask:

- Which journey is this on?
- What did the user just do? What do they expect next?
- Is the next action visible without scrolling?
- Is there a way back / out?

If a page can't answer those four questions in three seconds, it's failing the journey lens.

### 4.2 Heuristic lens (priority 2)

Nielsen's 10. The Welpco-specific high-violation ones:

- **Visibility of system status** — booking pending vs processing vs done is often ambiguous.
- **Error prevention** — destructive actions sometimes use soft buttons; they should use `<AlertDialog>`.
- **Recognition over recall** — autofill on emails/phones/addresses, recent searches surfaced, breadcrumbs on deep pages.
- **Help users diagnose errors** — bible §17.5: what happened → why → what to do. Never raw error codes.

### 4.3 Trust lens (marketplace-specific, priority 1 on payments + disputes)

Bible §20 is normative. Audit:

- **Verification badge** is consistent everywhere a Welper appears.
- **Rating** always shows numeric + count (`★ 4.92 · 128 reviews`), never just a number.
- **Price** is shown before commitment. Fees + tax shown before "Confirm". Currency formatting consistent.
- **Booking flow**: summary visible throughout, not just at the end. The Confirm button names the action AND the amount: "Confirm and pay $120".
- **Destructive actions**: AlertDialog with verb-labelled buttons ("Delete payment method?" → "Cancel" + "Delete"), not text confirms.
- **Dispute pathway**: every booking detail surfaces "Report a problem" near the bottom, not buried in a menu.

---

## 5. Per-page checklist

For every page you touch, verify these. The first time, run through with `design:design-critique`.

### Visual / layout

- [ ] Page wrapped in `<Container size="3" px={{ initial: "4", sm: "6" }}>` (or `size="2"` for narrow forms).
- [ ] One `<Heading size="7">` at the top (the page title). No competing h1s.
- [ ] Section headings use `size="5" mb="3"`. No bare `<Text size="4" weight="bold">` posing as a heading.
- [ ] All cards follow §25.6 canonical pattern.
- [ ] All forms follow §16.1 canonical pattern + use `FORM_SPACING` tokens.
- [ ] All lists have Default / Loading / Empty / Error states.
- [ ] All destructive actions go through `<AlertDialog>`.
- [ ] No raw `color="red|green|blue|amber"` for meaning — always `SEMANTIC_COLOR.*`.
- [ ] No inline `style={{ }}` outside §15.5 allow-list.

### Responsive

- [ ] Tested at 375 px and 1440 px.
- [ ] Mobile: no horizontal overflow, no fixed-pixel widths breaking.
- [ ] Tables wider than 4 columns have a card fallback on `<md`.
- [ ] Action rows wrap (`<Flex wrap="wrap">`) on mobile, don't stack vertically by default.

### a11y

- [ ] Required form fields have `*` marker + `aria-required="true"` (§16.3).
- [ ] All `<IconButton>` have `aria-label`.
- [ ] All `<Select>` whose label is visible separately use `id="…-label"` + `aria-labelledby` on `SelectTrigger`.
- [ ] Error Callouts have `role="alert"`.
- [ ] Lists with selectable items have `aria-current` on the selected one.
- [ ] Run `design:accessibility-review` on the page.

### Voice + microcopy

- [ ] All buttons are verbs ("Save changes", not "Submit"). Run `design:ux-copy` on copy you wrote.
- [ ] Errors follow what / why / what-to-do (§17.5).
- [ ] "Sign in" / "Sign out" — never "Log in".
- [ ] Empty states forward-looking, not apologetic.

### Trust (when applicable — booking, payment, dispute, profile pages)

- [ ] Per §20, see lens 4.3 above.

---

## 6. Per-page priorities and notes

Order matters. Highest-leverage pages first.

### Tier 1 — Customer-facing money flow (do first)

| Page | Journey | Special focus |
|---|---|---|
| `dashboard/booking/new` | C1 | The booking wizard. Bible §17.6 destructive confirmation. §20.4 price visible at confirm. Step-by-step UX must persist a summary. |
| `dashboard/bookings/[id]` | C3, C4 | Booking detail. Trust-critical. "Report a problem" must be discoverable. Status changes must be announced (live region). |
| `dashboard/search` | C1 | Search results. §17.3 empty state. §20.2 rating display. Mobile filters: sheet, not collapsed accordion. |
| `welper/[id]` (public) | C1 | Pre-booking trust check. Verified badge prominent. Rating + review count. Services as canonical sub-cards. |

### Tier 2 — Authentication flow (do second)

| Page | Journey | Special focus |
|---|---|---|
| `(auth)/login` | C1, W1 | Single hero CTA. Sign-in patterns. Forgot-password discoverable. |
| `(auth)/register` | C1 | Role fork — already designed in `account-type-selection.tsx` from the platform package; verify the page uses it. |
| `(auth)/register/customer` + `(auth)/register/welper` | C1, W1 | Long forms. §16 canonical pattern. Required markers. |
| `(auth)/verification` | C1, W1 | OTP. Already polished in platform; verify the page imports `AccountVerification`. |
| `(auth)/forgot-password` + `(auth)/reset-password` | — | Simple forms; ensure consistent voice. |
| `(auth)/onboarding-welcome` | C1, W1 | First impression after sign-up. Should feel celebratory but quick. |

### Tier 3 — Welper / power-user surfaces

| Page | Journey | Special focus |
|---|---|---|
| `dashboard/profile` | C5, W5 | Long form (welper-profile-form / customer-profile-form). Verify section grouping. |
| `dashboard/settings` | C5, W5 | Privacy + notifications. Use `PrivacySettings` + `NotificationPreferences` platform components. |
| `dashboard/disputes` | C4 | List + detail. §20.5 dispute pathway. Evidence upload accessible. |
| `dashboard/messages` + `messages/[bookingId]` | C3, W3 | `ConversationList` + `MessageThread` — verify imports, don't reinvent. |
| `dashboard/notifications` | — | `NotificationCenter` from platform. |

### Tier 4 — Dashboard home

| Page | Notes |
|---|---|
| `dashboard/page-client.tsx` | The first authenticated screen. Should orient the user. Stats tiles per §19.3. Quick actions visible. Recent activity. **Don't over-design — clarity beats cleverness.** |

---

## 7. Landing page redesign — the brief

This is mission B. **Use the `frontend-design:frontend-design` skill** to drive the creative work — not because the design is hard, but because the result must not be generic. Welpco has a distinctive product (community service exchange, two-sided trust), and the landing page must reflect that.

### 7.1 Goals

The landing page has 5 jobs, in order of weight:

1. **Earn trust in the first 3 seconds.** A visitor who arrives cold should believe: *real people, real services, real reviews, my data is safe, my money is safe.*
2. **Communicate the two-sided value prop.** This is a marketplace — Customers find help, Welpers earn. Both audiences land here. The landing has to speak to both without diluting either.
3. **Convert.** Two primary CTAs: "Find a Welper" (Customer) and "Become a Welper" (Welper). Sign in for returning users.
4. **Demonstrate quality.** A few real Welpers, real reviews, real services. Concrete > abstract.
5. **Set the brand tone.** Warm, direct, competent (per bible §22.1). Not cute. Not corporate. Confident.

### 7.2 Constraints

- **Keep the existing video background.** It exists in `apps/web/components/features/landing/hero-backgrounds.tsx` (`VideoBackground`). Don't replace it — the user has chosen this video deliberately.
- **Add a grain layer over the video.** Subtle film/paper grain texture, animated or static. Two valid approaches:
  - SVG noise filter (`<feTurbulence>` + `<feColorMatrix>`) overlaid as a `<div>` with `mix-blend-mode: overlay` and ~8–15% opacity.
  - Pre-rendered grain texture image, tiled, with `mix-blend-mode: overlay` and low opacity.
  - Pick one — don't ship both.
- **Add a subtle blur to the video.** `backdrop-filter: blur(2–4px)` on a layer above the video, OR `filter: blur(...)` directly on the video. Do this so heading text + CTAs are legible against motion.
- **The grain + blur is for the hero only.** Below-fold sections shouldn't carry the same treatment.
- **Use `@welpco/ui` primitives** where they fit — Button, Container, Heading, Text, Card. Don't reinvent. Custom sections are allowed (this is creative work) but typography and spacing still come from tokens.
- **Performance budget**: the landing page LCP must be under 2.5s on 3G. The video shouldn't autoplay on cellular by default (use `preload="metadata"` and play on intersection).

### 7.3 Sections — what the page should contain

You have creative latitude on layout, but these sections must exist:

#### Section 1 — Hero (above the fold)

**The job:** in 3 seconds, communicate that Welpco is a trusted marketplace where real people exchange real services.

Required elements:
- The video, with grain + blur layer.
- A headline that names the product (not "Hello World" / "Welcome" — something specific, e.g. "Find help in your neighbourhood." or "Real people. Real help. Right now." — pick one with the `frontend-design` skill).
- A sub-headline that names the two audiences without listing them like a feature spec.
- Two primary CTAs: "Find a Welper" (links to `/search`) + "Become a Welper" (links to `/register/welper`).
- A subtle indicator that there's more below (downward chevron, scroll text, or just visual rhythm).

Don't include:
- Statistics (15K+ users, 85K+ tasks). Those are TBD claims; if they're real and audited, include them in section 4 (social proof). If they're aspirational, drop them entirely — bible §22.6 forbids fake social proof.
- Multiple video options / playgrounds. The current `landing-hero.tsx` has buttons to swap header styles, scroll-animation styles, themes — all that comes out. The landing page is a finished product, not a demo.
- Floating profile cards / decorative scattered elements. The current hero has 5 floating cards orbiting the headline; this reads as "design system demo", not "marketplace landing". Remove them.

#### Section 2 — How Welpco works

**The job:** explain the two-sided flow in three steps for a Customer, three steps for a Welper.

Format: a side-by-side or alternating layout. NOT a generic 3-step horizontal scroll — that's the AI-aesthetic the `frontend-design` skill exists to avoid. Use the skill to find a layout that's specific to Welpco.

Required content:
- Customer flow: Search → Book → Done.
- Welper flow: List your services → Get matched → Earn.

Each step has a one-sentence concrete description. No clip-art icons; if you use icons, use lucide at consistent stroke and size.

#### Section 3 — Real services

**The job:** show what Welpco actually does, with concrete service categories and a feeling of community.

Format: probably a grid of service category cards (Pet care, Tutoring, Handyman, Elder care, Yard work — verify what categories actually launch with). Each card has a name, a short tagline, and ideally a real photo (not stock).

Use `<ServiceCategoryCard>` from `@welpco/ui/platform/service-discovery` — it's already canonical.

If photos aren't available yet, use a typographic-only treatment (no placeholder stock images that read as fake).

#### Section 4 — Trust & social proof

**The job:** make the visitor believe the marketplace is real, has real reviews, and protects them.

Required elements (any combination — pick what's truthful):
- Real reviews from real Welpers / Customers (use `<ReviewCard>` from `@welpco/ui/platform/review-rating`).
- Verified-badge story: a one-line on what verification means.
- Trust signals: payment protection, dispute resolution, communication safety. Three short copy blocks max.

Avoid: lists of logos (we don't have any). Avoid star ratings without volume (a 5-star avg from 1 review is noise).

#### Section 5 — Final CTA

**The job:** close. The visitor scrolled this far; they're either convinced or they're not. Make the next step trivial.

Two CTAs (same as hero), this time with emphasis on the primary action for whatever the visitor probably is. If you can use a soft signal (came in via "find help" search query, etc.) to adjust which is primary, great — but don't over-engineer.

#### Section 6 — Footer

Use `<Footer>` from `@welpco/ui/platform/layout`. It's already canonical. Don't recreate it.

### 7.4 Type, color, motion direction

- **Typeface**: Geist is the primary (already loaded in the design system). The existing landing uses `Fraunces` (a serif) for some headlines — your call whether to keep that contrast (a serif headline + sans body is a strong, distinctive choice for a community marketplace) or unify on Geist. If you keep Fraunces, use it ONLY in the hero headline and "How Welpco works" section heads — not body copy.
- **Color**: green is the brand accent (bible §3.3). Use it sparingly — the video provides most of the color. Below-fold sections should be predominantly gray-1 / gray-12 with green accents on CTAs and emphasis.
- **Motion**: subtle. Bible §10. The grain may have very slow movement (~10–20s loops). CTAs have standard hover. NO scroll-jacking, NO parallax pyrotechnics. The current `scroll-effects/` directory has 5 experimental animation systems — pick zero or one.
- **Mobile**: every section should work at 360 px. The hero video may need a poster image fallback on cellular.

### 7.5 What to delete

The current `apps/web/components/features/landing/` has experimental work: multiple header styles toggled at runtime, multiple background variants, scroll-animation-style switcher, 3D card effects, waterfall card animations, style-playground with persistence, theme toggle in the hero. **Delete all of this**. The landing page is shipping software, not a demo.

Keep:
- `VideoBackground` (the actual video implementation).
- `LandingFooter` if it's still in use, otherwise delete and use `<Footer>` from platform.
- `AdaptiveHeader` ONLY if you decide to keep a custom landing-only header. Otherwise delete and use the platform header (or no header above the fold at all — modern marketplace landings often skip the header entirely).

Move the experimental files out of the landing folder if you want to preserve them for reference (e.g. into a `_experiments/` sibling folder), or just delete them — git history preserves them.

### 7.6 Deliverables for the landing page

When you call this section done:

- [ ] One `apps/web/app/page.tsx` that imports a small set of intentional landing components.
- [ ] No runtime style switchers (single, decided design).
- [ ] Hero passes WCAG AA contrast on every text block, even with the video playing.
- [ ] Mobile: 360px viewport renders without overflow, video falls back to poster on slow connections.
- [ ] LCP < 2.5s on Lighthouse mobile profile.
- [ ] Two before/after screenshots checked in to `apps/web/docs/landing-redesign/`.
- [ ] You've used `frontend-design:frontend-design` at least twice during the redesign — once for the hero, once for the section system.

---

## 8. Sequencing

Suggested order. Adjust as you learn — but follow the rationale, not the literal sequence.

### Day 1 — orient + audit Tier 1

- Read everything in §0.
- Read 3 platform components for shape (e.g. `welper-profile-card.tsx`, `booking-card.tsx`, `dispute-form.tsx`) so you know what canonical looks like.
- Run `pnpm lint apps/web` — read 50 random warnings, group them mentally.
- Audit Tier 1 pages with `design:design-critique`. Capture findings as a list per page; don't change code yet.

### Day 2 — fix Tier 1 + audit Tier 2

- Apply fixes to the 4 Tier 1 pages. Verify per-page checklist.
- Audit Tier 2 (auth flow) with the same approach.

### Day 3 — fix Tier 2 + audit Tier 3

- Apply auth fixes.
- Audit Tier 3 (welper / power surfaces).

### Day 4 — fix Tier 3 + audit Tier 4 + start landing

- Apply Tier 3 fixes.
- Audit Tier 4 (dashboard home).
- **Start landing page redesign.** Begin with the `frontend-design` skill on the hero. Don't write code yet — get a direction first.

### Day 5 — landing page execution

- Build the new landing. Section by section, top to bottom.
- Delete old experimental landing components.
- Test at mobile + desktop, light + dark.

### Day 6 — finishing pass

- Run `design:accessibility-review` on the 8 most important pages and the landing.
- Run `pnpm lint apps/web` — should be ~0 warnings. Investigate any leftovers.
- D1 browser walk per the platform plan: every authenticated route × 2 viewports × 2 themes. Capture before/after screenshots in `apps/web/docs/`.
- Hand back to the user with a summary.

---

## 9. Done criteria

You're done when **all of these are true**:

1. `pnpm lint apps/web` reports **0 warnings** (down from ~1100).
2. `pnpm --filter @welpco/web build` succeeds (already does — keep it that way).
3. Every page in §6 has been audited with `design:design-critique` and the findings either fixed or filed as follow-ups in this doc.
4. Every page in §6 has been run through `design:accessibility-review` — 0 critical violations.
5. The landing page (§7) is shipped: video + grain + blur, all 6 sections, mobile + desktop, both themes, LCP under 2.5s.
6. Old experimental landing code is deleted from `apps/web/components/features/landing/`.
7. Before/after screenshots for the landing page are in `apps/web/docs/landing-redesign/`.
8. A short report at the bottom of this doc summarizes: pages audited, lint delta, key UX wins, follow-ups.

---

## 10. Anti-patterns — what NOT to do

- **Don't redesign platform components**. They're already canonical. If a platform component blocks you, file a follow-up; don't fork.
- **Don't suppress lint warnings**. The rules are merge gates. If a warning is wrong, the *rule* needs adjusting (not your code).
- **Don't bypass the design system**. If you find yourself writing custom Card / Form / Dialog HTML in `apps/web`, stop. Use `@welpco/ui` primitives.
- **Don't add new dependencies** without checking the user. The design system uses Radix Themes and lucide; everything else is suspect.
- **Don't over-design the landing page**. The goal is trust, not flair. If a section reads as "look how clever this is", cut it.
- **Don't mass-rewrite without auditing first**. The §4 lenses exist because rewriting before understanding produces worse code.
- **Don't ship without using the design skills**. The user explicitly asked for skill-driven work.
- **Don't skip mobile.** Every page must work at 360–375 px. The platform pass already established this; don't let it regress in the apps layer.

---

## 11. Engaging the user

The user expects pause points, not silent overhaul. Surface to them:

- **Before starting**: confirm this plan reflects intent.
- **After Day 1 audit**: share the priority list — let them reorder.
- **Before the landing page redesign**: share 2–3 hero direction sketches (description-level, no need to render in browser yet) and let them pick.
- **Before deleting experimental landing code**: confirm.
- **At each tier completion**: report status + any decisions surfaced.
- **At the end**: full summary + outstanding follow-ups.

Use `AskUserQuestion` for binary or short-list decisions. Use prose for nuance.

---

## 12. Hand-off — what you produce

When you're done, edit this file's bottom section to record:

```markdown
## Hand-off report — [date]

### Scope completed
- Audited and polished: [list pages]
- Landing page: [shipped / partial / blocker]

### Lint delta
- Before: ~1100 warnings
- After: [N]

### Key UX wins
- [page or pattern]: [what changed and why it matters]
- ...

### Follow-ups for the next milestone
- [page or pattern]: [what's pending]
- ...
```

That report is the only documentation deliverable beyond the bible/roadmap updates already in place. Let the code speak for the rest.

---

## 13. Trust your judgment

You have the bible, the platform, the framework, and the design skills. The user asked for **excellence**, which means: when this plan and your judgment disagree, your judgment wins — provided you can defend it against the bible. The bible is the only doc that overrides this plan.

Good luck.

---

*Plan written for handoff. Last revision: 2026-04-24. Owner: design + engineering.*
