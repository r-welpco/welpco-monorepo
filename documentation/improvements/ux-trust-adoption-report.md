# UX, Trust & Adoption Report

> **Date:** 2026-07-04 · commit b809feb (+ this session's design-pass changes)
> **Question:** why aren't people onboarding and starting to use the platform, and what do we change?
> **Method:** three evidence-based inventories of the actual implementation — acquisition funnel, trust surfaces, first-run activation — cross-referenced with the validated backlog (84 open tickets) and this week's audits. Every claim cites code.

---

## Executive summary

The platform's core mechanics are genuinely good — the signup wizard is short and resumable, the payment model (hold on accept, charge after completion) is customer-friendly, cancellation policy is real and enforced, legal pages are substantive, and the welper go-live flow ends with honest "you're live" messaging. **The problem is everything around those mechanics:**

1. **The front door is locked.** A stranger cannot see a single welper, price, or review without creating an account *and* verifying their email. The homepage that must convince them shows **zero social proof** (a testimonials component exists in the codebase but was never added to the page), and its primary CTA sends new visitors to `/login`. You are asking for commitment before demonstrating any value — the classic marketplace cold-start mistake, implemented structurally.

2. **The conversion moments betray the user.** The customer checklist marks the payment method "optional," then `POST /bookings` hard-fails without one — the wall appears at the exact moment of first conversion. The FAQ says "you pay upfront" while the booking flow says "just a hold, charged after completion." After booking, the customer gets no confirmation, no explanation of what happens next, and a status chip that never updates.

3. **Credibility leaks exactly where skeptics look.** On the public welper profile — the page a parent studies before letting a stranger into their home — the footer's Terms and Privacy links **404**, the phone number is the placeholder `1-800-WELPCO`, the social icons link to `facebook.com` generically, every anonymous "Customer #3F2A1B" review carries a platform-stamped "Verified" badge, and the safety promise ("we respond within 4 hours") is not enforced by anything and contradicts the same feature's "48 hours" copy elsewhere.

4. **Nothing brings people back.** There is no welcome email on the real signup path (the template exists; only the abandoned legacy flow calls it), no re-engagement of any kind (the entire backend has exactly one scheduled job — payment capture), and no notification-preferences UI despite the backlog marking it shipped.

None of these are hard engineering problems. Most of the highest-leverage fixes are copy, config, wiring, or one-file changes. The one structural investment that will matter more than everything else combined: **public browsing**.

---

## The funnel as it exists today

| Stage | What happens | The leak |
|---|---|---|
| Land on homepage | Hero video, 4 generic trust pillars, categories, how-it-works | No testimonials (built, not rendered), no stats, no pricing, primary CTA → `/login` |
| Decide to try | Must register: email+password → role → identity (2–3 steps — genuinely good) | Can't see any inventory first; minors banner promises what signup rejects (`MINOR_SIGNUP_UNAVAILABLE`) |
| Post-signup | Dashboard replaced by setup checklist until email verified + address added | Verification is a *code email*, arriving with no welcome/orientation email around it |
| First search | Requires verified email (`searchAllowed = emailVerified`) | Second wall before any value |
| First booking | Search → profile → booking wizard → **hard-fail: no payment method** | Checklist said the card was optional (`customerPayment: required:false` vs `assertCustomerHasDefaultPaymentMethod`) |
| Waiting | "Pending" chip; `booking_created` notifies only the welper | Peak-anxiety moment with zero communication, no live updates (BOOKING-003) |
| Stall anywhere | Server-side resume works well if they return | Nothing ever contacts them again (no lifecycle emails, no crons) |

**Welper side:** 4 wizard screens + 5 required dashboard tasks (email, photo, service area, offering, availability) → discoverable. Genuinely coherent, with honest "You're live" messaging at the end. Leaks: the $19.99 background check is never disclosed pre-signup; the check and Stripe payout are both skippable, so **a welper can be booked with no background check (unbadged) and nowhere for their money to go**; the post-login session poll stalls visibly for up to ~2.5s.

---

## Findings by theme

### A. Let strangers see value before asking for anything

| # | Finding | Evidence |
|---|---|---|
| A1 | No public search/browse — `/search` redirects into the authed dashboard; results additionally require verified email | `app/search/search-redirect-client.tsx:16`, `dashboard/search/page-client.tsx:133` |
| A2 | Public welper profile pages already exist (`app/welper/[id]`) — the hard part is built; only public *discovery* is missing | `app/welper/[id]/page.tsx` |
| A3 | Homepage renders zero social proof; `Testimonials` + `StatBubble` components exist but aren't imported — and their hardcoded content is unusable anyway (a 16-year-old welper, NYC boroughs, on a Canada-only platform that blocks minors) | `(marketing)/page.tsx`, `sections/testimonials.tsx`, `hero/stat-bubble.tsx` |
| A4 | No pricing transparency anywhere pre-signup — no rate ranges, no fee disclosure, no "$19.99 background check" mention for welpers | `messages/en.json` marketing block |
| A5 | Hero primary CTA "Find help" → `/login` | `hero/hero-immersive.tsx` |

### B. Fix the conversion moments

| # | Finding | Evidence |
|---|---|---|
| B1 | Payment method labeled optional in checklist, hard-required at booking submit | `signup-orchestrator.service.ts:292` vs `booking.service.ts:556` |
| B2 | Charge-timing copy contradicts itself: booking flow "hold, charged after completion" vs FAQ/marketing "you pay upfront" / "taken when confirmed" | `en.json:2166` vs `:231,280,483` |
| B3 | Customer gets no confirmation on booking creation — notification goes only to the welper; no "what happens next" copy; no live status (BOOKING-001/002/003 all open: no slot reservation, no reschedule, no updates) | `booking.service.ts:662-669` |
| B4 | No welcome email on the wizard path — `sendWelcomeEmail` exists but only the dead legacy `register` flow calls it | `signup-orchestrator.service.ts:540-552` vs `auth.service.ts:146` |
| B5 | Post-login session-readiness polling stalls up to ~2.5s | `login-page-client.tsx:81-92` |

### C. Stop the credibility leaks (highest damage-per-effort)

| # | Finding | Evidence |
|---|---|---|
| C1 | Platform footer (rendered on the **public welper profile**): Terms → `/terms` and Privacy → `/privacy` both **404** (real routes are `/legal/*`); phone is `1-800-WELPCO` placeholder; socials link to bare `facebook.com`/`twitter.com`/`instagram.com` (the marketing footer has the real ones) | `packages/ui/src/platform/layout/footer.tsx:91,94,121,143-159` |
| C2 | Every review stamped "Verified" via hardcoded `verified: true`, shown beside anonymous "Customer #3F2A1B" — reads as manufactured social proof | `app/welper/[id]/page.tsx:190,203` |
| C3 | Safety SLA theater: dispute form promises "safety reports within 4 hours" in one string and "within 48 hours" in another; nothing enforces either (no timer, no escalation, no safety-category routing) | `en.json:2289` vs `:2281`; `dispute.service.ts` |
| C4 | Minors banner on homepage promotes a feature signup hard-rejects | `sections/minors-banner.tsx` vs `signup-orchestrator.service.ts:933` |
| C5 | Missing trust signals that exist in data: response time (`responseTimeMinutes` in the DTO, never rendered), jobs-completed, tenure | `app/welper/[id]/page.tsx:33-36` |
| C6 | Good news worth keeping: the "Background check passed" badge is **real** (gated on actual Certn/admin status, never defaults true); legal content is substantive and bilingual (incl. Quebec Law 25); the contact form actually works (its CLAUDE.md is stale saying otherwise); cancellation/refund copy matches enforcement | `service-discovery.service.ts:123,420`; `content/legal/*` |

### D. Make safety mechanics real, not narrative

| # | Finding | Evidence |
|---|---|---|
| D1 | No block-user or report-user capability anywhere; no message content filtering (off-platform-payment scam patterns) — MESSAGES-006/007, confirmed absent | grep across all three packages |
| D2 | Background check gates only the badge — unbadged welpers are fully discoverable and bookable. Either enforce (check required to go live) or reframe the safety narrative honestly ("look for the badge") | `service-discovery.service.ts:208-214` |
| D3 | Welpers bookable with no payout account — money has nowhere to settle; recovery burden lands on ops later | `welper-marketplace-eligibility.util.ts` |
| D4 | Certn webhook accepts unsigned payloads when secret unset (forged background-check results possible in misconfigured env) — risks file #2b | `certn-webhook.controller.ts:41` |
| D5 | Login endpoint has no request-rate cap (lockout only) — risks file #2d | `modules/auth/auth.controller.ts:56` |
| D6 | Dispute outcomes invisible to participants; welper has no response surface (DISPUTES-005/007) | backlog, verified open |

### E. Build the lifecycle (nothing currently brings anyone back)

| # | Finding | Evidence |
|---|---|---|
| E1 | One `@Cron` in the entire BFF (payment capture). No abandoned-signup, incomplete-setup, pending-booking, or dormant-user nudges | `payment-capture.scheduler.ts` (sole scheduler) |
| E2 | Notification-preferences UI doesn't exist (`useNotificationPreferences` has zero consumers) despite backend support — users can't tune channels, increasing unsubscribe/ignore risk when emails do start | NOTIFICATIONS-002 🟡 |
| E3 | First-run dashboard still shows zero-value stat tiles after setup completes; welper's own dashboard never shows their rating/response-time (DASHBOARD-001 P2, DASHBOARD-003 open) | `dashboard_features.md` validated |
| E4 | `PLATFORM_ACCESS_GATED` is advisory-only — surfaced in DTOs, enforced nowhere. If you believe you're running a gated beta, you aren't; if you want one, it needs a guard | `common/platform-access.ts`, no enforcement found |

---

## Prioritized plan

### Week 1 — credibility & copy (each ≤ half a day, no architecture)

1. **Fix the platform footer** (C1): `/legal/terms`, `/legal/privacy`, real socials, remove the fake phone. *One file.*
2. **Reconcile charge-timing copy** (B2) to the truth everywhere: "No charge when you book. A one-hour hold when your welper accepts. Charged only after the job is done." This is your single best trust line — the FAQ currently ruins it.
3. **Honest reviews** (C2): drop the hardcoded `verified` pill or relabel "Booked through Welpco"; replace "Customer #3F2A1B" with first name + initial (fallback "Welpco customer").
4. **One safety promise** (C3): keep only the SLA you can honor today (48h), delete "4 hours" until a real escalation exists. Keep the 911 line.
5. **Remove or hedge the minors banner** (C4) until the guardian flow actually opens.
6. **Wire the welcome email** (B4): call the existing template from `finishSignup`, role-specific ("here's how to get your first booking" / "here's how to go live").
7. **Notify the customer on booking creation** (B3, first half): emit to the customer too + add "what happens next" copy under the Pending chip.
8. **Fix the checklist lie** (B1, cheap version): mark the card required-to-book ("Required before your first booking") and check payment method at the *top* of the booking wizard with an inline add-card prompt — not at submit.
9. **Render real trust signals you already have** (C5): response time on cards/profiles; welper's own stats on their dashboard (DASHBOARD-003 — data already in `hydrate()`).

### Sprint 1 — open the front door + secure the base

10. **Public browse & search** (A1/A2) — the structural lever. Public profiles already exist; expose read-only search (no exact addresses, no contact), gate only booking/messaging behind signup. Every marketplace that cracked cold-start did this. Also fixes the hero CTA problem: "Find help" → live results.
11. **Real social proof** (A3/A4): replace fabricated testimonials with real beta quotes (or founder story + guarantees if none exist yet — never fake, bible §22.6); publish rate ranges per category; disclose the welper $19.99 fee pre-signup (it builds trust with customers when framed as "every badge is a paid, real check").
12. **Security hardening** (D4/D5): Certn webhook fail-closed; login rate cap. Small, and an incident during launch would be fatal to trust.
13. **Payout before accept** (D3): allow discovery without Stripe Connect, but require it to *accept* a booking ("Connect your bank to accept this job") — natural motivation moment, prevents money dead-ends.

### Sprint 2 — activation & lifecycle

14. **Lifecycle emails** (E1): abandoned-signup (24h), incomplete-setup (72h), pending-booking reminder to welper (auto-decline timer eventually), "you're live but no offering views" nudge. Needs a small scheduler pattern — the payment cron is the template.
15. **Booking anxiety loop** (B3 full): live status updates (BOOKING-003), then reschedule (BOOKING-002), then slot reservation (BOOKING-001).
16. **Block/report + message safety** (D1): block user, report user, and a first-pass off-platform-payment pattern warning in chat.
17. **Dispute outcome visibility** (D6) and notification preferences UI (E2).
18. **First-run hero** (E3): replace the wall of zeros with a role-appropriate "do this next" hero.

### Decide (product, not code)

- **Background check positioning** (D2): *Option A* — required to go live (stronger safety story, more supply friction); *Option B* — optional badge, but market it hard ("look for the shield"). Current state is the worst of both: fee feels skippable to welpers, protection feels ambient-but-hollow to customers.
- **`PLATFORM_ACCESS_GATED`** (E4): enforce it as a real waitlist/invite gate, or delete it.

---

## Measure it

Instrument the funnel before shipping changes so wins are attributable: landing → register begin → identity complete → finish → email verified → first search → booking submitted → booking accepted (customer); wizard finish → each Section-A task → discoverable → first booking received → payout connected (welper). Track the two conversion cliffs this report predicts: **verify-email → first search** and **booking-wizard open → submit**. If no analytics exists yet, even server-side counters on these events beat nothing.

---

*Cross-references: [implementation-risks.md](implementation-risks.md) (2b, 2d, 9b–9d), [backlog/](backlog/README.md) (LOGIN-003, BOOKING-001/002/003, MESSAGES-006/007, DISPUTES-005/007, REVIEWS-001, DASHBOARD-001/003, NOTIFICATIONS-002), [audits/](audits/).*
