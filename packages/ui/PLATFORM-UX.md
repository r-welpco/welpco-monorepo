# Welpco platform — UI improvement & UX evaluation plan

> A systematic pass over the 102 platform components, paired with a journey-
> level UX evaluation. The goal isn't just "consistent pixels" — it's a
> product that earns trust, reduces friction, and respects both audiences
> (Customers and Welpers).
>
> Companion doc: [`ui-ux-bible.md`](./ui-ux-bible.md) is the canonical spec.
> This document is the **execution plan**.

---

## Table of contents

1. [Principles for this pass](#1-principles-for-this-pass)
2. [UX evaluation framework](#2-ux-evaluation-framework)
3. [Journey maps — what we're actually evaluating against](#3-journey-maps--what-were-actually-evaluating-against)
4. [Heuristic audit checklist](#4-heuristic-audit-checklist)
5. [Trust & safety audit (marketplace-specific)](#5-trust--safety-audit-marketplace-specific)
6. [UI improvement sequencing by pattern family](#6-ui-improvement-sequencing-by-pattern-family)
7. [Per-domain breakdown](#7-per-domain-breakdown)
8. [Deliverables](#8-deliverables)
9. [Schedule](#9-schedule)
10. [Success criteria](#10-success-criteria)

---

## 1. Principles for this pass

1. **Every fix is tied to a journey** — "we changed this because a customer on the booking flow hit X". No cosmetic-only edits.
2. **Measure before tuning** — write down the friction you're removing before touching the code.
3. **Consistency is the floor, not the ceiling** — same pattern across components is table-stakes. The real goal is each pattern being the *right* pattern.
4. **Trust signals scale with transaction size** — the higher the stakes (payments, disputes, verification), the more visible the safety affordances.
5. **Mobile is the acid test** — if it doesn't work at 375px, it's broken. The recent header refactor proves this: a nav bar that worked desktop-first had to be rebuilt from the hamburger outward.

---

## 2. UX evaluation framework

Three lenses, applied in sequence to every screen.

### 2.1 Journey lens

Is this screen *on a journey*? Which one? What just happened on the previous step? What's the next expected action? If the screen doesn't answer those three questions in a single glance, it's failing.

### 2.2 Heuristic lens

Nielsen's 10 heuristics as a fast checklist (detail in [§4](#4-heuristic-audit-checklist)). The most-violated ones on Welpco so far:

- **Visibility of system status** — booking flow has ambiguous pending states.
- **Recognition over recall** — some forms ask for info already collected (duplicate asks).
- **Error prevention** — destructive actions still use soft buttons in some flows.

### 2.3 Trust lens

Marketplace-specific. See [§5](#5-trust--safety-audit-marketplace-specific).

---

## 3. Journey maps — what we're actually evaluating against

Each role has ~5 core journeys. Every platform component belongs to at least one. Audit findings are organized by journey, not by file.

### 3.1 Customer journeys

| # | Journey            | Key screens                                           | Components touched                                  |
| - | ------------------ | ----------------------------------------------------- | --------------------------------------------------- |
| C1 | **First booking**  | Landing → sign up → verify → search → select Welper → book → pay → confirmation | register-form, account-verification, search-hero, search-filters, welper-profile-card, welper-profile-dialog, booking-wizard, booking-form, payment-method-form, payment-authorization-card, booking-status-badge |
| C2 | **Repeat booking** | Dashboard → bookings → new → select recent Welper → book | dashboard, booking-card, recurring-booking-form     |
| C3 | **Day-of service** | Reminder → message welper → check-in/out → rate      | reminder-card, chat-input, message-thread, check-in-out-button, rating-form |
| C4 | **Issue resolution** | Booking detail → report problem → dispute → resolution | booking-card, dispute-form, evidence-upload, dispute-status-badge, support-ticket-card, resolution-card |
| C5 | **Profile & settings** | Profile → edit → payment methods → notifications | customer-profile-form, payment-method-card, notification-preferences |

### 3.2 Welper journeys

| # | Journey              | Key screens                                                | Components touched                                      |
| - | -------------------- | ---------------------------------------------------------- | ------------------------------------------------------- |
| W1 | **Onboarding**       | Sign up → verify → welper profile → service offering → service area → availability | welper-register-form, welper-profile-form, service-offering-form, service-area-selector, time-slot-availability |
| W2 | **Finding work**     | Dashboard → job feed → apply → message                    | application-list, job-card, job-application-form, conversation-list |
| W3 | **Managing a job**   | Booking → confirm → on-route → check-in → check-out → invoice | booking-card, check-in-out-button, invoice-display |
| W4 | **Getting paid**     | Payout settings → view receipts → contest charges         | payment-method-form, receipt-display, dispute-form     |
| W5 | **Growing the practice** | Profile → services → availability → reviews → referrals | service-offering-list, availability-exceptions, rating-summary, referral-code-display, referral-analytics |

### 3.3 Deliverable

For each journey, a **1-page map** with:
- Steps (screens)
- Component per step
- Current friction points
- Proposed improvements

Lives in `/docs/ux/journeys/`. Owner: design. Blocker for per-domain fixes.

---

## 4. Heuristic audit checklist

Apply to every screen. Flag violations, file per-journey.

1. **Visibility of system status**
   - Loading indicators where async work happens
   - Success states are explicit (toast or inline confirmation)
   - Pending vs. processing vs. done is distinguishable
2. **Match real world**
   - Language ("Sign in", not "Authenticate")
   - Metaphors ("Booking", not "Record")
3. **User control & freedom**
   - Every destructive action is reversible OR needs confirmation
   - "Cancel" available on every multi-step flow
   - Browser back works everywhere
4. **Consistency & standards**
   - Same pattern for same purpose (`<Card>` always has title at top-left)
   - Primary CTA always right-aligned in action rows
   - Status badges follow the bible §20.4 table
5. **Error prevention**
   - Destructive actions use `<AlertDialog>` (§17.6)
   - Forms validate on blur, not on keystroke
   - Type-appropriate inputs (`type="email"`, `inputMode="numeric"` for OTPs)
6. **Recognition over recall**
   - Autocomplete on email/phone/address
   - Recent searches / recent Welpers surfaced
   - Breadcrumbs on deep pages
7. **Flexibility & efficiency**
   - Keyboard shortcuts on power tasks (⌘K search)
   - Bulk actions on lists (select + batch)
   - Saved searches / favourites
8. **Aesthetic & minimalist design**
   - No chart junk, no unnecessary decoration
   - One primary CTA per screen
   - White space is a first-class design choice
9. **Help users recognize, diagnose, recover**
   - Every error states what happened + why + what to do (bible §17.5)
   - Never show raw error codes
10. **Help & documentation**
    - Inline help where the form is complex (tooltips, helper text)
    - Link to support from every error state

---

## 5. Trust & safety audit (marketplace-specific)

The heuristics above are generic. Welpco is a **transactional marketplace** — higher stakes, higher trust bar.

### 5.1 Verification signals

- [ ] Every Welper card/dialog shows verified status (if applicable).
- [ ] Verified badge is consistent (bible §20.1) — same icon, same position, same color.
- [ ] Unverified Welpers flag it clearly, not in absence.

### 5.2 Rating & review visibility

- [ ] Rating always shows both the numeric score AND the review count (§20.2).
- [ ] Rating is tappable and opens the full review list.
- [ ] No Welper card shows just a rating without volume — a 5★ from 1 review is noise.

### 5.3 Price transparency

- [ ] Price shown before commitment, not after.
- [ ] Fees/taxes/tips shown before the "Confirm" button.
- [ ] Currency + symbol consistent (§20.3).
- [ ] "From $24/hr" if the final price depends on inputs.

### 5.4 Booking & payment flow

- [ ] Booking summary visible throughout the flow (not just at the end).
- [ ] Payment method visible at confirmation step.
- [ ] Charge amount shown on the "Confirm" button itself ("Confirm and pay $120").
- [ ] Never auto-confirm after a countdown.

### 5.5 Dispute pathway

- [ ] Every booking detail page has a visible "Report a problem" affordance.
- [ ] Dispute form accepts evidence (photos, documents) — `evidence-upload` exists; verify discoverability.
- [ ] Dispute status is trackable from booking detail.

### 5.6 Communication safety

- [ ] Chat only opens after booking confirmed (prevent solicitation off-platform).
- [ ] Block / report user available from chat thread.
- [ ] No phone/email sharing prompts in chat (handled server-side but UI should reinforce).

---

## 6. UI improvement sequencing by pattern family

Order of attack. Within each, a per-file audit + fixes.

### 6.1 Cards (priority 1)

**Why first**: cards are the most-seen surface. Every list, every search result, every summary.

Components: `booking-card`, `job-card`, `application-review-card`, `review-card`, `notification-card`, `welper-profile-card`, `welper-profile-card-compact`, `service-offering-card`, `service-category-card`, `service-area-card`, `payment-method-card`, `favorite-welper-card`, `reminder-card`, `support-ticket-card`, `resolution-card`.

**Standards to enforce**:

| Aspect                       | Rule                                                                     |
| ---------------------------- | ------------------------------------------------------------------------ |
| Card size                    | `size="3"` for discrete rows, `size="4"` for hero/summary, `size="2"` only in dense lists |
| Title row                    | `<Heading size="4" mb="1">` + optional status badge right-aligned        |
| Metadata row                 | `<Text size="2" color="gray" highContrast>` — date, count, location      |
| Body                         | Main content (photos, description, rating)                               |
| Action row                   | `<Flex justify="end" gap="2">` at bottom — secondary actions left of primary |
| Internal vertical rhythm     | `<Flex direction="column" gap="3">` (matches new Card component)         |
| Hover state                  | Cards linking to detail pages show subtle `variant="classic"` or hover ring |
| Avatar-name-timestamp        | `<Flex gap="3" align="start">` with avatar size="3", name+timestamp stacked |
| Responsive                   | Never wider than `maxWidth="640px"` unless in a grid                     |

**Output**: 15 normalised cards. Each passes the 9-row check above.

### 6.2 Lists & grids (priority 2)

Components: `application-list`, `conversation-list`, `favorite-welper-list`, `notification-center`, `review-list`, `search-results-list`, `service-offering-list`, various `*-list.tsx`.

**Standards to enforce**:

| Aspect        | Rule                                                                             |
| ------------- | -------------------------------------------------------------------------------- |
| Empty state   | Every list MUST have one (bible §17.3). Headline + description + primary action. |
| Loading state | `<Skeleton>` placeholders that match final layout, not a spinner.                |
| Error state   | `<Callout color={SEMANTIC_COLOR.danger} variant="surface">` with retry.          |
| Pagination    | "Load more" button or infinite scroll — pick one per list type, document the choice. |
| Density       | Mobile = single column, Desktop = grid where appropriate. Use Radix `Grid columns={{ initial: "1", sm: "2", lg: "3" }}`. |
| Result count  | Every filtered list shows "X of Y results" when filters are applied.             |
| Sort          | Sort affordance consistent: `<Select>` in the toolbar, not custom popover.       |

**Output**: 10 lists with 4 canonical states each (Default, Loading, Empty, Error).

### 6.3 Dialogs & overlays (priority 3)

Components: `welper-profile-dialog`, `service-selection-dialog`, `booking-wizard`, plus anything using `<Dialog>` directly.

**Standards to enforce**:

| Aspect         | Rule                                                                       |
| -------------- | -------------------------------------------------------------------------- |
| Size           | `size="3"` for simple, `size="4"` for form-heavy, `size="5"` for wizards.  |
| Title          | `<Dialog.Title>` always present (a11y). Mirrored in visible `<Heading>`.   |
| Description    | Single line, sentence case, period.                                        |
| Close pattern  | Header `<Dialog.Close><IconButton>` (handled by new `DialogContent`).      |
| Action row     | Cancel (variant="soft") left, primary (variant="solid") right.             |
| Destructive    | Primary uses `color={SEMANTIC_COLOR.danger}` + verb-label ("Delete", not "OK"). |
| Wizard pattern | Stepper at top, "Back" left, "Next/Submit" right, progress visible.        |
| Mobile         | Full-screen sheet on `<md`, centred dialog on `md+`.                       |

**Output**: 5+ dialogs all following the pattern. Bible §17.6 referenced everywhere.

### 6.4 Forms — already done, follow-up

Done by the last agent pass. Follow-up decisions:

- [ ] **Required-marker convention** — 8 forms still missing markers. Pick A (`*`), B (`(optional)`), or C (mix).
- [ ] **Form wrapper** — 5 files use `<Flex asChild gap="5">`, 16 use Box-`mb`. Pick one as canonical in the bible §25.1 and migrate.
- [ ] **Field grouping** — long forms (welper-profile, service-offering, customer-register) should group related fields with `<Heading size="3">` section headers + `mb={FORM_SPACING.sectionGap}`.

### 6.5 Status & feedback (priority 4)

Largely done (badges normalised). Follow-up:

- [ ] Toast integration — every success/error state needs a canonical toast pattern. Currently inconsistent across apps.
- [ ] Inline error messages vs. toast: bible §17.1 matrix is documented; audit which is used where.
- [ ] Loading button state — every submit button should show a spinner when `loading`.

### 6.6 Navigation patterns (priority 5)

- [ ] Breadcrumbs — absent on deep pages (profile subpages, booking detail). Add where nesting > 2.
- [ ] Back affordance — mobile back button on all secondary pages.
- [ ] Empty navigation state — when a list is empty, the empty-state CTA should route back to the primary journey (not just say "no data").

### 6.7 Typography & spacing sweep

- [ ] Page-title audit — every page has exactly one `<Heading size="7">` at top.
- [ ] Section headers — consistent use of `size="5" mb="3"`.
- [ ] Body copy width — long text blocks constrained to `max-width: 65ch` per bible §6.4.
- [ ] Line-length audit — spot check 10 screens with prose for readability.

### 6.8 Motion polish (priority 6)

- [ ] Dialog enter/exit — verify Radix defaults match bible §10 (200ms standard, 320ms for dialogs).
- [ ] Toast slide-in — match bible duration/easing.
- [ ] Button press feedback — subtle scale or color shift on active.
- [ ] Prefers-reduced-motion — verify all animations respect it.

---

## 7. Per-domain breakdown

How the work distributes across the 11 platform domains. Attack in this order — highest visibility first, tightest feedback loop.

| Order | Domain                 | Components | Primary pattern                             | Estimate |
| :---: | ---------------------- | :--------: | ------------------------------------------- | -------- |
| 1     | `service-discovery`    |     15     | Cards + search + lists + dialogs            | 2 days   |
| 2     | `booking-scheduling`   |      7     | Forms + cards + wizard                      | 1.5 days |
| 3     | `user-management`      |     26     | Forms (done) + verification + profile steps | 1 day    |
| 4     | `profile-management`   |     19     | Forms + cards + lists                       | 2 days   |
| 5     | `payment-processing`   |      7     | Forms + displays (invoice, receipt) + cards | 1 day    |
| 6     | `communication`        |      5     | Chat primitives                             | 0.5 day  |
| 7     | `review-rating`        |      5     | Display widgets                             | 0.5 day  |
| 8     | `dispute-resolution`   |      5     | Forms + upload + status                     | 0.5 day  |
| 9     | `job-posting-matching` |      6     | Forms + cards + list                        | 0.5 day  |
| 10    | `notification`         |      3     | Cards + center + preferences                | 0.5 day  |
| 11    | `layout`               |      4     | Done — headers + footer + logo              | ✅        |

**Total: ~10 working days** for the UI pass alone. UX evaluation adds ~3 days front-loaded.

---

## 8. Deliverables

### 8.1 Design artefacts

- Journey maps for all 10 journeys (5 Customer + 5 Welper) — lives in `/docs/ux/journeys/`.
- Heuristic audit report — one file per domain listing violations, severity, proposed fix.
- Trust & safety audit report — §5 checklist results.
- Before/after screenshots for every component pass (pre-D1 and post-D1).

### 8.2 Code artefacts

- Every component file passes the relevant pattern-family checklist (§6).
- Every list/form/card has stories for `Default`, `Loading`, `Empty`, `Error`.
- Bible updates reflecting any new patterns discovered during the pass.

### 8.3 Sign-off artefacts

- Walk-the-app document: every authenticated route at 375 and 1440 in light + dark (browser walk — Workstream D1 in ROADMAP).
- Lint baseline: `pnpm lint` warnings at or below 1000 (currently 1586).
- a11y baseline: `pnpm test:a11y` clears zero real violations (already done; verify maintained).

---

## 9. Schedule

Assuming one engineer + design + agent parallelism. Adjust for team size.

```
Week 1 — UX evaluation
  Day 1  Customer journeys mapped (C1–C5). Heuristic audit started.
  Day 2  Welper journeys mapped (W1–W5). Trust & safety audit.
  Day 3  Synthesis: friction catalog + priority list. Review with stakeholders.

Week 2 — Highest-value UI passes
  Day 4  service-discovery (cards + search)
  Day 5  service-discovery (dialogs + lists)
  Day 6  booking-scheduling (forms + wizard)
  Day 7  booking-scheduling (cards) + user-management gaps

Week 3 — Profile, payment, communication
  Day 8  profile-management (forms)
  Day 9  profile-management (cards + lists)
  Day 10 payment-processing (forms + displays)
  Day 11 communication + review-rating

Week 4 — Dispute, job, notification, sweep
  Day 12 dispute-resolution + job-posting-matching
  Day 13 notification + cross-cutting sweep (motion, typography)
  Day 14 D1 browser walk (every route × 2 viewports × 2 themes)
  Day 15 Fix pass from browser walk findings

Week 5 — Polish & release
  Day 16 Bible updates, tokens additions
  Day 17 Story coverage gaps (C2 from ROADMAP)
  Day 18 Final verification + tag 1.0
```

**3–4 weeks elapsed** for a small team, 2 weeks with aggressive agent parallelism.

---

## 10. Success criteria

The platform pass is **done** when:

1. Every one of the 10 journeys has a documented map with friction catalog addressed.
2. Every component file passes the pattern-family checklist in §6.
3. Every list has all 4 canonical state stories (Default / Loading / Empty / Error).
4. Every card, dialog, and form follows its pattern with no hand-tuning.
5. Trust & safety audit (§5) has **0 unresolved violations**.
6. `pnpm test:a11y` reports 0 real violations (already ✅).
7. D1 browser walk finds no design-system deviations across all routes at 375/1440 in light+dark.
8. Storybook `storybook-static` deploys successfully and every story renders without error.
9. Bible updated with any patterns discovered during the pass.
10. Lint warning count under 1000 (incremental cleanup along the way).

---

*Owner: design + engineering. Cadence: daily standups during Week 1, twice-weekly during Weeks 2–4.*
