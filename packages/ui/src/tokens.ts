/**
 * Design tokens for the Welpco UI library.
 *
 * These are typed re-exports of the Radix UI Themes scale. Import them
 * instead of passing bare strings so that consumers get IDE autocomplete
 * and type-checking for sizes, variants, colors, and spacing.
 *
 * Canonical spec lives in `../ui-ux-bible.md`.
 */

// ---------------------------------------------------------------------------
// Size scales
// ---------------------------------------------------------------------------

/** Full Radix scale — used for spacing (p, m, gap) and layout props. */
export const RADIX_SIZE = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
export type RadixSize = (typeof RADIX_SIZE)[number];

/** Button and IconButton accept sizes 1–4. */
export const BUTTON_SIZE = ["1", "2", "3", "4"] as const;
export type ButtonSize = (typeof BUTTON_SIZE)[number];

/** Form field components (TextField, TextArea, Select) accept sizes 1–3. */
export const FIELD_SIZE = ["1", "2", "3"] as const;
export type FieldSize = (typeof FIELD_SIZE)[number];

/** Badge, Callout, and other inline indicators accept sizes 1–3. */
export const BADGE_SIZE = ["1", "2", "3"] as const;
export type BadgeSize = (typeof BADGE_SIZE)[number];

/** Heading accepts sizes 1–9. */
export const HEADING_SIZE = RADIX_SIZE;
export type HeadingSize = RadixSize;

/** Text accepts sizes 1–9. */
export const TEXT_SIZE = RADIX_SIZE;
export type TextSize = RadixSize;

/** Card accepts sizes 1–5 — controls internal padding. */
export const CARD_SIZE = ["1", "2", "3", "4", "5"] as const;
export type CardSize = (typeof CARD_SIZE)[number];

/** Dialog/AlertDialog content max width preset. Maps to Radix Dialog size. */
export const DIALOG_SIZE = ["1", "2", "3", "4"] as const;
export type DialogSize = (typeof DIALOG_SIZE)[number];

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

export const BUTTON_VARIANTS = ["solid", "soft", "outline", "ghost", "surface", "classic"] as const;
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

export const BADGE_VARIANTS = ["solid", "soft", "outline", "surface"] as const;
export type BadgeVariant = (typeof BADGE_VARIANTS)[number];

export const FIELD_VARIANTS = ["classic", "surface", "soft"] as const;
export type FieldVariant = (typeof FIELD_VARIANTS)[number];

export const CALLOUT_VARIANTS = ["soft", "surface", "outline"] as const;
export type CalloutVariant = (typeof CALLOUT_VARIANTS)[number];

// ---------------------------------------------------------------------------
// Accent colors (Radix Themes palette)
// ---------------------------------------------------------------------------

export const ACCENT_COLORS = [
  "gray",
  "gold",
  "bronze",
  "brown",
  "yellow",
  "amber",
  "orange",
  "tomato",
  "red",
  "ruby",
  "crimson",
  "pink",
  "plum",
  "purple",
  "violet",
  "iris",
  "indigo",
  "blue",
  "cyan",
  "teal",
  "jade",
  "green",
  "grass",
  "lime",
  "mint",
  "sky",
] as const;
export type AccentColor = (typeof ACCENT_COLORS)[number];

/**
 * Semantic color mapping — use these for consistent meaning across the app.
 *
 * `primary` was `green` (the brand color per bible §3.3). Day 6 — 2026-04-25:
 * the marketing site's "warm community" rework switched the marketing accent
 * from `green` to `grass` (a sage-leaning warmer green that reads less minty
 * / less corporate-tech). Both grass-9 and green-9 sit in the same brand
 * family; this is a tone shift, not a color change.
 *
 * `success` stays on `green` so semantic meaning (a completed booking, a
 * paid invoice) remains visually identical to the historical app. The
 * marketing surface uses `primary` exclusively for CTAs.
 */
export const SEMANTIC_COLOR = {
  primary: "grass",
  neutral: "gray",
  info: "blue",
  success: "green",
  warning: "amber",
  danger: "red",
} as const satisfies Record<string, AccentColor>;
export type SemanticColor = keyof typeof SEMANTIC_COLOR;

// ---------------------------------------------------------------------------
// Form spacing (canonical values from ENFORCEMENT-STRATEGY.md)
// ---------------------------------------------------------------------------

/**
 * Canonical spacing values for form layouts. Never hand-write these
 * numbers — always reference FORM_SPACING so the enforcement doc stays
 * the single source of truth.
 */
export const FORM_SPACING = {
  /** Gap between label text and input. Apply as `mb` on the label wrapper. */
  labelGap: "1",
  /** Gap between adjacent form fields. Apply as `mb` on each field's Box. */
  fieldGap: "3",
  /** Gap between a field and its helper/error text. Apply as `mt`. */
  helperGap: "2",
  /** Gap between the last field and the submit button. Apply as `mt` on submit. */
  submitGap: "4",
  /** Gap between logical sections inside a form. */
  sectionGap: "6",
  /** Gap between the form title and the first field. Apply as `mb` on the heading. */
  titleGap: "2",
} as const;
export type FormSpacingKey = keyof typeof FORM_SPACING;

// ---------------------------------------------------------------------------
// Responsive breakpoints
// ---------------------------------------------------------------------------

/**
 * Breakpoint values in pixels. These mirror Radix Themes' responsive prefixes:
 * `initial` (<520), `xs` (520), `sm` (768), `md` (1024), `lg` (1280), `xl` (1640).
 *
 * Use responsive prop objects on Radix components:
 * ```tsx
 * <Box p={{ initial: "2", md: "4", lg: "6" }} />
 * <Grid columns={{ initial: "1", sm: "2", lg: "3" }} />
 * ```
 */
export const BREAKPOINTS = {
  initial: 0,
  xs: 520,
  sm: 768,
  md: 1024,
  lg: 1280,
  xl: 1640,
} as const;
export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Utility type for responsive Radix props. Example:
 * ```ts
 * type ColumnsProp = Responsive<"1" | "2" | "3">;
 * ```
 */
export type Responsive<T> = T | Partial<Record<Breakpoint, T>>;

// ---------------------------------------------------------------------------
// Radius scale
// ---------------------------------------------------------------------------

export const RADIUS = ["none", "small", "medium", "large", "full"] as const;
export type Radius = (typeof RADIUS)[number];

// ---------------------------------------------------------------------------
// Weight scale
// ---------------------------------------------------------------------------

export const TEXT_WEIGHT = ["light", "regular", "medium", "bold"] as const;
export type TextWeight = (typeof TEXT_WEIGHT)[number];
