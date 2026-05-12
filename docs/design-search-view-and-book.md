# Design: Search Results — View Profile Dialog & Book Now Wizard

## Purpose

From dashboard search results, customers can:
1. **View profile** — Open a dialog showing the Welper’s resume (no navigation).
2. **Book now** — Start a step-by-step wizard: answer service-related questions (from Content Manager), then confirm the booking.

## Audience & Tone

- **Audience**: Logged-in customers on the dashboard searching for Welpers.
- **Tone**: Warm, professional, clear. Actions are explicit: “View profile”, “Book now”. Copy is concise and Welpco-specific.
- **Differentiation**: The resume is presented as a focused, scannable profile (not a full page). The booking flow is a guided wizard driven by **content-manager service questions** (category-based), so it feels tailored to the service type.

## Design direction (frontend-design alignment)

- **Typography**: Use existing Radix/UI bible hierarchy. Dialog and wizard titles use `Heading size="7"`; body and labels use `Text size="2"`; helpers use `Text size="1" color="gray"`.
- **Color & theme**: Primary actions green; neutral/cancel gray. No new palette—stay within the design system.
- **Spatial composition**: Generous spacing in the dialog (resume sections with `gap="5"`). Wizard: one question per step, clear progress, and a summary step before confirm.
- **Motion**: Optional subtle transition when opening dialog/wizard (Radix Dialog handles overlay). No heavy animation—focus on clarity and trust.

---

## 1. View profile → Dialog (Welper resume)

### Behaviour

- From search results (list or grid), **“View profile”** opens a **dialog** (modal).
- Dialog content: **Welper resume** — same data as public profile, laid out for quick scanning inside the modal.
- No route change; user stays on `/dashboard/search`.

### Content structure (inside dialog)

1. **Header**
   - Large avatar, name (Heading), title/role line.
   - Optional: rating + review count if available.
2. **Bio**
   - Short paragraph (bio or “No bio”).
3. **Services**
   - List of service offerings: category name, description snippet, rate (e.g. “$X/hr”).
   - Each offering can have a **“Book this service”** action that starts the booking wizard for that offering.
4. **Footer**
   - Primary CTA: **“Book now”** (opens booking wizard; if multiple offerings, wizard step 0 = choose offering).
   - Secondary: **“Close”** (dismiss dialog).

### Data

- **Source**: `getPublicWelperProfile(welperId)` (existing service-discovery API).
- **Loading**: Show skeleton or spinner inside dialog until profile is loaded.
- **Error**: Inline message + “Close” / “Try again”.

### UI details

- Dialog: Radix `Dialog`; title = Welper name (or “Welper profile” while loading).
- Card/sections: Use `Card` or `Box` with `gap="5"` between sections.
- Buttons: “Book now” `color="green"`, “Close” `variant="soft"` `color="gray"`.
- Scroll: Dialog content scrollable if long (e.g. many offerings).

---

## 2. Book now → Step-by-step wizard

### Behaviour

- **Entry points**:  
  - From search result card: **“Book now”** → wizard opens.  
  - From profile dialog: **“Book now”** or **“Book this service”** on an offering → wizard opens.
- Wizard is a **multi-step flow** in a **dialog** (or full-screen on small screens if preferred; here we assume dialog for consistency).
- Steps:
  1. **Select service** (if Welper has multiple offerings): pick one offering. If only one, skip.
  2. **Questions**: One step per **service question** (from Content Manager: `getServiceQuestions(serviceCategoryId)`). Order by `displayOrder`. Each step shows one question; support types: text, number, date, time, choice, boolean (and entity_reference later if needed).
  3. **Summary**: Show chosen offering + answers.
  4. **Confirm**: Submit (stub: show success state; no real booking API yet).

### Data

- **Welper + offerings**: `getPublicWelperProfile(welperId)`.
- **Questions**: `getServiceQuestions(serviceCategoryId)` where `serviceCategoryId` = selected offering’s `serviceCategoryId`.
- **Payload**: `{ welperId, offeringId, serviceCategoryId, answers: { questionId: value } }`. Stored in state; submit step can later call a booking API.

### Wizard UI

- **Progress**: Step indicator (e.g. “Step 2 of 5”) or stepper dots.
- **Per step**: One question; label (required asterisk if `isRequired`); input per `Question.type` (TextField, Select, DatePicker, Checkbox, etc.); optional `helpText` below; Next / Back.
- **Form rhythm**: Per UI bible — `Box mb="3"` per field, label `mb="1"`, error `mt="2"`.
- **Summary step**: Read-only list of question labels + answers.
- **Confirm step**: “Confirm and send request” (green). On success: “Request sent” + short message; close button.

### Edge cases

- No offerings: Disable “Book now” or show message “No services to book.”
- No questions for category: Skip from “Select service” to “Summary” (only offering chosen).
- Conditional logic: If `ServiceQuestion.conditionalLogic` exists, show question only when condition on previous answer is met (can be Phase 2).

---

## Implementation order

1. **WelperProfileDialog** (UI package): Dialog that fetches `getPublicWelperProfile(welperId)`, renders resume (avatar, name, bio, offerings), and exposes “Book now” / “Book this service” that trigger a callback (e.g. `onBook(offering?)`).
2. **BookingWizard** (UI package): Dialog/wizard that accepts `welperId`, optional preselected `offering`; fetches profile + service questions; runs steps (select service → questions → summary → confirm); on confirm, calls `onSubmit(payload)` (stub success in app).
3. **Dashboard search page**:  
   - **View profile**: `onView` opens `WelperProfileDialog` with `welperId` (no navigation).  
   - **Book now**: `onBook` opens `BookingWizard` with `welperId` (and optionally offering when triggered from dialog).  
   - Pass `welperId` (and when available `offering`) from search result items into these handlers.

---

## Summary

| Feature           | Trigger        | UX                        | Data / API                          |
|------------------|----------------|---------------------------|-------------------------------------|
| View profile     | “View profile” | Dialog with Welper resume | `getPublicWelperProfile(welperId)`  |
| Book now         | “Book now”     | Wizard: service → questions → summary → confirm | Profile + `getServiceQuestions(serviceCategoryId)` |
| Book this service| From dialog    | Same wizard, offering pre-selected | Same                                |

All components stay within the UI bible (Radix props, spacing, typography, colors). The wizard reuses existing form patterns and content-manager types (`Question`, `ServiceQuestion`).
