# Settings + profile-management — open tickets

Source: Day 10 settings + profile-management functional audit (`apps/web/AUDIT-LOG.md`).

The audit shipped 11 high-leverage bug-fixes (catalogued first, for traceability). The remaining open work is below — each ticket-ready, severity- and effort-tagged, ordered by leverage.

Cross-references:
- Auth surface: `features/login_features.md` (some of the recommendations here intersect with `LOGIN-012` email-change reverification and `LOGIN-014` account-deletion grace period — flagged inline rather than duplicated).

---

## Shipped in the Day 10 pass (no ticket needed; here for traceability)

| # | Severity | Surface | Change |
|---|---|---|---|
| Day10-01 | P1 | TimeSlotAvailability | Inverted-slot validation (end > start) on both add + edit paths; per-slot inline error with `aria-invalid` + `aria-describedby`; removed `document.getElementById` race in the Add button (controlled state); deleted dead `handleAddTimeSlot`. |
| Day10-02 | P1 | BFF availability DTO | `endTime > startTime` cross-field constraint via `EndAfterStartConstraint`; `HH:mm[:ss]` format `Matches` regex on both startTime + endTime. |
| Day10-03 | P1 | CustomerProfileForm | Added `useEffect(() => form.reset(...), [defaultValues])` so the form populates when the React-Query fetch resolves after mount (matches WelperProfileForm). |
| Day10-04 | P1 | AccountDeletionForm | Removed the password field that was collected but never sent to the BFF (security theatre). Rewrote copy: dropped "permanent / removed all your data" claims that the BFF doesn't actually honour (it does soft-delete to `DEACTIVATED`). The "Type DELETE" gate stays. Submit label "Delete my account" (was "Delete account permanently"). |
| Day10-05 | P1 | Settings page + EmailUpdateForm | Reworded "We'll send you a verification email" to match what the BFF actually does today (silent swap with `emailVerified=false`, user re-verifies on the verification screen). Cross-references `LOGIN-012` for the proper 2-step reverification flow. |
| Day10-06 | P2 | BFF service-offering DTO | `hourlyRate` bounded to `[1, 1000]` USD with `maxDecimalPlaces: 2`. Frontend `service-offering-schema.ts` now matches; bio + description gain length caps. |
| Day10-07 | P2 | BFF welper-profile DTO | `bio` gains `@MinLength(50)` + `@MaxLength(2000)` (was unbounded — anyone hitting the API directly could store a 50K-char bio). |
| Day10-08 | P2 | AvailabilityExceptions | Inverted-range silent-`return` replaced with a `role="alert"` Callout; reason textarea capped at 200 chars + character counter; cancel + reset on close. |
| Day10-09 | P2 | AddressInput | Every input now has `aria-required`, `aria-invalid`, and `aria-describedby` pointing at the error `<Text role="alert">`. Without this, screen-reader users hit a "this field has an error" wall with no announcement. |
| Day10-10 | P2 | ProfileCompletionStatus | Headline % is now strictly required-step progress (no longer counts unfilled optional steps against the user — bible §22.6 honesty); optional progress shown as a separate quieter row. Customer "Service preferences" check now requires at least one preferred category, not just a row presence. |
| Day10-11 | P2 | ProfilePhotoUpload | Re-entrancy guard while `uploading` (selecting a 2nd file mid-upload no longer races the preview vs the saved URL); validation moved before preview; input value reset on every settle so the same file can be retried. |
| Day10-12 | P3 | NotificationPreferences | SMS column hidden in the platform component (was filtered at the consumer; now defended in the component too — deferred per product call). |
| Day10-13 | P2 | E2E tests | `settings-tabs.spec.ts` was asserting the old default-tab content; updated to match the actual Account default. New `availability.spec.ts` test: inverted slot shows alert + does NOT PUT. New BFF DTO specs: `create-availability.dto.spec.ts`, `create-service-offering.dto.spec.ts`, `update-welper-profile.dto.spec.ts`. |

---

## SETTINGS-001 — Email-change reverification (re-flagged from LOGIN-012)

- **Priority**: P1 (cross-references LOGIN-012; this surface is the trigger)
- **Area**: Settings → Account tab + BFF user-management
- **Problem**: Day 10 fix Day10-05 reworded the copy to stop lying about a verification email that was never sent — but the underlying flow is still wrong: `PUT /api/users/me { email }` swaps the sign-in email, sets `emailVerified=false`, and trusts the new address. No challenge to the new address, no notification to the OLD address. If the session is compromised, the attacker rotates the email and locks the legitimate user out.
- **Proposed solution**: 2-step flow.
  1. User submits new email → BFF generates a verification code + sends to the NEW address; sends notification ("we received a request to change your email — if this wasn't you, click here") to the OLD address with a revert link.
  2. User enters the verification code → BFF swaps the email + invalidates other sessions.
- **Acceptance criteria**:
  - Email change is gated on verification of the new address.
  - OLD email receives a notification with a "this wasn't me" link that reverts the change request and forces a password reset.
  - All other refresh tokens for the user are invalidated on swap (defence-in-depth against session compromise).
  - Tests cover happy path + revert path + concurrent change requests (only the latest token is honoured).
- **Effort**: L.
- **Files**: `apps/bff/src/domains/user-management/users/users.service.ts`, new BFF `change-email` flow, web `apps/web/lib/services/user-service.ts`, settings page, `EmailUpdateForm`.

---

## SETTINGS-002 — Account-deletion grace period + restore (re-flagged from LOGIN-014)

- **Priority**: P1
- **Area**: BFF user-management + settings copy
- **Problem**: Day 10 fix Day10-04 made the copy honest about deactivation. But there's still no documented grace window or restore flow. Today: `DELETE /api/users/me` flips `status=DEACTIVATED` and that's it — no scheduled hard-delete, no restore link, no email notification. Anyone who clicks "Delete" in a panic moment has to email support to get back in, and we have no policy for when (if ever) data is hard-deleted.
- **Proposed solution**: 30-day soft-delete + restore window.
  1. On delete: BFF marks `deletedAt = now`, hides the profile, signs the user out.
  2. Email goes out: "We've deactivated your account. To restore it, sign in within 30 days. After 30 days, we delete your data for good."
  3. Sign-in within 30 days → restore (clear `deletedAt`, restore profile-visibility) and notify by email.
  4. Cron (or scheduled job) hard-deletes accounts past the 30-day window.
- **Acceptance criteria**:
  - Settings copy can truthfully say "30 days to restore" (currently it says "contact support" because there's no automation).
  - Restore on sign-in works, with audit log.
  - Hard-delete removes profile rows, photo S3 objects, payment-method tokens, and notification prefs (everything except references on bookings + reviews, which become "Deleted user").
  - Tests cover delete → cron → hard-delete; delete → sign-in → restore; delete → wait 31 days → can't restore.
- **Effort**: L.
- **Files**: `apps/bff/src/domains/user-management/users/users.service.ts`, new scheduled job module, settings page copy refresh, email templates, `AccountDeletionForm`.

---

## SETTINGS-003 — Phone-number international format validation

- **Priority**: P1
- **Area**: Customer + Welper profile forms; BFF DTOs
- **Problem**: `welper-profile-form.tsx:28` and `customer-profile-form.tsx:35` validate phone with `min(7)` only. The page-client (`page-client.tsx:243-251`) parses the phone string into `{countryCode, number, formatted}` for the BFF — but the parsing is heuristic: if the string starts with `+`, take the first 1-3 digits as country code; else default to `+1`; then `slice(-10)`. A user entering "555-1234" silently becomes `+1 + xxx5551234` (invalid). A user entering "+44 20 7946 0958" (UK, 10 digits after country code) gets sliced wrong.
- **Proposed solution**: `libphonenumber-js` (or equivalent) for parse + validate. Component renders a country dial-code chip + number input. Submit only valid E.164 numbers.
- **Acceptance criteria**:
  - International numbers (CA, US, UK, FR, AU) all parse + validate.
  - Invalid numbers (too short, too long, garbage) show an inline error.
  - The BFF DTO rejects numbers that don't conform to E.164.
  - Tests cover 5 country formats + 3 invalid inputs.
- **Effort**: M.
- **Files**: `packages/ui/src/platform/profile-management/{welper,customer}-profile-form.tsx`, new `<PhoneInput>` platform component, `apps/web/app/(dashboard)/dashboard/profile/page-client.tsx` (drop the heuristic parser), BFF `phone.validator.ts`.

---

## SETTINGS-004 — Postal/ZIP code shape validation per country

- **Priority**: P1
- **Area**: Customer profile address + Welper service-area
- **Problem**: `address-input.tsx:122` is `min(3)` only — accepts "ZZ" or "12" or any garbage. Search + booking matching depend on postal code; storing nonsense breaks the whole locality system silently.
- **Proposed solution**: country-aware regex.
  - **CA**: `^[A-CEGHJ-NPR-TVXY]\d[A-CEGHJ-NPR-TV-Z] ?\d[A-CEGHJ-NPR-TV-Z]\d$`
  - **US**: `^\d{5}(-\d{4})?$`
  - **UK**: `^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$`
  - **Default**: at least 4 alphanumeric chars; warn (not block) on unrecognised country.
  - On country change, normalise + uppercase the postal/zip in the input.
- **Acceptance criteria**:
  - The 3 priority countries' valid codes pass; invalid ones show "That doesn't look like a Canadian postal code" (etc).
  - BFF DTO mirrors the same regex set.
  - Tests cover 3 countries × valid + invalid each.
- **Effort**: M.
- **Files**: `address-input.tsx`, customer-profile-form schema, service-area-selector, BFF `address.validator.ts`.

---

## SETTINGS-005 — Service offering authoring: bulk actions, reordering, templates

- **Priority**: P2
- **Area**: Welper profile → Service offerings tab
- **Problem**: Today's authoring is one-at-a-time. New welpers (especially those bringing in services from another platform) face a tedious dialog-per-offering. Established welpers with 5+ offerings can't reorder them (the current order is `createdAt DESC` from the BFF) — so the "best" or "headline" offering can't be elevated.
- **Proposed solution**:
  - Drag-to-reorder offerings on the list. BFF stores `displayOrder int`; PATCH `/api/service-offerings/reorder` takes an array of ids in order.
  - Bulk actions: select-multiple toolbar with "Activate / Deactivate / Delete" (with `<ActionConfirmDialog>` for destructive bulk ops).
  - Templates: starter offerings keyed by category — when a welper picks "Home Cleaning" for the first time, prefill title + description from a curated template they can edit.
- **Acceptance criteria**:
  - Reorder persists across sessions.
  - Bulk-deactivate 5 offerings results in one BFF round-trip, not 5.
  - Templates are read-only references; editing them in a welper's account creates an instance that doesn't reflect template changes.
- **Effort**: L.
- **Files**: `service-offering-list.tsx`, new `service-offering-templates.tsx`, BFF `service-offering.service.ts` + new endpoint, content-management seeder for templates.

---

## SETTINGS-006 — Availability authoring: copy-week, vacation mode, repeating exceptions

- **Priority**: P2
- **Area**: Welper profile → Availability tab
- **Problem**: Setting up a 7-day weekly schedule is one slot at a time. There's no "vacation mode" (pause profile-visibility for X days, auto-resume). Holiday exceptions are one-shot — no repeating annual.
- **Proposed solution**:
  - **Copy-week / paste-week**: set Monday's slots → a "copy to all weekdays" button.
  - **Vacation mode**: a top-level toggle that sets `profileVisibility=Private` from `dateA` to `dateB` and auto-flips back; visualised in the calendar.
  - **Repeating exceptions**: e.g. "Every December 25th, Christmas" — one entry that materialises annually.
- **Acceptance criteria**:
  - Copy-week generates valid slots that pass the DTO validation (Day10-02).
  - Vacation mode survives BFF restart (it's persisted, not in-memory).
  - Repeating exceptions show in the next 12 months in the calendar; deleting deletes all instances.
  - Tests cover copy-week, vacation start + end, repeating exception over a year boundary.
- **Effort**: L.
- **Files**: `time-slot-availability.tsx`, `availability-exceptions.tsx`, `<VacationModeCard>` (new), BFF `availability.service.ts` + entity for repeating.

---

## SETTINGS-007 — Address autocomplete (Google / Mapbox)

- **Priority**: P2
- **Area**: Customer address + Welper service-area
- **Problem**: Today's `<AddressInput>` is four hand-typed fields. Users mistype, miss the apartment number, get the postal code wrong (see SETTINGS-004). For welper service-area especially, a wrong postal code = a wrong service radius = booked rides that can't be served.
- **Proposed solution**: Mapbox Geocoding (cheaper than Google for our volume, Canada-friendly). Single search input → autocomplete suggestions → fills all four fields + lat/lon. Manual override stays available for edge cases.
- **Acceptance criteria**:
  - Search "123 main st toronto" → top suggestion fills postal code + province + country.
  - Selected address writes lat/lon into the BFF (extends the welper service-area + customer address entities).
  - Manual override path still works if Mapbox is rate-limited or returns nothing.
  - Privacy: search-as-you-type is debounced 300ms; we don't store the search query.
- **Effort**: M.
- **Files**: `<AddressInput>`, new `<AddressAutocomplete>` wrapper, env config (`NEXT_PUBLIC_MAPBOX_TOKEN`), BFF migration to add lat/lon to customer-profile addresses.

---

## SETTINGS-008 — Photo flows: crop, multiple photos, primary selection

- **Priority**: P2
- **Area**: Profile photo upload (welper especially)
- **Problem**: One photo per profile, no crop, no preview-then-confirm. Welpers want to convey their work — a single mugshot doesn't sell trust; a portfolio of action shots does. The S3 presign infra is already there (upload-service.ts).
- **Proposed solution**:
  - Crop on upload (square 1:1 for avatars, free crop for portfolio).
  - 1 primary + up to 6 portfolio photos for welpers.
  - Drag to reorder portfolio.
  - Primary photo selectable from any uploaded.
- **Acceptance criteria**:
  - Crop UI uses an existing lib (`react-image-crop` or similar).
  - Primary photo appears on welper card + search results.
  - Portfolio photos appear on welper detail page only.
  - Deleting a photo cleans up S3 (BFF emits a delete-event consumed by an S3 cleanup worker — same pattern as account-deletion).
  - a11y: keyboard reorder via arrow keys; alt-text input per photo.
- **Effort**: L.
- **Files**: `<ProfilePhotoUpload>`, new `<PhotoGallery>`, BFF `photo.entity.ts`, S3 cleanup worker.

---

## SETTINGS-009 — Concurrent edit safety (optimistic locking)

- **Priority**: P2
- **Area**: All profile + settings forms
- **Problem**: User opens settings in two tabs. Tab A edits + saves. Tab B (still showing the pre-edit data) edits + saves — silently overwrites tab A. Today there's no version check, no last-modified header, no surface that says "this changed somewhere else."
- **Proposed solution**: BFF returns `version: number` on every entity read. Mutations require `If-Match: <version>` (or a body field). On version mismatch BFF returns `409 Conflict` with the current entity. UI on 409 shows a toast: "Looks like this changed in another tab. Refresh to see the latest."
- **Acceptance criteria**:
  - Two simultaneous edits → only the first wins; the second sees a 409 and a clear message.
  - The "refresh" action in the toast invalidates the React-Query cache and reloads the form.
  - Tests: integration test of two concurrent saves.
- **Effort**: L.
- **Files**: every profile + settings entity in BFF, web hooks layer (`use-profile.ts`, `use-settings.ts`), shared 409 handler in `lib/api/client.ts`.

---

## SETTINGS-010 — Long-form profile abandonment: localStorage draft persistence

- **Priority**: P2
- **Area**: Welper profile editor (the heaviest form)
- **Problem**: Welper profile is hefty (bio + photos + services + availability + service area). If the user closes the tab mid-edit, everything's lost. Today there's no draft save, no autosave indicator.
- **Proposed solution**: every form's `useForm` instance writes a debounced (500ms) draft to localStorage keyed on user-id + form-id. On mount, if a draft exists newer than the server's `updatedAt`, surface a banner: "We saved a draft from your last session — restore it or start fresh?"
- **Acceptance criteria**:
  - Closing the browser mid-edit → reopening shows the draft prompt.
  - Successful save clears the draft.
  - Draft is scoped to the user (not visible to a different user on the same device).
  - "Start fresh" cleanly clears localStorage.
- **Effort**: M.
- **Files**: new `useFormDraft` hook in `apps/web/lib/hooks/`, instrumented in welper-profile-form, customer-profile-form, service-offering-form.

---

## SETTINGS-011 — Profile completion: actionable next-step instead of % only

- **Priority**: P2
- **Area**: Profile overview
- **Problem**: Even after Day10-10 honesty fix, the meter still leans on a number. Bible §17.3 (empty states) + §19.3 (stats tiles) suggest a richer treatment: show the single biggest unfilled blocker as a prompted action, not a percentage. "Add a profile photo" is more useful than "67%".
- **Proposed solution**: Above the percentage, render the largest unfilled required step as a CTA card: "Add a profile photo (most welpers see 2× more bookings with one)". When all required are done, swap to "Add a service offering" or "Set your availability" — whichever is the highest-leverage next action.
- **Acceptance criteria**:
  - When 1+ required step is incomplete, the CTA shows the first one + a "why it matters" line.
  - When all required steps are complete, the CTA promotes the highest-leverage optional step.
  - When everything is complete, the CTA switches to a "View your public profile" link.
  - Voice + tone passes `design:ux-copy` review (bible §22).
- **Effort**: S (single component, no BFF changes).
- **Files**: `profile-completion-status.tsx`.

---

## SETTINGS-012 — GDPR / CCPA: download my data

- **Priority**: P2 (regulatory, not UX-driven, but required to launch in CA / EU)
- **Area**: Settings — privacy tab
- **Problem**: No "download my data" flow. We're going to need this for any serious launch (GDPR Art. 15, CCPA §1798.110). No place for it to live; settings → privacy is the natural home.
- **Proposed solution**: BFF endpoint that produces a JSON archive of the user's account, profile, bookings, messages, reviews, payment methods (tokenised refs only — never card numbers) and emails the user a signed-URL download link. Async — the BFF emits an event, a worker collects + uploads the archive, mailer sends the link.
- **Acceptance criteria**:
  - User clicks "Download my data" → toast "We're putting your archive together. We'll email you when it's ready (usually under 5 minutes)."
  - Email arrives with a signed-URL link valid for 24h.
  - The archive contains only the requesting user's data (verified by integration test with a 2-user fixture).
  - Audit log records every export.
- **Effort**: M (mostly BFF + worker + email).
- **Files**: new BFF `data-export.module.ts`, settings privacy tab.

---

## SETTINGS-013 — Welper bio profanity / safety scan

- **Priority**: P3
- **Area**: BFF welper-profile + settings
- **Problem**: Bio is free-form text shown publicly. Today there's no profanity filter, no PII redaction (phone numbers / emails / Instagram handles trying to route bookings off-platform), no safety review. The §22.6 "every conversation happens in our chat" promise is meaningless if the welper just puts a phone number in their bio.
- **Proposed solution**: lightweight async safety scan on bio submit.
  - Profanity match (open-source lib like `bad-words`).
  - Phone-number / email regex detection → block submission with explainer: "Profiles can't include direct contact info — keep conversations on Welpco so we can back you up if something goes wrong."
  - For ambiguous content, queue for moderator review without blocking the save (status: `under_review`, profile still public, badge to admin).
- **Acceptance criteria**:
  - Bios with phone numbers or emails are blocked at the API + clear error message.
  - Profanity is blocked with a softer message ("Welpco bios stay PG — please rephrase").
  - Tests cover 5 abuse patterns.
- **Effort**: M.
- **Files**: BFF `bio.validator.ts`, `welper-profile.service.ts`, FE error mapping.

---

## SETTINGS-014 — Settings nav: sticky header on scroll, mobile sheet

- **Priority**: P3
- **Area**: Settings page
- **Problem**: 5 tabs is a lot; on mobile they wrap to two rows; on desktop they sit at the top of the page and disappear when scrolling a long form (notifications can run long). UX feels stale compared to the rest of the bundle.
- **Proposed solution**:
  - Desktop: sticky tab list (`position: sticky; top: 0`) with the cream-glass treatment from `<TopNav>`.
  - Mobile: switch to a `<Sheet>` (slide-in) navigation triggered by a "Settings menu" button — pattern matches the marketing TopNav drawer (`apps/web/components/features/marketing-new/shared/top-nav.tsx`).
- **Acceptance criteria**:
  - Tabs visible while scrolling on desktop.
  - Mobile: settings menu in a sheet with focus management + Escape close + scroll lock (same patterns as marketing).
  - a11y: `role="navigation"` + `aria-label="Settings sections"` on the tab list.
- **Effort**: S.
- **Files**: `apps/web/app/(dashboard)/dashboard/settings/page.tsx`.

---

## SETTINGS-015 — Notification preference defaults: opt-in vs opt-out honesty

- **Priority**: P3
- **Area**: BFF notification-preferences seeding
- **Problem**: Today's defaults aren't documented. Bible §22.6 honesty + GDPR/CASL both want explicit opt-in for marketing; transactional (booking, payment) is implicit. Need to verify what's seeded, document it, and make sure marketing/system rows default to OFF.
- **Proposed solution**: audit the seed data — explicitly seed `marketing` + `system` to `emailEnabled: false, inAppEnabled: false`. Transactional categories (`booking`, `payment`, `message`, `security`) default `emailEnabled: true, inAppEnabled: true`. Document in a comment block on the seed.
- **Acceptance criteria**:
  - New users get marketing-OFF by default.
  - Existing users untouched (no silent flip).
  - A migration validates the seed shape on each release.
- **Effort**: S.
- **Files**: BFF notification-preferences seeder + module.

---

## SETTINGS-016 — Resend-code countdown on email change

- **Priority**: P3 (depends on SETTINGS-001 shipping first)
- **Area**: Email-change verification screen
- **Problem**: Once SETTINGS-001 lands, the user will hit the verification screen for the new email. Same UX issue as LOGIN-010: no client-side cooldown on "Resend code", users hammer it, see unexplained 429s.
- **Proposed solution**: 30s countdown on resend after each click; same pattern as LOGIN-010 once that ships.
- **Effort**: XS (reuses LOGIN-010's component).

---

## SETTINGS-017 — Service-offering "active" toggle: confirm the visibility cost

- **Priority**: P3
- **Area**: Service offering list
- **Problem**: Today the active/inactive toggle is silent and instant. A welper can accidentally hide their best offering with a stray click. Bible §22.6: trust the user, but make destructive defaults visible.
- **Proposed solution**: toggling from "Active" to "Inactive" prompts: "Hide this offering from search? Customers won't find it until you turn it back on." Cancel / Hide. The reverse direction stays silent (it's purely additive).
- **Effort**: XS.
- **Files**: `service-offering-list.tsx` or its consumer.

---

## SETTINGS-018 — Notification mutation: confirm BFF returns full set, not diff

- **Priority**: P3 (verification, not implementation)
- **Area**: Notification preferences
- **Problem**: `useUpdateNotificationPreferences` (`use-notifications.ts:78`) does `setQueryData(["notifications","preferences"], data)` from the mutation response. If the BFF's response is the single changed row instead of the full preferences list, the cached list shrinks to one row → the UI then renders only that row until refetch.
- **Proposed solution**: verify the BFF response shape; if it's a diff, change to `invalidateQueries` so React Query refetches the full set. Add an integration test.
- **Effort**: XS (verify + maybe one-line change).
- **Files**: `apps/web/lib/hooks/use-notifications.ts`, BFF notification-preferences controller.

---

## Suggested execution bundles

### "Small wins, ship together" (~1-2 days)

`SETTINGS-011` (actionable next-step) + `SETTINGS-014` (sticky/sheet nav) + `SETTINGS-017` (deactivate confirmation) + `SETTINGS-018` (verify mutation cache).

UX polish + one defensive verification. Zero schema changes.

### "Pre-launch trust hardening" (~1 sprint)

`SETTINGS-001` (email reverification) + `SETTINGS-002` (account-deletion grace) + `SETTINGS-003` (phone validation) + `SETTINGS-004` (postal validation) + `SETTINGS-013` (bio safety scan).

Closes the trust + data-quality gaps that show up in real usage. Each is independently shippable but pair well.

### "Authoring upgrades" (welper retention)

`SETTINGS-005` (offering authoring) + `SETTINGS-006` (availability authoring) + `SETTINGS-007` (address autocomplete) + `SETTINGS-008` (photo flows) + `SETTINGS-010` (draft persistence).

Mostly UI work; this bundle is what new welpers will rate the platform on.

### "Compliance + safety" (regulatory)

`SETTINGS-002` (account-deletion grace, also in pre-launch bundle) + `SETTINGS-012` (GDPR data export) + `SETTINGS-015` (notification opt-in defaults).

If targeting CA / EU launch, this bundle is non-negotiable.

### "Concurrency + multi-tab"

`SETTINGS-009` alone — it's a cross-cutting BFF + web change, best done in isolation with focused integration tests.
