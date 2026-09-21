# Design-system remediation — implementation and release evidence

Implemented on Node **22.21.1**, preserving the original 484 story exports and existing production import paths. No framework versions, backend endpoints, routes, payment integrations, validation schemas, or account permissions were changed. Changes remain uncommitted for review.

## Review and rollback boundaries

Review the following groups in order. Keep typography as a separate final change. Revert dependent tests/migrations together with the corresponding component addition; never remove `LabeledSlider` while its consumers still import it.

1. **Regression infrastructure and story repairs:** `apps/design-system/tsconfig.json`, `.storybook/preview.tsx`, `.storybook/test-runner.ts`, current-API story fixtures, package scripts, and `scripts/check-design-system.mjs`. Stories now match production statuses and component APIs. The custom runner scans the complete body, including portals; the accessibility addon is manual. Automated story contrast exemptions have been removed. Functional examples use the shared button or explicitly opt into high contrast. The keyboard menu example uses Radix's supported non-modal mode with explicit high-contrast content; production menu defaults are unchanged.
2. **Behavior and accessibility:** shared Input/PasswordField, ChatInput, Button, LabeledSlider and its four consumers, trust badges, and native calendar tables. The new interaction stories belong with these changes. Keep the existing `Slider` export when reverting its new companion. Confirmed axe failures also required preserving visible button labels during loading in five authentication forms, darker province placeholder text, and an explicit high-contrast destructive confirmation button. Native calendar table geometry has a documented local design-lint exception because the Radix layout primitives have no table-layout/border-spacing props.
3. **Dialog consolidation:** shared `dialog.tsx`, web compatibility re-export, localized close labels and corresponding English/French messages, dialog interaction stories, and `apps/web/scripts/check-design-dialogs.mjs`. Controlled dialogs without a `DialogTrigger` now remember and restore their opener. Consumer autofocus handlers run first and retain `preventDefault()` control. Existing open state, callbacks, pending guards, and navigation remain in the consumers. The fixture runner includes actual RoleSwitchDialog, CustomerPreviewDialog, ApplyBlockedDialog, marketplace detail, and appearance components, replacing only their external data/navigation dependencies.
4. **Typography and governance:** web `platform-typography.css` and its single import, Storybook `preview.css` and licensed local Geist subsets, the UI bible/PLATFORM-UX corrections, `scripts/design-lint-baseline.json`, and `scripts/check-design-lint.mjs`. Typography can be reverted by removing that web import and restoring the Storybook stylesheet. Marketing's Inter Tight/Fraunces/other deliberate families and admin's system font and colors are preserved. Primary is grass; supported dialog sizes are 1–4.

For separate commits, stage individual hunks in the story/config files shared by these groups. No unrelated duplicate component cleanup is included. The new root verifier intentionally runs the completed chain and should land with all of its referenced scripts.

## Compatibility contracts

- `PasswordField` owns reveal state even when a caller supplies `type="password"`. The composite Input preserves value, ref, name, required validation, autocomplete, and submission.
- `ChatInput.onSend` remains `(message: string) => void | Promise<void>`. One in-flight operation is allowed; synchronous throws and rejected promises show optional localized `sendErrorMessage` and retain the draft. Draft revisions protect edits made during submission, including edits that return to the same text. Missing handlers preserve drafts. External sending/loading/disabled props retain their roles.
- Solid grass buttons default to high contrast after resolving explicit color before inherited theme color. Explicit `highContrast`, other colors/variants, loading, sizing, refs and `asChild` remain supported. No required Theme hook was introduced.
- `LabeledSlider` is exported through the existing slider entry point and UI root. `thumbLabels` is required and must contain one accessible name per value/thumb, in value order. Optional `getValueText(value, index)` formats localized units. Existing controlled/default values, min/max/step, keyboard/pointer input, and change-versus-commit callbacks are retained. Existing Slider remains exported unchanged.
- Native calendar tables retain the existing date buttons and date calculations. Tests cover Enter/Space, disabled ranges, month callbacks, and `onDateClick` precedence over `onToggleDate`.
- Dialog's optional `closeButtonLabel` defaults to “Close dialog”. Hidden titles and consumer event handlers remain supported. Private photo-crop internals are imported by their regression fixture without adding a public export.

## Baseline and verification

| Check | Before | Final evidence |
| --- | --- | --- |
| UI, web, admin type checks | Passed on Node 22 | Passed |
| Web/admin production builds | Passed on Node 22 | Passed |
| Original Storybook suite | 435 passed, 49 failed; 21 rendering exceptions | **503 passed, 0 failed** (all 484 original + 19 new); 139 suites |
| After story/API repair gate | All 484 rendered; 452 passed, 32 axe failures | Rule/story inventory saved alongside this report |
| Root design-system verifier | Previously absent | **Passed**: UI build, scoped story types, static Storybook build, lint baseline, 503 stories, 120 matrix cases, 10 consumer fixtures |
| Design lint | 1,436 warnings | 1,429 warnings; zero file/rule baseline increases |
| Primary solid text contrast | 3.03:1 in the original light example | 11.87:1 light; 14.79:1 dark, exceeding 4.5:1 |

Run `pnpm check:design-system` with Node 22. The runner starts and stops its own static Storybook server on an ephemeral port. Install the Playwright Chromium browser if it is not present (`pnpm --filter @welpco/design-system exec playwright install chromium`). `pnpm check:design-lint` and `pnpm check:design-consumers` are also available independently. Run web/admin `type-check` and `build` separately for the application build gates.

The original 32 post-render accessibility failures and their rules are recorded in `2026-09-05-design-system-remediation-a11y.json`. There are no remaining story-specific axe rule suppressions. The root verifier keeps axe's existing WCAG 2.1 A/AA scope; it is not a claim of a complete manual accessibility audit.

## Visual and application checks

- Light/dark matrix at 375, 768, and 1440 pixels includes buttons, input error/disabled states, open dialog/menu, French range labels, pointer changes/commits, authentication default/loading, calendars, search filters, trust badges, rating, failed chat, and French photo crop/default/pending states. Screenshots and JSON are written to ignored `apps/design-system/test-results/design-matrix/`.
- Compared 102 screenshots before/after the isolated typography change. Image dimensions were unchanged; representative mobile dialog, calendar, login, filter and failed-chat comparisons showed expected glyph/wrapping changes with no overflow. The matrix additionally validates pointer commits and photo-crop interactions. Current screenshot evidence is local, not a committed golden-image approval system.
- Actual web consumer fixtures run in English/French at 375 pixels with network dependencies replaced by local data. They verify role switching's pending dismissal guard and request count, customer hidden title/content, blocked-application navigation, marketplace review/proposal content and dismissal, appearance slider state, and focus return to controlled openers.
- Production-server smoke checks passed admin `/login`, web `/en/login`, `/fr/login`, and `/en/register`: password reveal retained entered values. Admin still computed the system font; web login computed Geist; marketing still computed Inter Tight. Local servers required temporary process-only auth secrets; no environment files or account data were changed.

## Remaining release prerequisites

**Authenticated integration parity is not established by these fixtures.** No Welpco BFF was available locally: the process already on port 3000 belonged to another project and returned 404 for `/api/health`; it was left alone. Verified backend-backed test sessions were unavailable.

Before release, run against the intended local BFF and existing test accounts: admin sign-in/account creation, customer and welper authentication/session transitions, live search filters/trust data, profile-photo upload persistence, appearance persistence, role-switch session/redirect, booking, and Stripe test-mode payment confirmation. Do not substitute the isolated fixture results for these checks or use production payments/accounts. A human should review the final screenshots before landing typography.

Known build messages about middleware migration and existing bundle sizing remain outside this remediation; no framework upgrade was attempted.
