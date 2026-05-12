# marketing-new — faithful design-bundle port

This folder is a **faithful port** of the design handoff bundle in
`apps/web/.design-reference/project/`. It is mounted at `/` as a
**parallel evaluation surface** alongside the existing `/` landing
(`app/(marketing)/` + `components/features/landing/`). The user will pick one
to ship; both must be reachable in the meantime.

## Cross-reference

The original bundle is at `apps/web/.design-reference/`:

- Bundle entry: `.design-reference/project/Welpco Website.html`
- Visual system: `.design-reference/project/styles/tokens.css`
- Components: `.design-reference/project/components/{shared,hero,sections,homepage,pages}.jsx`
- Design conversation that produced the bundle: `.design-reference/chats/chat1.md`

If you need to verify a port against the source, those are the authoritative
files. The port mirrors them 1:1 in shape; the only documented deviations are
listed in `apps/web/AUDIT-LOG.md` under "Day 8 — `/` faithful
design port".

## Discipline policy — explicitly looser than `landing/`

This surface is **not** held to the bible's §3.3 brand-color discipline, the
`@welpco/eslint-plugin-design` rules, or the marketing CLAUDE.md's Direction-D
register. It is the design canvas, ported as-is, for evaluation.

**What that means in practice:**

- Inline `style={{}}` is used heavily (the bundle uses inline styles
  throughout — re-shaping every value into a CSS module would change the
  port from "faithful" to "interpretive"). The `@welpco/eslint-plugin-design`
  rules are **not enabled in `apps/web`'s eslint config**, so no per-file
  disable is needed today. If those rules are ever added to `apps/web`,
  add a folder-level `.eslintrc.json` here with
  `@welpco/design/no-disallowed-inline-style` and
  `@welpco/design/no-raw-semantic-color` set to `off`.
- Raw hex values (`#00492F`, `#FAF1E5`, `#79C000`, …) live in
  `app/tokens.css` as the bundle's CSS custom properties.
  Components reference them via `var(--evergreen)`, `var(--cream)`, etc.
- The bundle's own `<Wordmark>` is the brand mark for this surface — italic
  Fraunces 500 with a green-9 dot. This intentionally differs from the
  app-wide brand mark used in `(marketing)/`.
- `@welpco/ui` primitives (`Button`, `Card`, `Heading`, `Text`) are
  **not used** here. The bundle has its own button/card/pill system in the
  scoped `tokens.css` (`.btn`, `.btn-primary`, `.btn-accent`, `.btn-ghost`,
  `.pill`, `.card`, `.eyebrow`, `.display-italic`, `.mono`). All components
  reach for those classes via the global `.welpco` scope.

**What still applies, even here:**

- **Bible §22 voice** in copy. The bundle's user already corrected the tone
  mid-chat ("the wording is too much friendly… the text should not cover all
  video space"); the JSX reflects that correction. Don't re-edit it.
- **WCAG 2.1 AA contrast** on every text block. Evergreen on Cream Beige is
  high-contrast (>12:1); the dark Footer cream-on-evergreen pair is the one
  to verify on each meaningful change. Run `design:accessibility-review`
  after non-trivial changes.
- **`prefers-reduced-motion: reduce`** is honored in `tokens.css` for the
  marquee and button hover micro-motion. Add additional respect rules for
  any new motion you introduce.
- **Server components by default.** Mark `"use client"` only where the
  component actually needs hooks, state, refs, or event handlers.

## Folder map

```
components/features/marketing/
  CLAUDE.md                       ← this file
  shared/
    wordmark.tsx                  ← italic Fraunces 500 + green-9 dot bullet
    placeholder.tsx               ← striped colored blocks with mono captions
    hand-underline.tsx            ← SVG hand-drawn underline
    arrow-down.tsx                ← decorative arrow
    top-nav.tsx                   ← sticky nav, next/link, usePathname active
    footer.tsx                    ← dark Evergreen footer with 4 link columns
  hero/
    hero-fullbleed.tsx            ← only the full-bleed variant (per chat lock)
    search-bar.tsx                ← pill-shaped two-input search
    video-frame.tsx               ← wraps <VideoBackground> + design ornament
    floating-card.tsx
    stat-bubble.tsx
  sections/
    section-header.tsx
    categories-grid.tsx           ← 4-col grid of 8 categories
    category-icon.tsx             ← 8 inline SVGs (heart/paw/book/home/leaf/apple/star/plug)
    how-it-works.tsx              ← Customer ↔ Welper toggle
    community-spotlight.tsx
    welper-card.tsx
    minors-banner.tsx
    testimonials.tsx
    trust-safety.tsx
    become-welper-cta.tsx
    faq-teaser.tsx
    marquee-band.tsx
  pages/
    about-page.tsx
    how-it-works-page.tsx
    faq-page.tsx
    contact-page.tsx
    field.tsx                     ← shared form field
```

## What is NOT ported

- `design-canvas.jsx` and `tweaks-panel.jsx` — these are the bundle's
  evaluation harness (artboard wrapper + runtime style switcher), not
  shipping features. WEB-APP-PLAN.md §7.5 prohibits runtime style switchers
  in the public landing.
- `HeroSplit` and `HeroCentered` — only `HeroFullbleed` ships, per the
  user's mid-chat lock and the chat's iteration on it.
- The bundle's `window.dispatchEvent('welpco-nav', …)` pattern — replaced
  with `next/link`. Active link state computed via `usePathname()`.

## What WAS substituted

- **`<VideoFrame>`** — the bundle's striped placeholder with a play button
  is preserved as the **frame chrome**, but the inner video surface is
  filled by `apps/web/components/features/landing/video-background.tsx`
  pointing at `apps/web/public/hero-background.mp4`. That gives us the real
  intersection-observer-driven, reduced-motion-safe playback the rest of
  the app uses, while keeping the bundle's bottom-left mono timestamp /
  file label as design ornament. See `hero/video-frame.tsx`.
- **Contact form** — the bundle's `onSubmit={e => e.preventDefault()}` is
  preserved as a no-op + `console.log` of the form payload. There is no
  BFF endpoint for support contact yet — that's tracked as a follow-up in
  the AUDIT-LOG. Until the BFF lands, the form gives visual completeness
  without making promises we can't keep.

## Verification

- `pnpm --filter @welpco/web type-check` — passes after any change here.
- `pnpm --filter @welpco/web build` — all 5 routes
  (``, `/about`, `/how-it-works`,
  `/faq`, `/contact`) prerender as static (`○`).
- `cd apps/web && npx eslint app/ components/features/marketing/` —
  expected 0 errors. The `react/no-unescaped-entities` warnings are
  suppressed inline via `&apos;` entities where needed.
