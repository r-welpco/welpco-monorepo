# Welpco UI/UX Bible

> **Single source of truth** for design and engineering at Welpco.
> Every component, every screen, every word of copy answers to this doc.
> Typed tokens live in [`src/tokens.ts`](./src/tokens.ts) — code references tokens, never literals.

---

## Table of contents

1. [Product context](#1-product-context)
2. [Design principles](#2-design-principles)
3. [Brand expression](#3-brand-expression)
4. [Design tokens](#4-design-tokens)
5. [Color](#5-color)
6. [Typography](#6-typography)
7. [Spacing & rhythm](#7-spacing--rhythm)
8. [Layout](#8-layout)
9. [Responsive design](#9-responsive-design)
10. [Motion](#10-motion)
11. [Elevation & depth](#11-elevation--depth)
12. [Radius & borders](#12-radius--borders)
13. [Iconography](#13-iconography)
14. [Imagery](#14-imagery)
15. [Component principles](#15-component-principles)
16. [Forms & input](#16-forms--input)
17. [Feedback & messaging](#17-feedback--messaging)
18. [Navigation patterns](#18-navigation-patterns)
19. [Data display](#19-data-display)
20. [Trust & safety patterns](#20-trust--safety-patterns)
21. [Accessibility](#21-accessibility)
22. [Voice & microcopy](#22-voice--microcopy)
23. [Internationalization](#23-internationalization)
24. [Enforcement](#24-enforcement)
25. [Patterns & anti-patterns](#25-patterns--anti-patterns)

---

## 1. Product context

Welpco is a **two-sided service marketplace** that connects two distinct audiences:

- **Customers** — people booking help (cleaning, care, assistance, errands). They want confidence, clarity, and speed. Most visits are short — discover, decide, book.
- **Welpers** — service providers running their work through Welpco. They want control, information density, and efficient throughput. They return every day.

The design system serves both audiences from one kit. Differences surface through **tone, density, and navigation** — never through divergent components. A Button is a Button; a Welper's dashboard just uses the dense sizes.

### Trust is the product

Every decision — how we show a price, a review, a booking status, a dispute — either earns or spends trust. When in doubt, choose the more transparent, more reversible, more accessible path.

---

## 2. Design principles

These are the **five rules** we return to when we disagree.

### 2.1 Clarity before cleverness

A user should never wonder *"what is this?"* or *"what will happen if I click?"*. Descriptive labels beat icon-only buttons. Plain language beats jargon. Visible state beats hidden state.

> If a new user can't name the screen they're on within three seconds, the screen has failed.

### 2.2 One way to do each thing

Reinvention is a tax on the entire product. If a pattern exists, use it. If it doesn't fit, fix the pattern — don't fork it. Every fork doubles maintenance and halves confidence.

### 2.3 Accessible by default, not by retrofit

Touch targets, contrast, focus rings, semantic roles, keyboard paths — these are **defaults**, not add-ons. WCAG 2.1 AA is the floor, not the ceiling. If a design can't be built accessibly, it's the wrong design.

### 2.4 Mobile is the primary canvas

Over half of our bookings happen on phones. Design for 360×640 first; scale up. A layout that breaks on mobile is broken — not "responsive later."

### 2.5 Show the work

Loading states, optimistic updates, validation feedback, undo — the system tells the user what it's doing. Silence is a bug. Spinners are a last resort; prefer skeletons, inline progress, or optimistic UI.

---

## 3. Brand expression

### 3.1 Logomark

`<Logo>` is the single entry point. Never re-crop, recolor, or re-proportion the mark. For dense UI (headers, favicons), use the isotype variant.

### 3.2 Voice fingerprint

Welpco sounds **warm, direct, competent**. We don't perform. We don't apologize reflexively. We say what's true, clearly, in few words. More on this in [§22 Voice & microcopy](#22-voice--microcopy).

### 3.3 Color feel

The brand accent is **`grass`** (Radix). Sage-leaning, warmer than `green`, less minty — signals **service, trust, and momentum** without reading clinical or corporate. Use it for the primary CTA on any screen, for "go" affordances, and as the warm mark anywhere the brand needs to assert itself. Never use the accent for danger or warning — semantic discipline outranks brand whimsy.

`SEMANTIC_COLOR.primary` resolves to `"grass"` and is the single source of truth — never hand-write `"grass"` or `"green"` strings in product code. Both the marketing surface (`app/(marketing)/`) and the platform (`(auth)`, `(dashboard)`) are pinned to `accentColor="grass"` at the Radix `<Theme>` level so the brand reads consistently end-to-end.

`SEMANTIC_COLOR.success` stays on Radix `green` — that's a *meaning* token (booking paid, form saved), distinct from the brand mark.

History: this was originally `green`. Reconciled to `grass` on 2026-04-25 after the marketing redesign demanded a warmer register that `green` couldn't carry; the platform followed so the two surfaces don't split-brand. See `apps/web/AUDIT-LOG.md` Day 6 — Direction D for the full thread.

---

## 4. Design tokens

Tokens are the contract between design and engineering. **All values are tokens.** There are no magic numbers in product code.

We use Radix UI Themes as our token provider. Our typed re-exports live in [`src/tokens.ts`](./src/tokens.ts):

```ts
import {
  RADIX_SIZE, BUTTON_SIZE, FIELD_SIZE, CARD_SIZE, DIALOG_SIZE,
  BUTTON_VARIANTS, BADGE_VARIANTS, FIELD_VARIANTS,
  ACCENT_COLORS, SEMANTIC_COLOR,
  FORM_SPACING, BREAKPOINTS, RADIUS, TEXT_WEIGHT,
  type RadixSize, type SemanticColor,
} from "@welpco/ui/tokens";
```

### Token categories

| Category          | Token name        | Example values                              |
| ----------------- | ----------------- | ------------------------------------------- |
| Spacing           | `RADIX_SIZE`      | `"1"`–`"9"` (4px–64px)                      |
| Component size    | `BUTTON_SIZE`, `FIELD_SIZE`, `CARD_SIZE`, `DIALOG_SIZE`, `BADGE_SIZE` | scoped subsets of the Radix scale |
| Variant           | `BUTTON_VARIANTS`, `BADGE_VARIANTS`, `FIELD_VARIANTS`, `CALLOUT_VARIANTS` | e.g. `solid`, `soft`, `outline`, `ghost` |
| Color             | `ACCENT_COLORS`, `SEMANTIC_COLOR` | 26 Radix accents + 6 semantic roles |
| Radius            | `RADIUS`          | `none`, `small`, `medium`, `large`, `full`  |
| Weight            | `TEXT_WEIGHT`     | `light`, `regular`, `medium`, `bold`        |
| Breakpoint        | `BREAKPOINTS`     | `initial`, `xs`, `sm`, `md`, `lg`, `xl`     |
| Form spacing      | `FORM_SPACING`    | `labelGap`, `fieldGap`, `helperGap`, `submitGap`, `sectionGap`, `titleGap` |

### Naming rule

Tokens are **semantic first, primitive second**. Prefer `SEMANTIC_COLOR.danger` over `"red"`; prefer `FORM_SPACING.fieldGap` over `"3"`. Semantic tokens give us headroom to rebrand without touching product code.

---

## 5. Color

### 5.1 Palette structure

Three layers:

1. **Primitive** — Radix's 26 accent families (gray, green, red, amber, blue, …). Each family has 12 steps (1 = subtle background, 9 = solid accent, 12 = highest contrast text). We never inline hex values; we use Radix CSS variables (`var(--green-9)`).
2. **Semantic** — roles mapped to primitives:

   | Role       | Accent   | Use case                                           |
   | ---------- | -------- | -------------------------------------------------- |
   | `primary`  | `green`  | Default CTAs, links, selected state                |
   | `neutral`  | `gray`   | Secondary text, borders, quiet surfaces            |
   | `info`     | `blue`   | Informational callouts, non-destructive highlights |
   | `success`  | `green`  | Completion, confirmation, positive progress        |
   | `warning`  | `amber`  | Reversible hazards, attention-required, pending    |
   | `danger`   | `red`    | Destructive actions, errors, validation failures   |

3. **Component** — how a component colors itself given a semantic role (e.g. Button `solid`, Badge `soft`, Callout `surface`).

### 5.2 Never use raw primitives for meaning

```tsx
// ❌ Wrong — "red" could mean anything
<Button color="red">Delete</Button>

// ✅ Correct — intent is named
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
<Button color={SEMANTIC_COLOR.danger}>Delete</Button>
```

Raw primitives are allowed only for decorative art (illustrations, status icons with no semantic weight, marketing surfaces).

### 5.3 Contrast

Every text/background pair must pass WCAG 2.1 AA:

- **Body text (≤18px normal / ≤14px bold)**: ≥ 4.5:1
- **Large text (≥24px normal / ≥18.66px bold)**: ≥ 3:1
- **Icons and non-text UI**: ≥ 3:1

Radix's step system encodes this — use steps 11–12 for text on steps 1–3 backgrounds, and step 12 on step 9 for inverted text. Don't mix arbitrary steps; if it looks wrong, the combination is wrong.

### 5.4 Dark mode

Dark mode is not "inverted light mode." Radix handles the dark variants automatically when `<Theme appearance="dark">` is set. **Never** hard-code colors that break dark mode:

```tsx
// ❌ Breaks in dark mode
<Box style={{ backgroundColor: "#ffffff" }}>

// ✅ Adapts
<Box style={{ backgroundColor: "var(--color-panel)" }}>
// Or better:
<Card>
```

Test every new surface in both appearances before shipping.

### 5.5 Color-blind safety

**Color is never the only signal.** Success/error states also use an icon, a label, or a position change. A form field's error state combines color (red border) + icon + text — so a deuteranopic user still sees the problem.

---

## 6. Typography

### 6.1 Font stack

- **Primary**: Geist (sans) — loaded globally.
- **Monospace**: `ui-monospace, SFMono-Regular, Menlo, Consolas` — used only for code and keyboard hints.

Do not import other families. Add new weights via `@font-face` once, centrally, never per component.

### 6.2 Scale

| Token       | Radix `size` | Approx | Line height | Use case                       |
| ----------- | ------------ | ------ | ----------- | ------------------------------ |
| Display     | 9            | 60px   | 1.0         | Marketing hero only            |
| Display-sm  | 8            | 48px   | 1.05        | Landing headlines              |
| Heading-xl  | 7            | 32px   | 1.1         | Page titles                    |
| Heading-lg  | 6            | 24px   | 1.2         | Section titles, form titles    |
| Heading-md  | 5            | 20px   | 1.3         | Card titles, dialog titles     |
| Heading-sm  | 4            | 18px   | 1.35        | Sub-section titles             |
| Body-lg     | 3            | 16px   | 1.5         | Long-form reading              |
| Body-md     | 2            | 14px   | 1.5         | **Default body text**          |
| Body-sm     | 1            | 12px   | 1.5         | Helper text, captions          |

### 6.3 Weight

| Token     | Use                                                     |
| --------- | ------------------------------------------------------- |
| `regular` | Body prose                                              |
| `medium`  | Labels, emphasis within prose, nav items                |
| `bold`    | Headings, strong emphasis                               |
| `light`   | Reserved for large display type only                    |

### 6.4 Hierarchy rules

- **One h1 per page.** Form a legal DOM outline (`h1 > h2 > h3`). Never skip levels for visual weight — adjust `size` instead.
- **Line length**: aim for 60–75 characters per line in body prose. Use `max-width: 65ch` for long text blocks.
- **Measure over scale**: a heading at `size="6"` with narrow measure beats `size="8"` crammed into a phone.
- **Line height**: Radix defaults are correct. Don't override `lineHeight` inline. Never.

### 6.5 Casing and punctuation

- **Sentence case** everywhere (buttons, headings, labels) — "Create account", not "Create Account" or "CREATE ACCOUNT".
- **No trailing periods** on buttons, labels, or single-sentence hints. Use periods only in multi-sentence text.
- **Use curly quotes** in prose (`'` `'` `"` `"`), straight in code.
- **Numerals**: tabular numbers in tables and stats (`font-variant-numeric: tabular-nums`); proportional everywhere else.

---

## 7. Spacing & rhythm

### 7.1 4pt grid

All spacing derives from a **4px base unit**. Radix's scale maps to:

| Token | px  |
| ----- | --- |
| `1`   | 4   |
| `2`   | 8   |
| `3`   | 12  |
| `4`   | 16  |
| `5`   | 24  |
| `6`   | 32  |
| `7`   | 40  |
| `8`   | 48  |
| `9`   | 64  |

Never emit pixel values. `mt={4}` is wrong (a number literal); `mt="4"` is right (a token).

### 7.2 Rhythm patterns

| Context                            | Token                        | Rationale                     |
| ---------------------------------- | ---------------------------- | ----------------------------- |
| Between label and input            | `FORM_SPACING.labelGap` (1)  | Tight visual pairing          |
| Between adjacent form fields       | `FORM_SPACING.fieldGap` (3)  | Clear but economical          |
| Between field and helper/error     | `FORM_SPACING.helperGap` (2) | Attached but distinct         |
| Between form and submit button     | `FORM_SPACING.submitGap` (4) | Separates commit from inputs  |
| Between form sections              | `FORM_SPACING.sectionGap` (6)| Grouping with breathing room  |
| Between form title and fields      | `FORM_SPACING.titleGap` (2)  | Heading attached to its form  |
| Between cards in a list            | `4`–`5`                      | Density vs. scan-ability      |
| Between page sections              | `6`–`8`                      | Strong visual separation      |

### 7.3 Padding vs. margin

- **Padding** belongs inside a component (Card, Button, Dialog). The component owns its internal air.
- **Margin** belongs between components (stack of fields, list of cards). The layout owns the rhythm.
- Prefer `gap` on Flex/Grid over margins between siblings — gaps are resilient to reordering.

---

## 8. Layout

### 8.1 Primitives

- `<Container>` — page-width constraint (max width by `size`).
- `<Section>` — vertical rhythm between page sections.
- `<Flex>` / `<Grid>` — the two layout engines. Everything else is composition.
- `<Box>` — a neutral styled wrapper. Default to primitives above when possible.

### 8.2 Page structure

Every authenticated page follows the same frame:

```
┌──────────────────────────────────────────┐
│  Header (sticky)                         │
├──────────────────────────────────────────┤
│  Container (max-width by size)           │
│  ┌────────────────────────────────────┐  │
│  │  Section: Page title + actions     │  │
│  │  Section: Main content             │  │
│  └────────────────────────────────────┘  │
├──────────────────────────────────────────┤
│  Footer                                  │
└──────────────────────────────────────────┘
```

- `<Container size="3">` for dense/admin content; `size="4"` for dashboards; `size="2"` for single-column forms.
- Gutters: `px={{ initial: "4", sm: "6" }}` — 16px mobile, 24px tablet+.

### 8.3 Grid strategy

Use `<Grid>` for any 2D layout. Column counts are always responsive:

```tsx
// Lists of cards
<Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap={{ initial: "3", md: "4" }}>

// Dashboards
<Grid columns={{ initial: "1", md: "12" }} gap="4">
  <Box gridColumn={{ md: "span 8" }}>Main</Box>
  <Box gridColumn={{ md: "span 4" }}>Aside</Box>
</Grid>
```

### 8.4 Aspect ratios

Media uses `<AspectRatio>` to prevent layout shift. Standard ratios: `16/9` for video, `4/3` for product photos, `1/1` for avatars/logos, `3/4` for profile hero cards.

---

## 9. Responsive design

### 9.1 Mobile-first means mobile-first

Design the 360px layout first. Enhance at each breakpoint. Never design desktop and "squish" down.

### 9.2 Breakpoints

From `BREAKPOINTS` in `tokens.ts`:

| Token     | Min width | Target                    |
| --------- | --------- | ------------------------- |
| `initial` | 0         | Phones                    |
| `xs`      | 520px     | Large phones / small tabs |
| `sm`      | 768px     | Tablets portrait          |
| `md`      | 1024px    | Tablets landscape / small laptops |
| `lg`      | 1280px    | Desktop                   |
| `xl`      | 1640px    | Wide desktop              |

### 9.3 Use Radix responsive prop objects

```tsx
<Box p={{ initial: "3", md: "5", lg: "6" }}>
<Grid columns={{ initial: "1", sm: "2", lg: "3" }}>
<Heading size={{ initial: "5", md: "7" }}>
<Button size={{ initial: "3", md: "2" }}>Continue</Button>
```

**Do not** write custom media queries in component code. If Radix's responsive prop can express it, use that. CSS should be the last resort.

### 9.4 Banned: JS-driven responsive logic

No `useIsMobile` hooks. No `window.matchMedia` in rendering paths. They hydrate inconsistently, harm SSR, and bloat bundles. Use CSS-driven responsive props instead. If a component genuinely needs different DOM at different sizes, render both with `display={{ initial: "block", md: "none" }}` / `display={{ initial: "none", md: "block" }}`.

### 9.5 Touch targets

Minimum hit area **44×44 CSS pixels** on any touch-capable viewport. Radix `size="3"` buttons meet this; `size="1"`–`"2"` do not and must not appear on mobile as primary actions. Use responsive sizing:

```tsx
<Button size={{ initial: "3", md: "2" }}>
<IconButton size={{ initial: "3", md: "2" }} aria-label="…">
```

### 9.6 Horizontal scroll

Horizontal scroll is acceptable only for: chat, tab strips with too many tabs, data tables. It must show its scrollability (fade edge, visible scrollbar on hover) and never trap vertical scroll.

---

## 10. Motion

Motion reinforces cause and effect. It **never** decorates.

### 10.1 Duration

| Class    | Duration  | Use                                                       |
| -------- | --------- | --------------------------------------------------------- |
| Instant  | 0ms       | State toggles that don't need animation                   |
| Fast     | 120ms     | Hovers, focus transitions, toggles                        |
| Standard | 200ms     | Enter/exit of small overlays (tooltip, dropdown)          |
| Slow     | 320ms     | Dialog/sheet enter/exit, page transitions                 |

**Never exceed 400ms.** Beyond that, users perceive lag.

### 10.2 Easing

- **Ease-out** (`cubic-bezier(0.16, 1, 0.3, 1)`) for entering elements — fast start, soft settle.
- **Ease-in** (`cubic-bezier(0.7, 0, 0.84, 0)`) for exiting — gentle start, quick clear.
- **Spring** (Radix default) for draggable/pushable controls (switches, sliders).

### 10.3 Prefers-reduced-motion

Every animation respects `prefers-reduced-motion: reduce`. Radix primitives already do. Custom animations must wrap with:

```css
@media (prefers-reduced-motion: no-preference) {
  /* animation rules */
}
```

Never animate `position`, `width`, or `height` directly — use `transform` and `opacity`.

### 10.4 What to animate

- **Yes**: opacity, transform (translate, scale), background-color for state.
- **No**: layout-affecting properties, blur filters on large surfaces, anything that runs continuously.

---

## 11. Elevation & depth

We have **five elevation levels**. They are non-negotiable.

| Level | Name      | Use                                                |
| ----- | --------- | -------------------------------------------------- |
| 0     | Base      | Page background, inline content                    |
| 1     | Raised    | Card default (very subtle shadow)                  |
| 2     | Overlay   | Dropdowns, tooltips, popovers                      |
| 3     | Dialog    | Modal dialogs, sheets                              |
| 4     | Spotlight | Full-screen overlays, command palettes             |

Radix surfaces already express these through their `variant` prop and internal CSS variables. Don't hand-author box-shadows.

### 11.1 Layering rules

- A higher elevation **always** has a slightly different background than the one below it (so the boundary is visible without relying on shadow alone).
- Never stack more than one overlay at a time. A dropdown inside a dialog is fine; a dialog inside a dialog is not.
- Z-index is managed by Radix — never hard-code `zIndex`.

---

## 12. Radius & borders

### 12.1 Radius scale

| Token    | Approx | Use                                    |
| -------- | ------ | -------------------------------------- |
| `none`   | 0      | Dividers, full-bleed sections          |
| `small`  | 4px    | Inline chips, tiny badges              |
| `medium` | 8px    | Inputs, buttons, small cards (default) |
| `large`  | 12px   | Cards, dialogs, sheets                 |
| `full`   | 9999px | Pills, avatars, circular buttons       |

Within a single composition, **keep radius consistent**. A medium-radius input inside a large-radius card is fine (small nested in larger). A large button inside a small card is not.

### 12.2 Borders

- Weight: always **1px**. Never 2px for decoration. 2px is reserved for focus rings and the active state of selectable tiles.
- Color: Radix's step 6 on neutral surfaces for default borders, step 7 for emphasis, step 8 for hover.
- Dashed borders: only for drop-zones and placeholder areas.

---

## 13. Iconography

### 13.1 Sources

Two libraries, used consistently:

- **`@radix-ui/react-icons`** — for in-component UI (chevrons, close, check, etc.). 15×15 at 1px stroke by default.
- **`lucide-react`** — for semantic content icons (Bell, User, Calendar, MapPin). 16–24px at 2px stroke.

Do not mix icon styles within the same composition. Pick one per component.

### 13.2 Size

| Use                              | Size |
| -------------------------------- | ---- |
| Inline with body text            | 14px |
| Inline with labels/form controls | 16px |
| Icon-only button (`size="2"`)    | 16px |
| Icon-only button (`size="3"`)    | 20px |
| Feature/hero icon                | 24px or 32px |

### 13.3 Accessibility

- **Icon with text label** → `aria-hidden="true"` on the icon.
- **Icon-only button** → `aria-label` required.
- **Decorative icon** → `aria-hidden="true"`.

```tsx
// ✅
<IconButton aria-label="Close dialog">
  <Cross2Icon aria-hidden />
</IconButton>

// ❌
<IconButton><Cross2Icon /></IconButton>
```

### 13.4 Optical alignment

Icons sit optically, not geometrically. Use `<Flex align="center">` or Radix Button's internal slotting. Never pad icons with margin to nudge them — if they're misaligned, the container is wrong.

---

## 14. Imagery

### 14.1 Photography style

- Real service moments over stock. Show the work, not the marketing.
- Natural light, minimal saturation.
- **Diverse casting** — our customers and welpers are diverse; imagery reflects that.

### 14.2 Technical

- Responsive `<img srcset>` or Next.js `<Image>`.
- `alt` is **never** blank for content images. Decorative images use `alt=""` with `role="presentation"`.
- Preferred format: AVIF, then WebP, then JPEG.
- Lazy-load below-fold; eager-load LCP candidates.

### 14.3 Placeholders

Use `<Skeleton>` for pending states. Use solid low-saturation block color for missing images, never "broken image" icons.

---

## 15. Component principles

### 15.1 Composition over configuration

A component with 20 boolean props is a mistake. Expose slots instead.

```tsx
// ❌ Rigid
<Card showTitle showDescription showFooter footerButtons={[...]} />

// ✅ Flexible
<Card title="…" description="…">
  <Children />
  <Card.Footer>
    <Button>…</Button>
  </Card.Footer>
</Card>
```

### 15.2 Required states

Every interactive component ships with all of these:

| State          | Required? | Notes                                                    |
| -------------- | --------- | -------------------------------------------------------- |
| Default        | Always    |                                                          |
| Hover          | Always    | Pointer feedback (never on touch-only)                   |
| Focus-visible  | Always    | Keyboard feedback — **never** suppressed                 |
| Active         | Usually   | Press feedback                                           |
| Disabled       | When applicable | Non-interactive, 50–60% opacity, `aria-disabled="true"` |
| Loading        | When applicable | In-button spinner + disabled                             |
| Error          | When applicable | Red border + error text + `aria-invalid`                 |
| Selected       | When applicable | Primary color surface or accent border                   |
| Read-only      | When applicable | Distinct from disabled — value visible, not editable     |

### 15.3 Variants are opinions

A variant is a strong, meaningful choice. If a variant is named "default2", it doesn't deserve to exist. Prefer 3–5 variants per component; more creates decision fatigue.

### 15.4 Default to the smallest useful surface

Components start minimal and grow. Do not preemptively add "just in case" props — they become fossils.

### 15.5 No inline styles except layout escape hatches

**Primary allow-list** (use freely):

- `maxWidth`, `width`, `minWidth`, `height`, `minHeight`, `maxHeight`
- `flex`, `flexDirection`, `flexBasis`, `flexGrow`, `flexShrink`
- `display`
- `objectFit`, `aspectRatio` (for responsive media)

Everything else — padding, margin, color, gap, font — comes from Radix props (`p`, `m`, `gap`, `color`, `weight`, `size`), **never** inline.

**Escape-hatch allow-list** (use sparingly, only when Radix has no equivalent prop):

- **Layered positioning**: `position`, `top`, `right`, `bottom`, `left`, `inset`, `zIndex`, `transform`
- **Color tokens**: `backgroundColor`, `color`, `fill`, `borderColor`, `border`, `borderTop/Right/Bottom/Left`, `borderWidth`, `boxShadow`, `opacity`
- **Radius**: `borderRadius`
- **Overflow + truncation**: `overflow`, `overflowX`, `overflowY`, `textOverflow`, `whiteSpace`, `WebkitLineClamp`, `WebkitBoxOrient` (plus `display: "-webkit-box"`)
- **Pointer & cursor**: `pointerEvents`, `cursor`
- **Reset / list semantics**: `listStyle`, `outline`
- **Text alignment**: `textAlign` (use Radix `<Text align>` when the element is `<Text>`; this carve-out is for `<Box>` wrapping a non-Text element like a button)

For escape-hatch properties, **every value must be one of**:
- A Radix CSS variable (`var(--color-*)`, `var(--radius-*)`, etc.).
- A keyword from the property's whitelist (e.g. `position: "sticky"`, `cursor: "pointer"`, `whiteSpace: "nowrap"`, `textAlign: "center"`).
- A unitless number for `zIndex`, `opacity`, or `WebkitLineClamp`.
- The literal `0` (or `"0px"` / `"0%"` / `"0em"`) for any escape-hatch property.
- For `borderRadius` only: the circular-shape literals `"9999px"` or `"50%"`.

**Hard-coded hex codes, named colors, and arbitrary pixel values are never allowed.** Lint rule `no-disallowed-inline-style` enforces both lists.

**Recipes**:

```tsx
// Circular medallion / avatar wrapper
<Flex align="center" justify="center" style={{
  width: "56px", height: "56px",
  borderRadius: "9999px",
  backgroundColor: "var(--gray-3)",
}}>

// Single-line ellipsis truncation
<Text style={{
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}}>

// Multi-line clamp (3 lines)
<Text style={{
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
}}>

// Semantic <ul> reset (still apply for accessibility)
<Flex asChild>
  <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>…</ul>
</Flex>
```

```tsx
// ✅ Primary: layout sizing
<Box style={{ maxWidth: "640px" }}>

// ✅ Escape hatch: sticky header (Radix Box has no zIndex/backgroundColor props)
<Box
  asChild
  position="sticky"
  top="0"
  style={{
    zIndex: 50,
    backgroundColor: "var(--color-background)",
    borderBottom: "1px solid var(--gray-4)",
  }}
>
  <header>…</header>
</Box>

// ❌ Wrong: literal hex bypasses the token system
<Box style={{ backgroundColor: "#fafafa" }}>

// ❌ Wrong: padding should use Radix prop
<Box style={{ padding: "12px 16px" }}>
<Box p="3">  // ← correct
```

### 15.6 displayName

Every `forwardRef`-wrapped or wrapper component sets `displayName` so DevTools shows useful names.

---

## 16. Forms & input

### 16.0 Non-negotiables (ruled 2026-07-04)

- **Label weight is `medium`. Everywhere.** Bold labels are reserved for nothing — bold belongs to headings. (Earlier revisions of this document showed `bold` in one example and `medium` in another; `medium` is the ruling, and the platform components were migrated.)
- **Labels sit above their control**, never inline-left — except the companion labels of Checkbox/Radio/Switch (§16.9).
- **One field size per form.** The default is `size="2"`; a form may choose `size="3"` for prominence, but then *every* control in it — including Selects and the submit row's inputs — uses that size (§16.8).

### 16.1 The canonical field

```tsx
import { Box, Text, TextField, Button } from "@welpco/ui";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";

<Box mb={FORM_SPACING.fieldGap}>
  <Text
    as="label"
    size="2"
    weight="medium"
    mb={FORM_SPACING.labelGap}
    htmlFor="email"
  >
    Email
    {required && (
      <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
    )}
  </Text>
  <TextField.Root
    id="email"
    type="email"
    required
    aria-required="true"
    aria-invalid={!!error || undefined}
    aria-describedby={error ? "email-error" : helper ? "email-helper" : undefined}
  />
  {error ? (
    <Text id="email-error" role="alert" size="1" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
      {error}
    </Text>
  ) : helper ? (
    <Text id="email-helper" size="1" color="gray" mt={FORM_SPACING.helperGap}>
      {helper}
    </Text>
  ) : null}
</Box>
```

For the common case, use `<Input label error helper required />` from `@welpco/ui/input` — it encapsulates the above.

### 16.2 Validation UX

- **Validate on blur**, not on keystroke. Constant red flags train users to ignore errors.
- **Validate on submit** for all fields; focus moves to the first error.
- **Error text is specific**. "Invalid email" is lazy. "Email must include an @" tells the user what to do.
- **Success validation** is not required. Green checks on correct fields are celebratory noise.
- **Never hide** the submit button while validating. Disable it.

### 16.3 Required vs optional

**Canonical rule**: mark every required field with a trailing `*`. Add `(optional)` text to non-required fields only when the field sits next to required ones and its optional status needs to be obvious (e.g. `Phone (optional)` when Email is required).

Why `*` as the canonical choice: Welpco forms vary in required-to-optional ratio (some 100% required, some 60/40), so a single convention that works for every form beats per-form optimization. `*` is also universally scan-readable and battle-tested for accessibility (paired with `required` + `aria-required="true"` + `aria-hidden` on the marker span).

```tsx
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";

// ✅
<Text as="label" htmlFor="email" size="2" weight="medium" mb={FORM_SPACING.labelGap}>
  Email
  <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
</Text>
<TextField.Root id="email" type="email" required aria-required="true" />

// For Select (whose trigger is a button, not a form field),
// use `aria-labelledby` on the trigger. `htmlFor` pointing at a Select
// trigger does nothing — it is a banned anti-pattern.
<Text as="label" id="frequency-label" size="2" weight="medium" mb={FORM_SPACING.labelGap}>
  Frequency
  <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
</Text>
<Select …>
  <SelectTrigger aria-labelledby="frequency-label" />
  …
</Select>
```

Never use raw `color="red"` for the asterisk — use `SEMANTIC_COLOR.danger` so the marker re-skins automatically if the danger token changes.

### 16.4 Input types matter

Use the right `type` so mobile keyboards are correct:

| Field       | `type`         | Extras                                        |
| ----------- | -------------- | --------------------------------------------- |
| Email       | `email`        | `autoComplete="email"`, `inputMode="email"`   |
| Phone       | `tel`          | `inputMode="tel"`                             |
| Password    | `password`     | `autoComplete="new-password"` or `current-password` |
| URL         | `url`          |                                               |
| Number      | `text` + `inputMode="numeric" pattern="[0-9]*"` | More reliable than `type="number"` |
| Search      | `search`       |                                               |
| OTP / code  | `text` + `inputMode="numeric"` + `autoComplete="one-time-code"` |     |

### 16.5 Autofill

Always set `autoComplete` to the correct HTML value. Broken autofill is accessibility debt and a trust tax.

### 16.6 Submit pattern

```tsx
<Button type="submit" color={SEMANTIC_COLOR.primary} disabled={loading} mt={FORM_SPACING.submitGap}>
  {loading ? <Spinner /> : "Create account"}
</Button>
```

- Button label is a **verb** describing the action — not "Submit" or "OK".
- Loading disables the button and replaces the label with a spinner. Keep the button's width stable.
- Never show a global loader for a form submission — it belongs on the button.

### 16.7 Input groups and slots

Use `TextField.Slot` for leading/trailing adornments (search icon, unit, clear button) — never absolute positioning.

```tsx
<TextField.Root placeholder="Search jobs">
  <TextField.Slot><SearchIcon /></TextField.Slot>
  <TextField.Slot side="right"><Kbd>⌘F</Kbd></TextField.Slot>
</TextField.Root>
```

### 16.8 Control metrics & size pairing

Every form control on the same Radix size renders the same height (verified in Storybook, 2026-07-04):

| Size | TextField / Select / Button height | Font size |
| ---- | ---------------------------------- | --------- |
| 1    | 24px                               | 12px      |
| 2    | 32px (default)                     | 14px      |
| 3    | 40px                               | 16px      |
| 4    | 48px (Button/IconButton only)      | 18px      |

Rules:
- **Controls sharing a row share a size.** An input with an adjacent button (search bar, promo code, referral code) uses the same numeric size on both — this is what keeps their heights identical.
- **One field size per form** (§16.0). Mixing a `size="2"` Select into a `size="3"` form is the classic misalignment bug — banned.
- In a stacked form, **fields span the full form column width**, including Select triggers. A Select that hugs its content next to full-width inputs reads as broken. A `SelectTrigger` is inline-flex and hugs content by default — a `width: 100%` wrapper Box does **not** fix it; put `style={{ width: "100%" }}` on the trigger itself.
- **`Text as="label"` renders inline — always add `style={{ display: "block" }}`.** Inside a `Flex` column the label happens to be blockified, but in a plain `Box` an inline label lets an inline-flex control (SelectTrigger) flow onto the *same line*, and whether it wraps depends on content width — two identical columns can render with different label/control layouts (found live in SupportForm, 2026-07-04). `display: block` on the label is the §15.5-sanctioned escape hatch; don't rely on the container.
- Deliberate multi-up rows of intrinsically short fields (date | time, expiry | CVC | postal, first | last name) are fine (§16.10) — the rule is *uniform widths within the row* and same size, not that every field must be full-width.

### 16.9 Companion labels (Checkbox, Radio, Switch)

These controls carry their label *beside* them, not above. Canonical pattern — wrap in a real `<label>` so the text is clickable and centering is automatic:

```tsx
<Text as="label" size="2">
  <Flex align="center" gap="2">
    <Checkbox checked={value} onCheckedChange={setValue} />
    Email me when a booking is confirmed
  </Flex>
</Text>
```

- Companion labels are `size="2"` **regular** weight (they are values, not field labels).
- Group captions above a radio/checkbox group follow §16.1 label styling (`size="2" weight="medium"`), with the group container carrying `role="group"` + `aria-labelledby` — a caption is not a `<label>` because it labels no single control.

### 16.10 Form and field width

- A standalone form column (auth pages, dialogs) is **max-width 480px**. Wider forms drift toward unscannable line lengths on labels/helpers.
- Fields fill the form column width by default. Fixed-width fields are allowed only for intrinsically short values (postal code, expiry, OTP) — size them with Radix `width`/`maxWidth` props on the 4pt grid, not hand-written pixel styles.

### 16.11 Disabled during submit

While a submission is in flight: disable the submit button and swap its label for `<Spinner />` (§16.6), and disable the form's fields — prefer one `<fieldset disabled={loading}>` (or a shared `disabled={loading}` prop) over sprinkling per-field logic. Never leave fields editable while their submit is pending.

---

## 17. Feedback & messaging

The right feedback at the right scope.

### 17.1 Scope matrix

| Scope                | Vehicle                                          |
| -------------------- | ------------------------------------------------ |
| Single field         | Inline helper/error text                         |
| Single form          | `<Callout>` above the submit button              |
| Page-level transient | Toast (auto-dismiss 4–6s)                        |
| Page-level persistent| `<Callout>` anchored at top of main              |
| Blocking decision    | `<AlertDialog>`                                  |
| Full-screen failure  | Error boundary with retry + support link         |

### 17.2 Toast rules

- Max **3 simultaneous**; older toasts queue or collapse.
- Success toasts auto-dismiss in 4s; error toasts require explicit dismissal.
- Toasts never contain forms, selects, or multi-step content. That's a dialog.
- Position: bottom-center on mobile, bottom-right on desktop.

### 17.3 Empty states

Every list component has an empty state. Empty states follow this script:

1. **Illustration** (optional, restrained) or icon.
2. **Headline** (short, not apologetic): "No bookings yet"
3. **Description** (one sentence): "Your upcoming bookings will show up here."
4. **Primary action** (if applicable): `Button: Browse services`

### 17.4 Loading states

- Use `<Skeleton>` for structural loading that matches the final layout.
- Use `<Spinner>` only inside small controls (buttons, icon buttons) or when the layout is unknown.
- Never leave a screen blank while loading.
- Lists: show 3 skeleton rows; cards: show 2–3 skeleton cards.

### 17.5 Error states

| Level                 | Pattern                                              |
| --------------------- | ---------------------------------------------------- |
| Expected (validation) | Inline, quiet, specific                              |
| Unexpected (500)      | `<Callout color="red">` with retry action            |
| Catastrophic          | Error boundary, big headline, small retry, support link |

**Always** offer a next step. "Something went wrong" with no action is hostile.

### 17.6 Destructive confirmations

Destructive actions (delete, cancel booking, remove payment method) use `<AlertDialog>`:

- **Title** is a clear yes/no question: "Delete this payment method?"
- **Description** explains the consequence: "You won't be able to book with this card anymore. You can add it back later."
- **Actions**: `Cancel` (default, soft variant) + `Delete` (red, solid). **Destructive action on the right**, matching OS convention.
- Destructive wording uses the verb: "Delete", not "OK" or "Yes".

---

## 18. Navigation patterns

### 18.1 Header

- Sticky at top. Height: 56px mobile, 64px desktop.
- Left: logo + role switcher (if applicable).
- Center or right: primary nav on desktop, collapsed to icon on mobile.
- Right: search (desktop), notifications, avatar.
- Below bar: tab strip for section navigation (optional).

### 18.2 Tabs

- **≤5 tabs**: visible on all breakpoints.
- **6+ tabs**: horizontal scroll on mobile, wrap on tablet+.
- Active tab has a **2px underline** in primary color — not a background fill (tabs aren't buttons).
- Tabs control a view; buttons perform an action. Never blur them.

### 18.3 Breadcrumbs

Used on pages more than 2 levels deep. Truncate with `…` for long middle paths. Always clickable except the current page (which is text).

### 18.4 Back affordance

Mobile: a leading-back icon button at the top-left. Desktop: breadcrumbs. **Never both.**

### 18.5 Mobile navigation

- Primary nav collapses to a bottom tab bar OR a top-right menu (`hamburger` is acceptable but tab bar is preferred for 3–5 top sections).
- Tab bar: fixed bottom, 56px height, max 5 items.

---

## 19. Data display

### 19.1 Tables

- Desktop: `<Table>` with sticky header if the page scrolls.
- Mobile: **convert rows to cards**. A 7-column table on a 360px screen is a failure.
- Numeric columns use `justify="end"`; use tabular numerals.
- Sortable columns show a chevron; active sort direction is indicated.
- Selection uses `<Checkbox>` in the first column; select-all in the header.

### 19.2 Lists

- Use `<Card>` for discrete items with meaningful content (bookings, welpers, messages).
- Use flat rows (no card chrome) for long, scannable lists (notification list, chat list).
- Divider: `<Separator>` between rows in flat lists; nothing between cards.

### 19.3 Stat tiles

- Big number at `size="7"`–`"8"`.
- Label above, small, `color="gray"`.
- Delta (if applicable): ▲ or ▼ with color + percentage. Use green for up, red for down, **except** where up is bad (e.g. "Dispute rate" — invert the color).

---

## 20. Trust & safety patterns

Welpco is a transactional marketplace. Trust signals are first-class UI.

### 20.1 Verified badge

A Welper who has completed identity verification shows a green check badge next to their name. Never stylize this — consistency is the signal.

### 20.2 Rating display

```
★ 4.92  ·  128 reviews
```

- Numeric rating at 2 decimals.
- Count is scannable in one glance.
- Tap target opens full review list.

### 20.3 Price

- Currency symbol glued to the number: `$24/hr`, not `$ 24 / hr`.
- Large prices use grouping: `$1,234`.
- If the price is "starting from", say so: `From $24/hr`.
- Never bury the total. If taxes/fees apply, show them before submit.

### 20.4 Status badges

Booking, dispute, job, and payment status are all **closed sets**. Use `<Badge>` with a fixed color per status. Never invent new statuses without updating the design system.

**Canonical shape**: every status badge uses `variant="soft"` with `highContrast`. Soft keeps the visual tone muted (badges are informational, not CTAs). `highContrast` bumps text to Radix step 12, ensuring WCAG AA on every accent across both themes.

```tsx
<Badge color="amber" variant="soft" highContrast>Pending</Badge>
```

Color mapping by status family:

| Family       | Color  | Examples                                         |
| ------------ | ------ | ------------------------------------------------ |
| Attention    | amber  | Pending · Reviewing · Open (dispute) · In review |
| Active       | blue   | In progress · Interviewing · Authorized · Open (job) · Shortlisted |
| Positive     | green  | Accepted · Resolved · Succeeded · Offer · Filled |
| Destructive  | red    | Cancelled · Canceled · Failed · Escalated        |
| Neutral      | gray   | Draft · Completed · Closed · Refunded            |

**Never** use `variant="solid"` for status. Solid reads as a CTA (actionable) — status badges are passive indicators. If you need to signal urgency on a status, promote it to a `<Callout>` with an icon, not a louder badge.

### 20.5 Money movement

Any screen that moves money shows: amount, recipient, payment method, and a clear "Confirm" button. Never use a toggle to commit money. Never auto-confirm after a countdown.

---

## 21. Accessibility

**WCAG 2.1 Level AA is the minimum.** AAA where feasible.

### 21.1 Keyboard

- Every interactive element reachable by Tab.
- Tab order follows visual order; no positive `tabindex`.
- `Enter`/`Space` activates buttons; `Escape` closes overlays.
- Focus-visible ring is **never** hidden. Radix's default is correct.
- Skip links: "Skip to main content" as the first focusable element on every page.

### 21.2 Screen reader

- Semantic HTML. `<button>` for actions, `<a>` for navigation. Never a styled `<div>`.
- Landmarks: `<header>`, `<nav>`, `<main>`, `<footer>`. One `<main>` per page.
- Images have meaningful `alt`. Decorative images use `alt=""`.
- Dialogs: title and optional description are programmatically associated. Radix handles this.
- Live regions for transient messages (toasts use `role="status"` for success, `role="alert"` for error).

### 21.3 Forms

- Every input has a `<label>` with `htmlFor`.
- Required fields have `required` + `aria-required="true"`.
- Error text is associated via `aria-describedby` and uses `role="alert"` for submit-time errors.
- Invalid fields have `aria-invalid="true"`.
- Grouped fields (radio, checkbox group) use `<fieldset>` + `<legend>`.

### 21.4 Color & contrast

See [§5.3 Contrast](#53-contrast). Color is never the only signal.

### 21.5 Motion

See [§10.3 Prefers-reduced-motion](#103-prefers-reduced-motion).

### 21.6 Touch

See [§9.5 Touch targets](#95-touch-targets).

### 21.7 Language

Every page has `<html lang="…">` set. Non-English inline text uses `<span lang="…">`.

### 21.8 Testing

- **Automated**: `@storybook/addon-a11y` runs WCAG 2.1 AA rules on every story. Zero critical violations is the merge gate.
- **Manual**: keyboard-only tour of any new screen before merge. VoiceOver/TalkBack spot check for critical flows (auth, booking, payment).

---

## 22. Voice & microcopy

### 22.1 Voice

**Warm, direct, competent.** We treat users as intelligent adults. We're the friendly expert who respects your time.

- **Warm**, not gushing: "Welcome back" not "Welcome back!! 🎉"
- **Direct**, not terse: "Review and confirm your booking" not "Confirm"
- **Competent**, not technical: "We couldn't reach your bank" not "HTTP 502 from Plaid"

### 22.2 Rules of thumb

- Contractions are fine. "You'll" > "You will".
- Second person ("you"). Never "the user" in UI strings.
- Active voice. "We sent you a code" > "A code has been sent to you".
- Be specific. "In 2 days" > "Soon".

### 22.3 Word bank

| Prefer          | Over                      |
| --------------- | ------------------------- |
| Sign in         | Log in                    |
| Welper          | Service provider / helper |
| Booking         | Appointment / reservation |
| Confirm         | OK / Submit               |
| Cancel          | Dismiss / No / Back       |
| Got it          | OK                        |
| We couldn't …   | There was an error        |
| Try again       | Retry                     |

### 22.4 Error messaging

Structure: **what happened → why → what to do**.

> ❌ "Invalid credentials."
> ✅ "That email and password don't match. Double-check and try again, or reset your password."

### 22.5 Empty states copy

- Don't apologize for emptiness.
- Point forward: "Your next booking will show up here."

### 22.6 Ethics in copy

- No dark patterns. No "Are you sure you want to leave all this value behind?" guilt copy.
- Never use fake urgency ("Only 2 left!") unless it's true.
- Opt-ins are opt-ins. Never pre-check marketing consent.

---

## 23. Internationalization

- All user-facing strings are translatable (never hard-coded in components).
- **Dates** use the user's locale formatting (`Intl.DateTimeFormat`).
- **Currencies** use `Intl.NumberFormat` with the booking's currency.
- **RTL**: avoid hard-coded `left`/`right` in CSS. Use `inline-start`/`inline-end` or Radix's logical props.
- Allow 30% text expansion headroom in layouts — German and French take more space than English.
- Pluralization uses ICU message format or equivalent. Never "1 item(s)".

---

## 24. Enforcement

### 24.1 Automated

- **TypeScript**: token types (e.g. `FieldSize`) prevent out-of-range values at compile time.
- **ESLint**: rules to forbid raw pixel values in `style`, disallowed `style` properties, missing `displayName` on `forwardRef`. (Rules live in `.eslintrc.js`.)
- **Storybook a11y panel**: WCAG 2.1 AA rules run on every story. Zero critical is required.
- **Type-check gate**: `pnpm --filter @welpco/ui type-check` passes.
- **Storybook build gate**: `pnpm --filter @welpco/design-system build-storybook` passes.

### 24.2 Code review checklist

For every PR touching UI:

- [ ] All spacing comes from `FORM_SPACING` or Radix tokens (no pixel literals in `style`).
- [ ] All colors come from `SEMANTIC_COLOR` for meaningful UI, or `ACCENT_COLORS` for decorative.
- [ ] All sizes pass through typed token arrays (`BUTTON_SIZE`, `FIELD_SIZE`, etc.).
- [ ] Responsive behavior uses Radix prop objects, not JS viewport hooks.
- [ ] New components ship with a `.stories.tsx` file including `tags: ['autodocs']`.
- [ ] All interactive elements have an accessible name.
- [ ] Forms follow the canonical field pattern in §16.1.
- [ ] Destructive actions go through `<AlertDialog>`.
- [ ] Dark mode tested; no hard-coded colors that break.
- [ ] Storybook a11y panel shows zero critical violations.

### 24.3 Deviations

If a design must deviate from this doc, the deviation is **documented in the component's JSDoc** with the reason. Three deviations of the same kind trigger an update to this doc.

### 24.4 Versioning

This doc is versioned with the `@welpco/ui` package. Breaking changes to components require a migration note in the PR and a changelog entry.

---

## 25. Patterns & anti-patterns

### 25.1 Form layout

```tsx
// ✅
import { Box, Text, TextField, Button, Flex } from "@welpco/ui";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";

<Flex asChild direction="column" gap="5">
  <form onSubmit={handleSubmit}>
    <Box mb={FORM_SPACING.fieldGap}>
      <Text as="label" mb={FORM_SPACING.labelGap} htmlFor="name">Full name</Text>
      <TextField.Root id="name" required />
    </Box>

    <Button type="submit" color={SEMANTIC_COLOR.primary} mt={FORM_SPACING.submitGap}>
      Create account
    </Button>
  </form>
</Flex>
```

```tsx
// ❌
<form onSubmit={handleSubmit} style={{ display: "grid", gap: "20px" }}>
  <div>
    <label>Full name</label>
    <input type="text" />
  </div>
  <button type="submit" style={{ marginTop: "4px" }}>Submit</button>
</form>
```

### 25.2 Responsive grid

```tsx
// ✅
<Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap={{ initial: "3", md: "4" }}>

// ❌
const isMobile = useIsMobile();
<div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: "16px" }}>
```

### 25.3 Icon-only button

```tsx
// ✅
<IconButton variant="ghost" aria-label="Close">
  <Cross2Icon aria-hidden />
</IconButton>

// ❌
<button style={{ padding: 8, background: "transparent", border: 0 }}>
  <Cross2Icon />
</button>
```

### 25.4 Destructive confirmation

```tsx
// ✅
<AlertDialog>
  <AlertDialogTrigger>
    <Button color={SEMANTIC_COLOR.danger} variant="soft">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>Delete this payment method?</AlertDialogTitle>
    <AlertDialogDescription>
      You won't be able to book with this card anymore. You can add it back later.
    </AlertDialogDescription>
    <Flex gap="3" justify="end" mt={FORM_SPACING.submitGap}>
      <AlertDialogCancel><Button variant="soft">Cancel</Button></AlertDialogCancel>
      <AlertDialogAction><Button color={SEMANTIC_COLOR.danger}>Delete</Button></AlertDialogAction>
    </Flex>
  </AlertDialogContent>
</AlertDialog>

// ❌
if (confirm("Are you sure?")) { deletePaymentMethod(); }
```

### 25.5 Error message

```tsx
// ✅
<Callout color={SEMANTIC_COLOR.danger} variant="surface">
  <CalloutIcon><ExclamationTriangleIcon /></CalloutIcon>
  <CalloutText>
    We couldn't save your changes — your session expired.
    <Link href="/signin">Sign in again</Link> and we'll pick up where you left off.
  </CalloutText>
</Callout>

// ❌
<div style={{ color: "red" }}>Error: session_expired (401)</div>
```

### 25.6 Canonical card

Every card (booking, review, notification, job, welper profile, …) follows
the same three-region skeleton: **header row → body → action row**. Distinct
cards vary in what goes *inside* each region — never in the shape itself.

```tsx
import { Card, Flex, Box, Heading, Text, Button } from "@welpco/ui";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";

<Card size="3" variant="surface" style={{ width: "100%", maxWidth: "640px" }}>
  <Flex direction="column" gap="3">
    {/* 1. Header row — title column + trailing status/date/metric */}
    <Flex justify="between" align="start" gap="3">
      <Box flexGrow="1" style={{ minWidth: 0 }}>
        <Heading size="4" mb="1" trim="start">{title}</Heading>
        {/* Inline metadata, one line, bullet separator. NOT a label/value stack. */}
        <Text size="2" color="gray" highContrast>
          {customerName} · {location}
        </Text>
      </Box>
      <Box flexShrink="0">{statusBadge /* or date, kpi */}</Box>
    </Flex>

    {/* 2. Body — icon-led detail rows, description, content */}
    <Flex direction="column" gap="2">
      <Flex align="center" gap="2">
        <Calendar size={16} aria-hidden="true" style={{ color: "var(--gray-10)" }} />
        <Text size="2">{scheduledFor}</Text>
      </Flex>
    </Flex>

    {/* 3. Action row — right-aligned; order: secondary → destructive → primary */}
    <Flex gap="2" justify="end" wrap="wrap">
      <Button variant="soft" color="gray" size="2">View details</Button>
      <Button variant="ghost" color={SEMANTIC_COLOR.danger} size="2">Cancel</Button>
      <Button variant="solid" color={SEMANTIC_COLOR.primary} size="2">Confirm</Button>
    </Flex>
  </Flex>
</Card>
```

**Rules**:

| Region          | Rule                                                                   |
| --------------- | ---------------------------------------------------------------------- |
| Card size       | `size="3"` for list-row cards; `size="4"` for genuine hero/summary cards; `size="2"` only in dense lists. |
| Internal rhythm | Outer `<Flex direction="column" gap="3">` always.                      |
| Title           | `<Heading size="4" mb="1">`. Larger is wrong for a card title.         |
| Metadata        | `<Text size="2" color="gray" highContrast>` — bullet-separated inline, never "Label: Value" rows. |
| Body detail rows| `<Flex align="center" gap="2">` with a 16px lucide icon in `var(--gray-10)`. |
| Status/date     | Right side of the header row inside `<Box flexShrink="0">`.            |
| Actions         | `<Flex gap="2" justify="end" wrap="wrap">`. Order: **secondary → destructive → primary**. Primary is always the last, visually furthest right. |
| Destructive     | `variant="ghost" color={SEMANTIC_COLOR.danger}`. Destructive card actions that commit the change go through `<AlertDialog>` (§25.4). |
| Primary         | `variant="solid" color={SEMANTIC_COLOR.primary}`. Never raw `color="green"`. |
| Max width       | `maxWidth: "640px"` for profile/detail cards; no max when cards live in a `<Grid>`. |
| No `height`     | Never set `style={{ height: "100%" }}` on a card — let content determine height. Equal-height rows come from the parent grid. |

**Anti-patterns**:

```tsx
// ❌ Verbose label/value stack
<Flex align="center" gap="2">
  <Text size="2" weight="medium">When:</Text>
  <Text size="2">{scheduledFor}</Text>
</Flex>
<Flex align="center" gap="2">
  <Text size="2" weight="medium">Where:</Text>
  <Text size="2">{location}</Text>
</Flex>

// ✅ Icon-led detail rows — scannable at a glance
<Flex align="center" gap="2">
  <Calendar size={16} aria-hidden="true" style={{ color: "var(--gray-10)" }} />
  <Text size="2">{scheduledFor}</Text>
</Flex>
<Flex align="center" gap="2">
  <MapPin size={16} aria-hidden="true" style={{ color: "var(--gray-10)" }} />
  <Text size="2">{location}</Text>
</Flex>
```

```tsx
// ❌ Actions left-aligned with no hierarchy
<Flex gap="2" wrap="wrap">
  <Button>View</Button>
  <Button color="green">Book</Button>
  <Button color="red">Cancel</Button>
</Flex>

// ✅ Right-aligned, primary last, destructive middle
<Flex gap="2" justify="end" wrap="wrap">
  <Button variant="soft" color="gray">View</Button>
  <Button variant="ghost" color={SEMANTIC_COLOR.danger}>Cancel</Button>
  <Button variant="solid" color={SEMANTIC_COLOR.primary}>Book</Button>
</Flex>
```

---

*Maintained by the design system team. Last major revision: 2026-04-24.*
