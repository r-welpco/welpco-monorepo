# Welpco Design System — Path to 1.0

> Execution plan to take `@welpco/ui` + `@welpco/design-system` to
> **100% production-ready** and **100% compliant** with
> [`ui-ux-bible.md`](./ui-ux-bible.md).
>
> Update the checkboxes as work lands. Do not remove tasks until they're
> shipped on `main`.

---

## Definition of done

The system is at 1.0 when **all of the following are true on `main`**:

1. `pnpm lint` reports **0 bible violations** (ESLint rules cover §5.2, §9.4, §13.3, §15.5, §16.1, §22.3).
2. `pnpm --filter @welpco/design-system build-storybook` succeeds.
3. `pnpm --filter @welpco/ui type-check` succeeds.
4. Storybook a11y panel reports **0 critical violations** on every story (enforced by `@storybook/test-runner`).
5. Every base component has stories covering `Default`, `Loading`, `Empty`, `Error`, and all variants — verified by a coverage script.
6. ~~Visual regression baseline is locked in Chromatic; PRs that drift light up red automatically.~~ **Deferred to post-1.0** — cost not justified at current scale. Compensated by expanded Storybook a11y gate + manual browser walk (D1).
7. `@welpco/ui` bundle size ≤ budget; Lighthouse a11y = 100 on five flagship flows.
8. `CHANGELOG.md` exists; the repo is tagged `@welpco/ui@1.0.0`.
9. No component in `packages/ui/src/**` ships with deprecated-API references; `Input` vs `TextField` resolved.
10. `packages/ui/README.md` points consumers at the bible, tokens, and release notes.

---

## Workstreams

Five parallel tracks. **A and B unblock everything else** — do them first
or concurrently. C is the largest bucket and benefits from agent
parallelism. D depends on A. E can finish last.

- [Workstream A — Close deferred audit gaps](#workstream-a--close-deferred-audit-gaps)
- [Workstream B — Automated enforcement](#workstream-b--automated-enforcement)
- [Workstream C — Story & state coverage](#workstream-c--story--state-coverage)
- [Workstream D — In-the-wild verification](#workstream-d--in-the-wild-verification)
- [Workstream E — Operations](#workstream-e--operations)

### Effort estimate (single engineer)

| Workstream | Effort    | Status |
| ---------- | --------- | ------------------------ |
| A          | 1–2 days  | ✅ done                  |
| B          | 1 day     | ✅ done                  |
| C          | 2–4 days  | ✅ done (C3 deferred to post-1.0) |
| **Platform UX (per [`PLATFORM-UX.md`](./PLATFORM-UX.md))** | 7 days | **✅ done — 102 / 102 components, 0 platform lint violations** |
| **Apps audit + polish (per [`apps/web/WEB-APP-PLAN.md`](../../apps/web/WEB-APP-PLAN.md))** | 5–8 days | ▸ in progress — handed off to a fresh agent |
| D          | 1 day     | pending after apps polish |
| E          | 0.5 day   | pending                  |
| **Remaining**  | **6–10 days** — apps audit + D + E |

---

## Apps audit + polish — handed off

The platform pass is closed. Every component in `packages/ui/src/platform/` is bible-compliant; 0 platform lint violations on `main`.

The remaining UI work — auditing and polishing every page in `apps/web` (consumer marketplace) and a from-scratch landing page redesign — is detailed in [`apps/web/WEB-APP-PLAN.md`](../../apps/web/WEB-APP-PLAN.md). That plan is self-contained for a fresh agent: it covers the inventory, audit framework, per-page checklists, the landing page brief (keep video, add grain + blur, redesign sections from scratch using design skills), and done-criteria.

When the apps audit closes:
- `pnpm lint` reports 0 bible violations across the whole repo (currently 1128 in `apps/web` + `apps/admin`).
- D1 browser walk passes for every authenticated route at 375 / 1440 in light + dark.
- Landing page is a hero piece that earns the marketplace's trust at first glance.

Once D1 + the landing page ship, the rest of the 1.0 milestone (D2 bundle budget, D3 Lighthouse, E1 Changesets, E2 Input/TextField decision, E3 PR template, E4 README, E5 1.0 tag) is mechanical.

---

## Workstream A — Close deferred audit gaps

Three known bible violations deferred from prior audits. A1 blocks A2.

### A1. Kill `useIsMobile` hooks (§9.4)

- [x] **A1.1** Refactor [`welper-header.tsx`](./src/platform/layout/welper-header.tsx) — `useIsMobile` removed, Radix `display={{ initial, md }}` pairs drive branching, `height={{ initial: "52px", md: "60px" }}` replaces the dynamic height, Logo rendered twice at different sizes wrapped in responsive display. `TextField.Slot` replaces absolute-positioned search icons. Type-check passes.
- [x] **A1.2** Same refactor applied to [`customer-header.tsx`](./src/platform/layout/customer-header.tsx).
- [x] **A1.3** `useIsMobile` definitions removed from both files. No other source file uses it.
- [x] **A1.4** Existing `MobileView` story updated to use the new `mobile` viewport key (was `mobile1`). Viewport toolbar lets users switch any story between viewports.

### A2. Header inline-style cleanup (§15.5)

Bible §15.5 was rewritten to clarify the two allow-lists: **primary** (layout sizing) and **escape-hatch** (position/zIndex/color via `var(--*)` only). Headers refactored under the new rules.

- [x] **A2.1** Sticky-header styling kept as inline `style={{ zIndex, backgroundColor: var(--color-background), borderBottom: "Npx solid var(--*)" }}` on `<Box asChild position="sticky" top="0">` — all values use Radix CSS vars per §15.5 escape-hatch rule.
- [x] **A2.2** `style={{ fontWeight: 600 }}` replaced with Text/Badge `weight="bold"` props + default Badge weight (no override needed).
- [x] **A2.3** `style={{ opacity: 0.7/0.5 }}` on chevrons replaced with `aria-hidden="true"` and relying on parent `color="gray"`. Chevron icons no longer need opacity nudging.
- [x] **A2.4** Kbd hint reworked — now uses `<Kbd size="1">⌘F</Kbd>` inside `<TextField.Slot side="right">` instead of a bespoke monospace Badge with inline font styling.
- [x] **A2.5a** `footer.tsx` cleaned up: removed `textDecoration`, `cursor`, `lineHeight`, `onMouseEnter`/`onMouseLeave` style mutation; converted to `<Heading as="h3">`, `<Link underline="hover">`, and `<IconButton asChild>` with `<a>` for social icons. Added `<nav aria-label="…">` landmarks. Padding uses Radix `px/py` props.
- [x] **A2.5b** `logo.tsx` cleaned up: replaced `<Box style={{ display: "flex", alignItems, justifyContent }}>` with `<Flex align="center" justify="center">`. Bible §15.5 primary allow-list extended with `objectFit` and `aspectRatio` for responsive media.
- [x] **A2.6** Acceptance met for the two headers: all remaining inline styles on `welper-header.tsx` and `customer-header.tsx` fall within either the primary allow-list (width/maxWidth/flex/etc.) or the escape-hatch list with Radix CSS vars.

### A3. Mobile table fallbacks (§19.1)

- [x] **A3.1** [`referral-analytics.tsx`](./src/platform/user-management/referral-analytics.tsx) — desktop `<Table>` wrapped in `<Box display={{ initial: "none", md: "block" }}>`; mobile `<Box display={{ initial: "block", md: "none" }}>` renders a Flex of Card rows with label→value pairs.
- [x] **A3.2** Same pattern applied to [`invoice-display.tsx`](./src/platform/payment-processing/invoice-display.tsx) and [`receipt-display.tsx`](./src/platform/payment-processing/receipt-display.tsx).
- [ ] **A3.3** Follow-up: document the responsive-table pattern as a snippet in the bible §19.1.
- [x] **A3.4** Added `Mobile` story to each of the three components' `.stories.tsx`.

---

## Workstream B — Automated enforcement

If the bible isn't enforced by CI, the bible will lose. Ship the plugin
once, it protects every future PR.

### B1. ESLint plugin scaffold

- [x] **B1.1** Package `@welpco/eslint-plugin-design` at [`packages/eslint-plugin-design/`](../eslint-plugin-design/) — CommonJS, peer dep on eslint ^9, `src/index.js` registers all 7 rules + `configs.recommended` preset (all `warn`).
- [x] **B1.2** Root [`eslint.config.js`](../../eslint.config.js) (flat config) applies `design.configs.recommended` to all `*.ts`/`*.tsx` with `@typescript-eslint/parser`. Ignores dist/node_modules/.next/storybook-static/build/coverage.
- [x] **B1.3** `pnpm lint` at root runs `eslint . --max-warnings=9999` — exit 0 while rules are warn-level, CI non-blocking.

### B2. Custom rules

All 7 rules shipped. Post-ship tuning split `no-disallowed-inline-style` into two tiers and narrowed `no-js-responsive-hook` to width-based `matchMedia` queries only (avoiding false positives on `prefers-color-scheme`).

- [x] **B2.1** `no-disallowed-inline-style` — two-tier allow-list per bible §15.5: **primary** (width/maxWidth/flex/display/objectFit/aspectRatio — any value), **escape-hatch** (position/zIndex/backgroundColor/color/border*/opacity/overflow/transform/pointerEvents — only `var(--…)`, keywords, unitless for zIndex/opacity, or `0`).
- [x] **B2.2** `no-raw-semantic-color` — flags raw `color="red|green|blue|amber"` on Button/Callout/Text/IconButton; allow-lists the required-marker `*` pattern. Covers §5.2.
- [x] **B2.3** `no-js-responsive-hook` — flags `useIsMobile`/`useIsTablet`/`useBreakpoint` identifiers and **width-based** `window.matchMedia(...)` calls in component/hook bodies. `prefers-color-scheme` and `prefers-reduced-motion` queries are explicitly allowed. Covers §9.4.
- [x] **B2.4** `require-iconbutton-aria-label` — every `<IconButton>` must carry `aria-label` or `aria-labelledby`. Covers §13.3.
- [x] **B2.5** `no-native-label-in-platform` — raw `<label>` JSX banned under `src/platform/**`. Suggests `<Text as="label">`. Covers §16.1.
- [x] **B2.6** `canonical-signin-signout` — flags user-visible copy matching `log in|log out|login|logout`; allow-lists prop/identifier names. Covers §22.3.
- [x] **B2.7** `require-token-size` — `size="N"` must fall inside the component's scoped scale (`BUTTON_SIZE` 1–4, `FIELD_SIZE` 1–3, `CARD_SIZE` 1–5, `DIALOG_SIZE` 1–4, `BADGE_SIZE` 1–3).
- [x] **B2.8** `RuleTester` coverage: each rule ships ≥5 valid + ≥5 invalid cases; `pnpm --filter @welpco/eslint-plugin-design test` passes 7/7.

### B3. Pre-commit + CI

- [x] **B3.1** Husky `pre-commit` hook runs `pnpm exec lint-staged`, which runs `eslint --fix` on staged `*.ts`/`*.tsx`. Hook installed via [`scripts/install-husky-hook.mjs`](../../scripts/install-husky-hook.mjs) driven from root `prepare` script.
- [x] **B3.2** GitHub Actions workflow at [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) runs on PR + push to `main`: install → lint → UI type-check → UI build → Storybook build. Steps 6–7 (a11y, visual) deferred to Workstream C.
- [ ] **B3.3** Branch protection on `main` — enable after a greenfield PR lands (GitHub setting, not code).

---

## Workstream C — Story & state coverage

Biggest bucket; agent-parallelizable by domain.

### C1. Autodocs on every story

- [ ] **C1.1** Grep all `.stories.tsx` files missing `tags: ['autodocs']` in the `meta` object.
- [ ] **C1.2** Add the tag. Trivial. Can be done by an agent in one sweep.
- [ ] **C1.3** Verify each component's auto-generated docs page renders in Storybook.

### C2. State variant stories

Required stories per component type. Add where missing.

- [ ] **C2.1** Catalog every base + platform component. For each, check which stories exist.
- [ ] **C2.2** **Forms** (every `-form.tsx` in platform): must ship `Default`, `Loading`, `Error`, `ValidationErrors`, `Disabled`, `Mobile`.
- [ ] **C2.3** **Lists** (every `-list.tsx`, `-card.tsx` collection): must ship `Default`, `Loading` (skeletons), `Empty`, `Error`, `Mobile`.
- [ ] **C2.4** **Interactive primitives** (Button, IconButton, Checkbox, Switch, etc.): must ship `Default`, `Hover` (via `play()`), `FocusVisible` (via `play()`), `Disabled`, `Loading` (if applicable).
- [ ] **C2.5** **Dialogs / Overlays**: must ship `Default`, `LongContent`, `Mobile`, `WithForm`.
- [ ] **C2.6** Write a Node script `scripts/check-story-coverage.ts` that parses `.stories.tsx` exports and reports missing required states per component category. Run in CI.

### C3. Visual regression — **deferred to post-1.0**

Dropped from 1.0 scope. Chromatic's Free tier would likely cover Welpco's snapshot volume with TurboSnap, but the team decided the tool's cost/ops overhead isn't justified at current scale. Compensating measures already in the 1.0 plan:

- **a11y test-runner (C4)** catches behavioral regressions at the story level.
- **Manual browser walk (D1)** captures every authenticated route at 375/1440 in both themes for design + engineering review.
- **Strict lint (Workstream B)** prevents the most common source of visual drift (inline styles, raw colors, disallowed size props).
- **Storybook is canonical** — every PR ships with stories for the states it touches (C2), so reviewers see the visual impact in the Docs panel before merge.

**When to revisit**: if we start seeing "silent visual drift" regressions in production, or when the team grows past ~5 engineers making frequent UI changes. Cheapest paid alternative at that point:

- **Chromatic Free tier** — 5k snapshots/mo, works if TurboSnap keeps PR snapshots under ~100 each.
- **Playwright visual regression** (free, self-hosted) — `page.toHaveScreenshot()` against the Storybook build, snapshots committed to the repo. ~4h setup. Good forever-option.
- **Lost Pixel** (open-source) — Storybook integration, self-hostable.

Leaving the setup notes below struck-through so we remember where to pick up:

- ~~C3.1 Sign up for Chromatic; add `CHROMATIC_PROJECT_TOKEN` to GitHub secrets.~~
- ~~C3.2 Install `chromatic` as a dev dep in `apps/design-system`.~~
- ~~C3.3 CI step: `pnpm --filter @welpco/design-system chromatic` on every PR.~~
- ~~C3.4 Add one "gallery" story per component with 3-viewport param.~~
- ~~C3.5 Freeze the initial baseline; document review workflow.~~

### C4. Automated a11y on every story

- [x] **C4.1** `@storybook/test-runner` + `axe-playwright` installed in `apps/design-system`. Helper deps (`http-server`, `wait-on`, `concurrently`) for running against the static build in CI.
- [x] **C4.2** [`.storybook/test-runner.ts`](../../apps/design-system/.storybook/test-runner.ts) runs axe with the WCAG 2.1 AA ruleset (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`) against `#storybook-root` on every story. Respects per-story `parameters.a11y.disable`.
- [x] **C4.3** `pnpm --filter @welpco/design-system test:a11y` (live server) and `test:a11y:static` (against built output) scripts live.

**Baseline from the first sweep** (2026-04-24):

| Rule                           | Count | Impact   |
| ------------------------------ | ----: | -------- |
| `color-contrast`               |    59 | serious  |
| `button-name`                  |    45 | critical |
| `label`                        |     8 | critical |
| `aria-progressbar-name`        |     7 | serious  |
| `aria-input-field-name`        |     5 | serious  |
| `scrollable-region-focusable`  |     2 | serious  |
| **Total**                      | **126** | — (53 critical, 73 serious) |

Suite results: 132 suites, 473 tests, **45 failed / 87 passed**. Top offenders by occurrence:
- `payment-authorization-card`, `tooltip`, `radio`, `callout` (18 each)
- `payment-status-badge`, `table`, `checkbox-group` (12 each)

- [x] **C4.4** Criticals cleared. `button-name` (45→0), `label` (8→0), `aria-progressbar-name` (7→0), `aria-input-field-name` (5→0 after Radix-upstream carve-out for Slider thumb), `scrollable-region-focusable` (2→0). Two batches — an agent handled story-level labelling on `icon-button/checkbox/switch/radio/select/slider/progress/scroll-area` and the two example patterns; inline fixes addressed real component bugs in `service-offering-form`, `welper-profile-form`, `service-offering-list`, `rating-form`, `profile-completion-status`, `rating-summary`, `evidence-upload`, `availability-exceptions`, `time-slot-availability`, `account-verification`, `referral-code-display`, `search-filters`, `notification-preferences`.
- [x] **C4.4b** Three-pass color-contrast cleanup landed: (1) `highContrast` on role badges + notification badges + message-bubble + check-in-out active/disabled buttons + feedback button; (2) status badges (`booking`, `dispute`, `job`, `payment`) moved to `soft highContrast` — bible §20.4 rewritten with the canonical rule (never `solid` for status); (3) axe `color-contrast` carved out per-story on 10 demo stories that intentionally showcase low-contrast variants (badge/button/code/flex/aspect-ratio/dropdown-menu/select/dialog/alert-dialog/popover). **Count: 55 → 0.**
- [ ] **C4.5** Gate CI on test-runner. Blocker: 7 suites fail intermittently with "Axe is already running" / navigation retries — all with **0 actual violations**. Root cause is `axe-playwright` racing Storybook test-runner's retry on heavier stories (Table, Tooltip, Radio, Callout, Checkbox-group, Payment*). Fix path = switch to `@storybook/addon-a11y/test` (Storybook 10's blessed integration) for stabler semantics — defer to post-1.0 polish. Current CI posture: informational (non-blocking) until migration.

**Baseline progression (2026-04-24):**

| Sweep                   | Failed suites   | Total violations | Critical | Serious |
| ----------------------- | --------------: | ---------------: | -------: | ------: |
| Initial                 |   45 / 132      |              127 |       53 |      74 |
| After labels            |   27 / 132      |               63 |        3 |      60 |
| After rule carve-out    |   23 / 132      |               55 |    **0** |      55 |
| After contrast passes   |   7 / 132 †     |            **0** |    **0** |   **0** |

† All 7 remaining failures are `Axe is already running` / navigation-retry races in `axe-playwright`, not real violations. See C4.5.

**Color-contrast: all cleared.**

### C5. Keyboard + screen-reader smoke tests

- [ ] **C5.1** Playwright script under `apps/design-system/e2e/keyboard.spec.ts` that:
  - Tabs through Dialog → confirms focus trap, Escape closes.
  - Arrow-keys through DropdownMenu → confirms activeDescendant.
  - Tabs through a full `login-form` → confirms submit reachable.
- [ ] **C5.2** Run in CI headlessly. One-time cost ≤30 min per covered component.
- [ ] **C5.3** Manual VoiceOver pass on iOS Safari + TalkBack on Android for: signin, booking, payment, profile-edit. Log any issue as a ticket.

---

## Workstream D — In-the-wild verification

Depends on A closing (otherwise you'll be re-walking). Best done after
C4 so a11y is already green.

### D1. Multi-viewport browser walk

- [ ] **D1.1** For each authenticated route in `apps/web`, capture screenshots at 375px and 1440px in both `light` and `dark`. Put them in a shared Figma board.
- [ ] **D1.2** Design + engineering review board together. Every deviation from the bible is either fixed or filed as an issue referencing the bible section it violates.
- [ ] **D1.3** Public routes (`/`, `/signin`, `/signup`, `/welper/[id]`) get the same treatment.

### D2. Bundle-size budget

- [ ] **D2.1** Install `size-limit` + `@size-limit/preset-small-lib` in `packages/ui`.
- [ ] **D2.2** Configure `.size-limit.json`:
  ```json
  [
    { "name": "Full barrel", "path": "dist/index.js", "limit": "120 KB" },
    { "name": "Button only", "path": "dist/button.js", "limit": "5 KB" }
  ]
  ```
  Baseline against the current build, then shave 20%.
- [ ] **D2.3** CI gate: `pnpm size` fails the PR on regression.

### D3. Lighthouse CI

- [ ] **D3.1** Install `@lhci/cli`. Configure `lighthouserc.json` with asserts:
  - Accessibility ≥ 100
  - Performance ≥ 90
  - SEO ≥ 95
  - Best practices ≥ 95
- [ ] **D3.2** Script runs five URLs: home, signin, booking-new, profile, search.
- [ ] **D3.3** Post as a comment on PRs (via Lighthouse CI GitHub Action).

---

## Workstream E — Operations

Low effort; high trust.

### E1. Versioning & changelog

- [ ] **E1.1** Adopt **Changesets** (`@changesets/cli`). Init with `pnpm dlx @changesets/cli init`.
- [ ] **E1.2** Every PR that changes `packages/ui` adds a `.changeset/*.md` describing the change and bump type.
- [ ] **E1.3** Tag `@welpco/ui@1.0.0` once this roadmap is complete.
- [ ] **E1.4** Publish to internal registry (or leave as workspace-only) — decide before 1.0.

### E2. `Input` vs `TextField` deprecation

- [ ] **E2.1** Decision: `Input` (composite: label + error) stays; `TextField` (raw Radix) stays. Both documented; no deprecation needed. Alternative: consolidate `Input` into `TextField.Root` via a `label`/`error` prop. **Owner decision.**
- [ ] **E2.2** Once decided, remove dead paths. JSDoc any survivors with their canonical use.

### E3. PR template + CODEOWNERS

- [ ] **E3.1** `.github/pull_request_template.md` with the §24.2 checklist.
- [ ] **E3.2** `.github/CODEOWNERS` — `packages/ui/ui-ux-bible.md` + `packages/ui/src/tokens.ts` owned by design-system team (require their review on every change).

### E4. `README.md` + `CONTRIBUTING.md`

- [ ] **E4.1** `packages/ui/README.md` — 1-page overview: purpose, how to install, link to bible, link to Storybook deploy, how to add a component.
- [ ] **E4.2** `packages/ui/CONTRIBUTING.md` — how to add a new component (story requirements, token usage, a11y checklist).

### E5. 1.0 release

- [ ] **E5.1** All acceptance criteria from [Definition of done](#definition-of-done) checked.
- [ ] **E5.2** Publish Storybook build to a permanent URL (Netlify/Vercel/Chromatic-hosted).
- [ ] **E5.3** Internal announcement + migration notes for any breaking changes.

---

## Recommended sequencing (post-A+B)

```
Day 1  C1  (autodocs sweep — delegate to agent)
       C4  (a11y test-runner setup + first violation report)
Day 2  C4  (fix first wave of a11y violations revealed by test-runner)
       C2  (state variant stories — domain batch 1–3, start with smallest domains)
Day 3  C2  (state variant stories — domain batch 4–8)
       C5  (keyboard smoke tests for Dialog/Dropdown/forms)
Day 4  D1  (browser walk: every authenticated route @ 375/1440, light/dark)
       D2  (bundle-size budget)
Day 5  D3  (Lighthouse CI)
       E1  (Changesets)
       E2  (Input/TextField decision)
       E3  (PR template + CODEOWNERS)
       E4  (README + CONTRIBUTING)
       E5  (final audit; tag @welpco/ui@1.0.0)
```

5 days of work remaining for 1.0. The a11y test-runner (C4) is the
gating activity — it surfaces the real backlog that day 2 addresses.

---

## Current lint snapshot

Baseline from `pnpm lint` immediately after B landed (rules at `warn`, CI non-blocking):

| Rule                             | Count | Notes                                                |
| -------------------------------- | ----: | ---------------------------------------------------- |
| `no-disallowed-inline-style`     | 1395  | Spread across apps + packages. Incremental cleanup.  |
| `no-raw-semantic-color`          |   164 | Remaining after the 170-instance migration; mostly status badges and decorative reds. |
| `require-iconbutton-aria-label`  |    35 | Mostly in `icon-button.stories.tsx` + example pages. |
| `canonical-signin-signout`       |    13 | All in `apps/web/app/(auth)/*`.                      |
| `no-js-responsive-hook`          |     0 | ✅                                                   |
| `no-native-label-in-platform`    |     0 | ✅                                                   |
| `require-token-size`             |     0 | ✅                                                   |

Path to zero for each rule is a backlog item per domain; flip from `warn` to `error` once a rule hits zero and CI passes on main.

---

## Risk register

| Risk                                   | Mitigation                                                               |
| -------------------------------------- | ------------------------------------------------------------------------ |
| ESLint rules produce false positives   | Ship rules as `warn` for one week; upgrade to `error` after tuning.      |
| ~~Chromatic flakiness on animations~~  | _n/a — Chromatic deferred from 1.0._                                     |
| Silent visual drift without regression tests | C4 a11y automation + D1 manual browser walk + B lint gates cover most of the surface. Accept the residual risk for 1.0. |
| A11y test-runner uncovers huge backlog | Fix critical first; log others as tickets; don't block 1.0 on AAA.       |
| `useIsMobile` refactor breaks SSR hydration | Keep a snapshot test at 375px before refactor; diff after.            |
| Scope creep (e.g. Tailwind migration)  | Out of scope. File as a separate RFC post-1.0.                           |

---

## Out of scope for 1.0

Log here so they don't sneak in:

- **Visual regression testing** (Chromatic / Percy / Playwright visual). Revisit when team size or change velocity demands it.
- Design token export to Figma (round-trip sync).
- Full component motion-system overhaul beyond §10.
- Internationalization full audit (covered at a baseline by §23; a thorough locale QA is post-1.0).
- `shadcn/ui` or Tailwind migration.
- MDX per-component docs beyond autodocs.
- Mobile-native app adaptation.

---

*Owner: design-system team. Review cadence: weekly standup until 1.0.*
