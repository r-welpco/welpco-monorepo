# Dual-Role Accounts — Plan

> **Date:** 2026-07-25 · verified against HEAD (`015f0ec`) · status: proposed, not started
> **Goal:** a role dropdown on the header logo that lets one person act as both customer and welper — including letting an existing customer become a welper through onboarding.

---

## Context

Today an account is exactly one thing. `accountType` (Customer / Welper / Admin) is a single column, and ~25 endpoints are gated `@Roles('customer')` (booking creation, payments, job posting, favorites) while another ~15 are gated `@Roles('welper')` (offerings, availability, payouts, background check). A welper cannot book; a customer cannot offer services.

Two distinct asks came out of the discussion, and they must not be conflated:

1. **Switch hats** — a person who is both wants to flip context (Airbnb's "Switch to hosting").
2. **Grow into the other side** — a customer decides to start offering services.

The second is the more valuable one commercially: converting existing, already-trusted demand-side users into supply is cheaper than acquiring welpers cold.

---

## What the code already gives us

The architecture anticipated this. Three role concepts already exist and are decoupled:

| Field | Meaning | Where |
|---|---|---|
| `accountType` | what the account **is** | `user_accounts` column |
| `selectedRole` | what the signup wizard chose — drives setup checklist | `user_accounts` column (`signup-orchestrator.service.ts:580`) |
| `effectiveRole` | what the user is **acting as**, per request | computed in `jwt.strategy.ts:84` |

Crucially, everything downstream already reads `effectiveRole` first:

- `RolesGuard` → `user.effectiveRole ?? roleFromAccountType(user.accountType)`
- `customerWelperRoleForAuthUser()` → prefers `effectiveRole`
- The booking controller already calls that helper at **all 6** call sites; disputes, reviews and messaging inherit the same path

**`effectiveRole` is computed in exactly one place.** That single line is the entire leverage point for mode switching.

Additionally, `signup-orchestrator.service.ts:853-858` already changes a user's role and bumps `authVersion` to invalidate old JWTs — the exact mechanism an upgrade flow needs, already written and tested.

### The two traps found during QA

1. **Chicken-and-egg.** Every welper-setup endpoint is `@Roles('welper')`. A customer *cannot* complete welper onboarding. The role must be granted **at the start** of the upgrade, not at the end. This is safe: an incomplete welper is invisible (`profileVisibility` only flips to PUBLIC once profile completion + setup tasks pass).

2. **The wizard ejects them.** `proxy.ts:168` — `if (!signupCompleted) → redirect to /register`. If the upgrade resets `signupCompleted` to re-run the signup wizard, the user is thrown out of the dashboard mid-upgrade and loses access to their bookings and messages until they finish. The upgrade must **never** touch `signupCompleted`.

---

## Recommended decisions

| # | Decision | Recommendation | Why |
|---|---|---|---|
| D1 | Switch vs. convert | **Mode switch (dual-role), not conversion** | Conversion orphans the welper profile, offerings, payout account and history, and is irreversible in a way a dropdown implies it isn't. |
| D2 | Mode direction | **Mode only ever downgrades welper → customer** | Customer capabilities require nothing but an address + card. Welper capabilities are *earned* (offerings, availability, payout, background check). A downgrade-only rule makes the client-supplied mode safe by construction. |
| D3 | Who gets customer mode | **Every welper, no opt-in column** | Any welper can plausibly hire help. Avoids a migration and a settings toggle nobody would find. Add a column later only if abuse appears. |
| D4 | Mode transport | **Cookie (SSR-readable) + `X-Welpco-Role` request header** | Server components need it, so `localStorage` is insufficient. Not a JWT claim — that would force a token refresh on every switch. |
| D5 | Upgrade mechanism | **Dashboard setup checklist, never the signup wizard** | Avoids trap #2. `WELPER_SETUP_TASKS` is already a resumable, non-blocking, dashboard-resident checklist built for exactly this. |
| D6 | Meaning of `accountType` | **"Highest capability earned"** — upgrade sets it to WELPER permanently; mode selects the active hat | Keeps one source of truth for authorization; makes the upgrade additive rather than a swap. |
| D7 | Sequencing | **Phase 1 (mode) must ship before Phase 2 (upgrade)** | Without the mode seam, flipping `accountType` to WELPER *revokes* all 25 customer endpoints — the upgrade would trade one role for the other instead of adding one. |
| D8 | Stop being a welper | **Unpublish (`profileVisibility`), never downgrade `accountType`** | Preserves payout records, booking history and reviews. A "pause my listings" control is the honest form of this. |
| D9 | Marketplace tab | **Swap the whole tab set with the mode** | Welpers browse jobs; customers post them. Same tab, opposite meaning — sharing it would confuse both. |
| D10 | Naming | **"Switch to booking" / "Switch to working"** | Reads as changing activity, not mutating the account. Avoids implying an irreversible change. |
| D11 | Self-booking | **Block `customerId === welperId` at booking create** | Once anyone can hold both hats this becomes reachable; only status-transition checks exist today. |

---

## Phase 1 — Mode switching (~3 days)

**ROLE-001 — `effectiveRole` becomes mode-aware (BFF)**
`jwt.strategy.ts`: read `X-Welpco-Role`; if it is `customer` **and** `account.accountType === WELPER`, set `effectiveRole = 'customer'`; otherwise today's behavior. Explicitly reject the reverse direction (customer requesting welper). One function, guarded by D2.
*Everything else follows automatically* — RolesGuard, the ~25 customer endpoints, booking/dispute/review/messaging perspective.

**ROLE-002 — Self-booking guard (BFF)**
Reject `create()` when the customer and welper are the same user (D11). Small, but reachable the moment Phase 1 lands.

**ROLE-003 — Mode store + header dropdown (web)**
Dropdown on the brand mark in `CustomerHeader` + `WelperHeader`, rendered only for Welper accounts. Mode persisted in a cookie; API client attaches `X-Welpco-Role`.

**ROLE-004 — Dashboard reacts to mode (web)**
`layout-client.tsx:54` derives a single `userRole` that already drives header, profile fetch, setup checklist and badge colors. Feed it the mode. Tab set swaps per D9.

**ROLE-005 — Customer-mode bootstrap (web)**
First switch to customer mode surfaces the existing customer checklist (home address + payment method) — both already required before a first booking.

## Phase 2 — Customer → Welper upgrade (~1.5 days, after Phase 1)

**ROLE-006 — `POST /api/profiles/me/upgrade-to-welper` (BFF)**
Customer-only. Sets `accountType = WELPER` and `selectedRole = WELPER`, ensures a `welper_profile` row exists, bumps `authVersion` (reusing the existing pattern at `signup-orchestrator.service.ts:858`), and **leaves `signupCompleted` untouched** (trap #2). Returns the welper checklist.

**ROLE-007 — Upgrade entry point + bio capture (web)**
Third dropdown item for customers: "Start offering services" → a confirm screen explaining what's required → the welper checklist. The one wizard step not already satisfied is `welperBio` (identity is already complete from their customer signup) — collect it as a checklist task or a small dialog, **not** a wizard detour.

**ROLE-008 — Post-upgrade correctness pass**
Their bookings-as-customer remain visible in customer mode; reviews now aggregate on both sides; welper-only surfaces (payouts, background check, offerings) 403 in customer mode and are hidden from the UI.

---

## Risks & edge cases

- **Ordering is the main risk.** Shipping Phase 2 first would revoke customer abilities from anyone who upgrades (D7).
- **Welper-only endpoints correctly 403 in customer mode** — the UI must hide those tabs rather than let users hit errors.
- **Reviews split** into customer-side and welper-side aggregates for the same person. Supported by the data model; needs a product answer on what shows where.
- **Search visibility is unaffected by mode** — a welper browsing as a customer stays listed. Correct, but worth confirming it matches expectations.
- **Incomplete upgraded welper** sits in the same state as a fresh welper signup: private until setup completes. Already handled.
- **Verified during QA:** no code assumes `accountType` is immutable; messaging inherits the booking perspective helper; `authVersion` invalidation already exists.

## Verification

- BFF unit tests on `jwt.strategy` mode resolution (both directions, missing header, non-welper accounts) and the self-booking guard.
- E2E: welper switches to customer mode → books → sees the booking in the right list from each perspective; welper-only endpoints 403 in customer mode.
- E2E: customer upgrades → stays in the dashboard (never redirected to `/register`) → completes checklist → becomes discoverable → can still book in customer mode.
- Type-check + build across bff / web / ui.
