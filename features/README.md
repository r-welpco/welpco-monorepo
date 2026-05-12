# Welpco — features inventory

Tickets-ready record of every functional gap, bug, and improvement surfaced during the Days 9–14 audit sweep. Nine files, **125 tickets**, **0 P0 launch-blockers** (down from 5 — 2 closed by the 2026-05-06 signup-merge, 2 by the 2026-05-06 disputes pass, 1 by the 2026-05-06 notifications pass), **~13 cross-feature P1s**. **The merge-state launch gate is closed.**

## Recent architectural changes

- **2026-05-06 — NOTIFICATIONS-001 + 002 shipped: dispute / review / payment / message events all emit; MESSAGE category added.**
  Every domain that mutates user-facing state now emits a notification per affected user with category + email + in-app delivery per preference. Booking-domain pattern was the template. New `MESSAGE` and `DISPUTE` enum values added; FE settings page surfaces them in the preferences matrix automatically (Wave 3 default-true). The notification center is no longer a UI shell. Net P0 count: 1 → 0. **Launch-blocker list now empty.** See AUDIT-LOG Day 16 dispatch 2.

- **2026-05-06 — DISPUTES-001 + DISPUTES-002 shipped: evidence upload wired, category enum reconciled.**
  Customers and welpers can now attach photos / PDFs to a dispute (5 files / 10 MB each, jpg/png/webp/heic/pdf, direct-to-S3 via `POST /api/disputes/evidence/presign`). The FE `DisputeForm` category dropdown now mirrors the BFF enum 1:1 — **safety reports are fileable for the first time**. Canonical `DisputeCategory` lives in `@welpco/types`. See AUDIT-LOG Day 16. Net P0 count: 3 → 1 (only `NOTIFICATIONS-001` remains).

- **2026-05-06 — Signup ↔ onboarding merge shipped** (`SIGNUP_MERGE_PLAN.md`).
  Single multi-step signup wizard supersedes the post-login onboarding flow.
  The `/onboarding-welcome` route, the `markOnboardingComplete` mutation, and
  the legacy private register-form components were deleted. Resolves:
  `ONBOARDING-002` / `003` / `004` / `005` / `008`, `LOGIN-002`. Partially
  resolves: `DASHBOARD-001` (P0 → P2). Net P0 count after this dispatch: 5 →
  3 (`DISPUTES-001`, `DISPUTES-002`, `NOTIFICATIONS-001` remained; the first
  two have since been closed — see Day 16 entry above). New follow-up logged:
  `WELPER-PAYOUTS-001` (Stripe Connect onboarding round-trip) in
  `booking_features.md`. See `apps/web/AUDIT-LOG.md` Day 15 for the full
  files-deleted / files-modified list.

This is the working backlog. Each file is one functional surface, organised as ticket-format entries with priority / problem / solution / acceptance criteria / effort / files. Pull from here when sprint-planning.

---

## Audit lineage

Each file was produced by a focused functional audit pass against a single surface, following a consistent methodology:

1. **Read first** — the project AUDIT-LOG (`apps/web/AUDIT-LOG.md`) plus every relevant page, hook, service, platform component, and BFF domain end-to-end. No skimming.
2. **Trace flows** — every click → BFF write → response → UI reconciliation, plus the edge cases (race conditions, concurrent edits, abandoned mid-flow, link-clicked-twice, etc.).
3. **Bug list** — file:line + repro + severity (P0 / P1 / P2 / P3).
4. **Ship well-bounded fixes** — typos, missing aria, missing maxLength, missing prop wiring, raw-color cleanup. Anything bigger gets ticketed.
5. **Add tests** when fixes exceed mechanical changes.
6. **Recommendations** — concrete, leverage-ordered, P-tiered.

The audits were performed read-only against the running codebase (the agent shell denied `pnpm test` from Day 9 onward — verification was done by orchestrator-side `pnpm --filter @welpco/bff test` after each pass). Every audit's findings are recorded in `apps/web/AUDIT-LOG.md` under its day entry (Days 9–14).

---

## Index

| File | Surface | Tickets | P0 | P1 | P2 | P3 | Audit day |
|---|---|---:|---:|---:|---:|---:|---:|
| [`login_features.md`](./login_features.md) | Auth — registration, login, verification, password reset | 14 | 1\* | 4 | 4 | 5 | Day 9 |
| [`settings_features.md`](./settings_features.md) | Settings + profile management | 18 | 0 | 4 | 8 | 6 | Day 10 |
| [`booking_features.md`](./booking_features.md) | Booking wizard + search + booking lifecycle | 18 | 0 | 4 | 8 | 6 | Day 11 |
| [`messages_features.md`](./messages_features.md) | Messages inbox + thread | 12 | 0 | 4 | 5 | 3 | Day 12 |
| [`reviews_features.md`](./reviews_features.md) | Review write + display | 11 | 0 | 3 | 4 | 4 | Day 12 |
| [`disputes_features.md`](./disputes_features.md) | "Report a problem" → dispute → resolution | 15 | 0\*\*\* | 4 | 5 | 4 | Day 13 |
| [`notifications_features.md`](./notifications_features.md) | Notification firing + center + preferences | 12 | 0\*\*\*\* | 5 | 4 | 2 | Day 13 |
| [`onboarding_features.md`](./onboarding_features.md) | Customer + Welper onboarding-welcome (now: signup wizard) | 12 | 0\*\* | 1 | 4 | 3 | Day 14 |
| [`dashboard_features.md`](./dashboard_features.md) | Dashboard home (post-sign-in landing) | 13 | 0\*\* | 5 | 7 | 1 | Day 14 |
| **Total** | | **125** | **0+1** | **34** | **49** | **34** | |

\* `LOGIN-001` (Redis-backed `CacheService`) is conditionally P0 — only blocking when a second BFF replica goes live. Single-replica deploy: P1.
\*\* `ONBOARDING-003` (P0) and `DASHBOARD-001` (P0 → P2) resolved by the 2026-05-06 signup-merge — see `SIGNUP_MERGE_PLAN.md` + AUDIT-LOG Day 15. `LOGIN-002` (P1) also resolved by the same change.
\*\*\* `DISPUTES-001` and `DISPUTES-002` (both P0) resolved 2026-05-06 — see AUDIT-LOG Day 16. Evidence upload wired end-to-end, category enum reconciled.
\*\*\*\* `NOTIFICATIONS-001` (P0) and `NOTIFICATIONS-002` (P1) resolved 2026-05-06 — see AUDIT-LOG Day 16 dispatch 2. Every domain emits; `MESSAGE` + `DISPUTE` categories added.

---

## Launch blockers (0 P0)

After the 2026-05-06 signup-merge, the 2026-05-06 disputes pass, and the 2026-05-06 notifications pass, the launch-blocker list is **empty**. The struck-through tickets below are kept in the table for traceability — see `features/SIGNUP_MERGE_PLAN.md` + AUDIT-LOG Day 15 + AUDIT-LOG Day 16 + AUDIT-LOG Day 16 dispatch 2 for the resolutions.

| Ticket | Surface | Why it blocked |
|---|---|---|
| ~~`NOTIFICATIONS-001`~~ | ~~Notifications~~ | **Resolved 2026-05-06** — Day 16 dispatch 2. Every domain (dispute / review / payment / message) now emits a category-typed notification per affected user. Booking-domain emit pattern preserved as template; new `emitForUser` shared helper handles preference enforcement for the simpler subject+html email shape. `MESSAGE` and `DISPUTE` categories added. |
| ~~`DISPUTES-001`~~ | ~~Disputes~~ | **Resolved 2026-05-06** — Day 16. New `POST /api/disputes/evidence/presign` endpoint mints 15-min S3 PUT URLs (whitelist content-types, 10 MB cap, per-user namespace). `EvidenceUpload` rewritten to drive the upload lifecycle; `DisputeForm` mounts it inline; booking-detail page-client ships the resulting keys with the dispute create payload. |
| ~~`DISPUTES-002`~~ | ~~Disputes~~ | **Resolved 2026-05-06** — Day 16. Canonical `DisputeCategory` enum lives in `@welpco/types`; `DisputeForm` consumes the BFF enum 1:1; safety reports are now fileable; `safety` selection renders a Bible §22.6 callout (911 reminder + 4-hour SLA). |
| ~~`ONBOARDING-003`~~ | ~~Onboarding~~ | **Resolved 2026-05-06** — signup-merge shipped a 7-step welper wizard that builds bio + serviceArea + ≥1 offering + availability before `signupCompleted: true` flips. Welpers now finish signup ready to receive bookings. |
| ~~`DASHBOARD-001`~~ → P2 | ~~Dashboard home~~ | **Partially resolved 2026-05-06** — fresh users now arrive already-onboarded so quick actions are useful immediately. Re-tiered to P2: empty-stats handling (e.g. fresh welper "Total earnings: $0") still warrants polish. |

---

## Cross-feature P1 themes

Three coherent threads run across the ~37 P1s. Each is a meaningful sprint groupin own right.

### Theme 1 — Trust + safety baseline

The marketplace's promise is "verified people, payment protection, problem-reports get heard." Today, parts of that promise are aspirational.

- `DISPUTES-005` — Resolution outcome (refund, type, notes) invisible to participants.
- `DISPUTES-006` — No statute of limitations on dispute filing (2-year-old bookings still disputable).
- `DISPUTES-007` — Welper has no response surface; one-sided dispute.
- `MESSAGES-006` — Block / report user.
- `MESSAGES-007` — Off-platform exfil + scam content filter ("can I pay you off-platform?" pattern).
- `REVIEWS-007` — Report-a-review moderation queue.
- ~~`LOGIN-002`~~ — Resolved 2026-05-06 via signup-merge Phase 3 (banner + 403 dialog).

### Theme 2 — Honesty contracts (bible §22.6)

Surfaces that today claim a fact the BFF can't substantiate.

- `BOOKING-006` — Cancellation-fee policy: today's copy says always-free; product needs a real tiered policy.
- `DASHBOARD-004` — Stats summed over page-1 limit-50 booking window; "Total spent" understates for power users.
- `DASHBOARD-010` — 5xx silently shows zero stats.
- `REVIEWS-001` — Reviews show "Customer #ABC123" — privacy-correct but reads as fake.
- `SETTINGS-001` — Email-change reverification (today: silent swap, no notification to OLD address).

### Theme 3 — Activation + first impression

The flows that determine whether a fresh signup ever returns for a second session.

- `DASHBOARD-003` — Welper trust signals (Wave 1 averageRating / reviewCount / responseTimeMinutes) never surfaced on welper's own dashboard.
- `DASHBOARD-005` — Multi-domain activity feed (depends on `NOTIFICATIONS-001`).
- ~~`ONBOARDING-002`~~ — Resolved 2026-05-06 via signup-merge.
- ~~`ONBOARDING-004`~~ — Resolved 2026-05-06 via signup-merge.
- ~~`ONBOARDING-005`~~ — Resolved 2026-05-06 via signup-merge.
- ~~`ONBOARDING-008`~~ — Resolved 2026-05-06 via signup-merge.
- `BOOKING-001` — Slot reservation (kills the welper double-booking race).
- `BOOKING-002` — Reschedule (today's only path is cancel-and-rebook).
- `BOOKING-003` — Live status updates on booking detail.

---

## Recommended sprint groupings

Each sprint is internally coherent (the tickets reinforce one another), externally shippable (the surface is meaningfully better at the end), and risk-bounded (no ticket in a sprint depends on a ticket in a later sprint).

### Sprint 1 — Trust + safety baseline (P0 + theme 1)

**Goal**: every claim the marketplace makes about safety + dispute resolution is real.

- `NOTIFICATIONS-001` — Domain emit foundation (unblocks everything downstream).
- ~~`DISPUTES-001`~~ — Shipped 2026-05-06 (Day 16). Evidence upload wired.
- ~~`DISPUTES-002`~~ — Shipped 2026-05-06 (Day 16). Category enum reconciled; safety reports fileable.
- `DISPUTES-005` — Resolution outcome visible.
- `DISPUTES-007` — Welper response surface.
- `MESSAGES-006` — Block / report user.

**Outcome**: disputes flow end-to-end honestly; T&S has a complaint pipeline.

### Sprint 2 — Activation foundation (P0 + theme 3)

**Goal**: every new Welper can earn within their first session; every new Customer sees a useful dashboard.

- ~~`ONBOARDING-003`~~ — Shipped 2026-05-06 via signup-merge.
- ~~`ONBOARDING-002`~~ — Shipped 2026-05-06 via signup-merge (`libphonenumber-js` in identity step).
- ~~`ONBOARDING-004`~~ — Shipped 2026-05-06 via signup-merge (per-step server validation + structured 422).
- ~~`LOGIN-002`~~ — Shipped 2026-05-06 via signup-merge Phase 3 (banner + 403 dialog supersede `/verification` routing).
- `DASHBOARD-003` — Welper trust signals on welper's own dashboard (still open).
- `DASHBOARD-005` — Multi-domain activity feed (still open; depends on `NOTIFICATIONS-001`).
- `DASHBOARD-001` (P2 polish) — Empty-stats handling for fresh accounts after the merge structurally fixed the wall-of-zeros.
- `WELPER-PAYOUTS-001` — Stripe Connect onboarding round-trip wired to the welper-payout step (logged Day 15 Dispatch C).

**Outcome**: signup-to-first-action latency dropped sharply with the merge; remaining work is welper trust-signal surfacing + activity-feed breadth.

### Sprint 3 — Booking velocity (theme 3)

**Goal**: book / reschedule / cancel reliably; race conditions closed.

- `BOOKING-001` — Slot reservation.
- `BOOKING-002` — Reschedule flow.
- `BOOKING-003` — Live status updates on booking detail.
- `BOOKING-006` — Real cancellation-fee policy.
- `BOOKING-014` — E2E coverage (zero booking specs today).

**Outcome**: marketplace's revenue surface stops dropping orders to race conditions; cancellation policy is honest.

### Sprint 4 — Honesty contracts (theme 2)

**Goal**: every number the dashboard / settings / reviews surface shows is real.

- `DASHBOARD-004` — BFF aggregator endpoint over full booking history.
- `DASHBOARD-005` — Multi-domain activity feed.
- `DASHBOARD-010` — 5xx error state surfacing.
- `REVIEWS-001` — Real reviewer display name.
- `REVIEWS-005` — +24h review prompt (drives volume → drives sample honesty).
- `SETTINGS-001` — Email-change reverification.
- `SETTINGS-002` — Account-deletion 30-day grace.

**Outcome**: trust signals are durable; account hygiene is industry-standard.

### Backlog (post-launch)

Everything not in Sprints 1–4. Polish, observability, P3s, niche features (recurring bookings, social login, photo support in reviews, etc.). Pull individually when capacity allows.

---

## How to add a ticket

1. Identify which surface the ticket belongs to.
2. Open the corresponding `<surface>_features.md`.
3. Append at the bottom of the priority section it fits into.
4. ID format: `<SURFACE>-<NNN>` where N continues the file's existing numbering.
5. Required fields:
   - **Priority** (P0 / P1 / P2 / P3 — be specific about what gates the priority).
   - **Area** (sub-domain within the surface — e.g. "Cancellation flow" within `booking_features.md`).
   - **Problem** (concrete; cite file:line where possible).
   - **Solution** (concrete; what code path / UX shift / BFF change).
   - **Acceptance criteria** (testable; what does "done" look like).
   - **Effort** (XS / S / M / L; pessimistic).
   - **Files** (where the work lands).
6. Update this README's surface table if the count changes a tier.

---

## How shipped tickets get marked

When a ticket lands:

1. Strike through the title with `~~SURFACE-NNN — Title~~` and add `**Shipped (date)**:` line below.
2. Note the PR / commit / day-number for traceability.
3. After two sprints' worth of shipped tickets pile up, batch-prune from the file (move to a `shipped/` archive) so the working file stays tight.

---

## Pre-existing concerns out of all audit scope

- `apps/bff/src/domains/user-management/admin/admin.service.spec.ts` + `apps/bff/src/domains/payment/payment.service.spec.ts` — five tests fail; predates Day 1 of the audit sweep. Catalogued + untouched. Worth a separate cleanup pass before SOC 2.
- KYC / `verified` flag workflow — Wave 1 added the column with `default false`; the admin tool to flip it never built. Surfaces in `LOGIN-002` (unverified routing) + `welper/[id]` trust-signal display. Unblock when product picks a verification provider.
- Admin app — out of scope across all 14 days.
- Lighthouse / performance budgets on the marketing surface — flagged as P2 follow-up in `apps/web/AUDIT-LOG.md` Day 9 marketing pass; not re-litigated here.
