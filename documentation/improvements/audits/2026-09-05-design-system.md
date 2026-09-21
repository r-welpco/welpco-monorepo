# Design system and component audit — 2026-09-05

The Radix foundation is useful and the component catalog is substantial, but the system does not currently meet its own accessibility and verification expectations. Fix the primary-button contrast and interaction defects, restore the Storybook baseline, then consolidate app-specific implementations and token documentation.

This audit changes documentation and saves evidence only. No product components were edited.

## Scope and measured baseline

Reviewed shared primitives, platform patterns, tokens, the UI/UX bible, Storybook configuration and stories, design lint rules, and selected web/admin consumers. Inventory: **174 TSX files in `packages/ui/src`, including 121 platform TSX files; 135 story files containing 484 stories.** These are file/story counts, not a claim that every exported component or product journey was manually reviewed.

| Check | Result |
| --- | --- |
| `pnpm --filter @welpco/ui type-check` | Passed |
| `pnpm --filter @welpco/ui build` | Passed; refreshed the package consumed by Storybook |
| ESLint across UI, web, admin, and stories | 857 files; **1,436 warnings, 0 errors** |
| `pnpm --filter @welpco/design-system test:a11y --maxWorkers=2` | **435 passed, 49 failed**; 114 passing / 21 failing suites; 112.9 seconds |
| Failure classification | **28 accessibility assertions, 21 rendering exceptions**; these are failed tests, not unique defects |
| Additional browser matrix | Seven default stories × light/dark × 375/1440px = **28 checks** |
| Interaction reproductions | Password reveal, rejected chat send, and opening a dialog |
| Visual inspection | Mobile profile card, dark rating form, and calendar screenshots |

The seven matrix stories were BookingForm, RecurringBookingForm, ConversationList, RatingForm, SearchFilters, WelperProfileCard, and LoginForm. All fit the viewport in this matrix. RatingForm, SearchFilters, and WelperProfileCard each reproduced an accessibility violation in all four combinations. This is not a full authenticated-route, localization, keyboard, or screen-reader audit.

Commands ran with the installed Node **26.8.1**, while the repository requests Node **22.x**. The commands emitted an engine warning. The reported component defects also have direct source and browser evidence; repeat the baseline under the supported Node version when integrating fixes. The independent browser probe initially hit the addon's existing “Axe is already running” race; the completed probe waits for it to settle. None of the 49 failures in the completed full runner were classified as that race.

## Prioritized findings

### 1. P1 — Default grass primary buttons fail normal-text contrast

The shared [Button](/Users/rabie/Developer/TowerGit/welpco-monorepo/packages/ui/src/button.tsx:9) defaults to a solid variant without a contrast adjustment, and the theme supplies grass. In [RatingForm](/Users/rabie/Developer/TowerGit/welpco-monorepo/packages/ui/src/platform/review-rating/rating-form.tsx:258), the enabled submit button renders white text on `#46a758`: axe measured **3.03:1**, below **4.5:1** for its 16px normal text. This reproduced in light/dark at both tested widths. The default Button story also disables contrast checking at [line 17](/Users/rabie/Developer/TowerGit/welpco-monorepo/apps/design-system/stories/Components/button.stories.tsx:17).

Fix the primary foreground/background contract centrally, evaluating Radix `highContrast` or a darker solid accent treatment. Verify default, hover, focus, and pressed states across both appearances. Keep active controls in contrast checks; normal primary CTAs are not decorative exceptions. [W3C contrast criterion](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

### 2. P2 — The composite password field cannot reveal its value

[Input](/Users/rabie/Developer/TowerGit/welpco-monorepo/packages/ui/src/input.tsx:36) forwards `type="password"` through `fieldProps`. [PasswordField](/Users/rabie/Developer/TowerGit/welpco-monorepo/packages/ui/src/password-field.tsx:38) spreads those props **after** its state-derived `type`. Clicking “Show password” therefore changes `aria-pressed` to `true` and the label to “Hide password,” while the input remains `type="password"`.

This affects the actual [admin login](/Users/rabie/Developer/TowerGit/welpco-monorepo/apps/admin/app/login/login-form.tsx:71) and admin account creation. Strip `type` from the password branch or ensure PasswordField's derived type wins. Add an interaction test through **Input**, because the standalone PasswordField story does not exercise this composition.

### 3. P2 — A failed chat send discards the user's draft

[ChatInput.handleSubmit](/Users/rabie/Developer/TowerGit/welpco-monorepo/packages/ui/src/platform/communication/chat-input.tsx:56) invokes its Promise-capable `onSend` without awaiting it and immediately clears the message. A browser fixture with a rejected send promise confirmed that “Keep this draft” becomes an empty string and the rejection is unhandled by the component.

Clear only after success, preserve the draft on failure, and expose a retry/error state. Account for a user typing another message while the first send is pending. No current `apps/web` TSX consumer of this shared ChatInput was found, so this is a confirmed library contract defect, not a claim that an active chat route lost messages.

### 4. P2 — The radius slider has no accessible name on its interactive thumb

[SearchFilters](/Users/rabie/Developer/TowerGit/welpco-monorepo/packages/ui/src/platform/service-discovery/search-filters.tsx:85) labels the Radix Themes slider root. The installed Themes implementation does not forward that label to the thumb carrying `role="slider"`. The browser reported `aria-input-field-name` on `.rt-SliderThumb` in all four matrix combinations.

The [story suppression](/Users/rabie/Developer/TowerGit/welpco-monorepo/apps/design-system/stories/Platform/ServiceDiscovery/search-filters.stories.tsx:10) calls this a false positive because visible text exists. It is a real missing programmatic association. Provide a labeled thumb through an appropriate shared wrapper/primitive composition and remove the suppression. For range sliders, name the minimum and maximum thumbs separately. [W3C slider pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider/).

### 5. P2 — Verification badges put their entire meaning on an invalid label

[VerifiedTrustBadge](/Users/rabie/Developer/TowerGit/welpco-monorepo/packages/ui/src/platform/service-discovery/verified-trust-badge.tsx:46) renders `aria-label` on a generic span while hiding both icons from assistive technology. Axe reports `aria-prohibited-attr` on the badge in WelperProfileCard in light and dark. This is a core marketplace trust signal, so its meaning must be available without hovering over the tooltip.

Use visible or visually hidden text, or a suitable semantic role with an accessible name. Apply the same review to MinorTrustBadge. Verify both passed and not-passed states on profile cards and dialogs.

### 6. P2 — AvailabilityCalendar declares an incomplete ARIA grid

The weekday [row](/Users/rabie/Developer/TowerGit/welpco-monorepo/packages/ui/src/platform/profile-management/availability-calendar.tsx:195) sits outside the [grid](/Users/rabie/Developer/TowerGit/welpco-monorepo/packages/ui/src/platform/profile-management/availability-calendar.tsx:215), and dates are buttons without the required row/gridcell hierarchy. Five calendar stories fail `aria-required-children` and `aria-required-parent`. The component also does not implement grid-style arrow navigation or roving focus.

Either implement a complete calendar grid interaction or use simpler semantics appropriate to the actual button collection. Separately, the default [story wrapper](/Users/rabie/Developer/TowerGit/welpco-monorepo/apps/design-system/stories/Platform/ProfileManagement/availability-calendar.stories.tsx:19) is fixed at 800px: the 375px screenshot overflows because of that wrapper. This is evidence of a broken mobile **test fixture**, not proof that the component itself requires 800px.

### 7. P2 — The accessibility runner misses open portal content and interaction states

The custom [runner](/Users/rabie/Developer/TowerGit/welpco-monorepo/apps/design-system/.storybook/test-runner.ts:60) scans only `#storybook-root`. Opening the `Dialog/WithoutTitle` story confirmed that the dialog portal is outside this element. Most overlay stories also start closed, and none of the 135 story files defines a `play` function. Thus a passing custom scan can cover only the trigger, leaving dialog content and menu states unchecked. The addon can still produce diagnostics separately; it is not a substitute for an enforced assertion over the intended content.

Scan a scope that includes portals after opening each overlay. Explicitly assert accessible names, focus entry/return, Escape, and relevant keyboard paths. The runner does not establish a light/dark × viewport matrix; [initialGlobals](/Users/rabie/Developer/TowerGit/welpco-monorepo/apps/design-system/.storybook/preview.tsx:50) defaults to light. Story exports named Mobile or toolbar presets do not establish automated responsive coverage on their own.

### 8. P2 — Storybook examples have drifted from the public API

There are **21 rendering failures** across Radio, Table, Tooltip, CheckboxGroup, Callout, PaymentStatusBadge, PaymentAuthorizationCard, and JobApplicationForm. These cannot provide reliable component documentation or accessibility coverage until they render.

Concrete examples: [Tooltip stories](/Users/rabie/Developer/TowerGit/welpco-monorepo/apps/design-system/stories/Components/tooltip.stories.tsx:7) use nonexistent `Tooltip.Root/Trigger/Content` members on the Themes component. [PaymentStatusBadge stories](/Users/rabie/Developer/TowerGit/welpco-monorepo/apps/design-system/stories/Platform/PaymentProcessing/payment-status-badge.stories.tsx:19) pass unsupported `processing` and `completed` statuses. PaymentAuthorizationCard stories omit its required `status` and use obsolete props.

Update fixtures against the exported component types and add a **scoped Storybook type-check** to the normal checks. The design-system package currently has no type-check script; its tsconfig also includes `../**`, which reaches neighboring apps and should be narrowed before adding that check.

### 9. P2 — Web consumers still use a less accessible duplicate dialog

The local [web DialogContent](/Users/rabie/Developer/TowerGit/welpco-monorepo/apps/web/components/ui/dialog.tsx:41) has an unlabeled icon-only close button and a separately maintained absolute-positioned close layout. The shared package already supplies a labeled close button and header layout. RoleSwitchDialog, CustomerPreviewDialog, ApplyBlockedDialog, and the marketplace detail page still import the local version.

Route these consumers through the shared implementation and retain only compatibility re-exports where needed. Review all 18 files in `apps/web/components/ui` for duplicates. Avoid treating unused duplicate code as a production defect: the local blue-default Button is a divergence risk, while the dialog has verified consumers.

### 10. P2 — The declared Geist typography is not applied to Radix components

The bible declares Geist as the primary font. Storybook [preview.css](/Users/rabie/Developer/TowerGit/welpco-monorepo/apps/design-system/.storybook/preview.css:3) applies it to `body`, but the computed font on `.radix-themes` remains Radix's system stack. The browser captured **Geist on body, system fonts inside the theme**. Web's root layout similarly registers Geist CSS variables without connecting them to Radix's `--default-font-family`.

Define shared theme typography at the Radix token layer and use it in Storybook and product providers. Then recheck wrapping, headings, buttons, and form density. Marketing intentionally has separate display/body tokens; preserve explicit surface decisions rather than assuming every difference is accidental.

## Governance and consistency observations

- **Lint is advisory:** all seven design rules are warnings; the root lint command permits 9,999 warnings. The measured total comprises 1,372 inline-style warnings, 54 semantic-color warnings, five terminology warnings, three native-label warnings, and two icon-label warnings. By area: web 1,023; admin 280; shared UI 70; stories 63. This is a triage inventory, not 1,436 confirmed visual defects. Marketing and generated-image layouts account for many style warnings and may have legitimate exceptions.
- **Theme policy is fragmented:** web and Storybook use grass; admin has its own hard-coded gold/dark CSS palette, while its Radix Theme omits `accentColor`. Decide whether admin is a sanctioned variant and encode that decision centrally.
- **The canonical documents disagree:** bible §3.3 and `SEMANTIC_COLOR.primary` say grass; §5.1 still says green. PLATFORM-UX recommends a dialog size 5 although `DIALOG_SIZE` only permits 1–4. Resolve these contradictions before expanding lint enforcement.
- **Coverage needs meaningful states:** exact story exports include Loading in 46 files, Empty in 10, Error in two, and Mobile in five; other names such as WithError also exist, so these are naming counts, not exhaustive state-coverage percentages. Input and several newer booking/signup components lack dedicated basename-matching stories. Add coverage around real failure and recovery paths before more variant galleries.

## Suggested execution order

1. Repair shared primary contrast, password reveal, accessible slider/badge semantics, the active web dialog close label, and the calendar semantics.
2. Repair the 21 rendering failures; scope story type-checking; cover portal content and add interaction tests for the defects above. Restore the accessibility baseline without expanding suppressions.
3. Fix ChatInput before adoption; centralize typography and sanctioned theme variants; reconcile the spec; establish a bounded lint baseline with explicit surface exceptions and a no-new-violations policy.

## Evidence

- [Browser reproductions and 28-check matrix](/Users/rabie/Developer/TowerGit/welpco-monorepo/artifacts/design-system-audit-2026-09-05/browser-checks.json)
- [Reproduction script](/Users/rabie/Developer/TowerGit/welpco-monorepo/artifacts/design-system-audit-2026-09-05/browser-reproduction.cjs) — run from this checkout while Storybook is on port 6006; writes temporary results under `/tmp`.
- [Full Storybook run](/Users/rabie/Developer/TowerGit/welpco-monorepo/artifacts/design-system-audit-2026-09-05/storybook-run.log)
- [Failed-test classification](/Users/rabie/Developer/TowerGit/welpco-monorepo/artifacts/design-system-audit-2026-09-05/storybook-failures.json)
- [Lint totals](/Users/rabie/Developer/TowerGit/welpco-monorepo/artifacts/design-system-audit-2026-09-05/lint-summary.json)
- [Computed typography and viewport measurements](/Users/rabie/Developer/TowerGit/welpco-monorepo/artifacts/design-system-audit-2026-09-05/visual-checks.json)
- [Mobile profile card](/Users/rabie/Developer/TowerGit/welpco-monorepo/artifacts/design-system-audit-2026-09-05/platform-servicediscovery-welperprofilecard--default-375-light.png), [dark rating form](/Users/rabie/Developer/TowerGit/welpco-monorepo/artifacts/design-system-audit-2026-09-05/platform-reviewrating-ratingform--default-375-dark.png), [calendar fixture overflow](/Users/rabie/Developer/TowerGit/welpco-monorepo/artifacts/design-system-audit-2026-09-05/platform-profilemanagement-availabilitycalendar--default-375-light.png)
