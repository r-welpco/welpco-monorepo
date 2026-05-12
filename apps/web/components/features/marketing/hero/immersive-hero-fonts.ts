/**
 * Immersive hero headline font options — maps to CSS variables from
 * `(marketing)/layout.tsx` (`next/font/local` + Google fonts).
 */
export type ImmersiveHeroHeadlineFont =
  | "display"
  | "body"
  | "mono"
  | "plusJakarta"
  | "uncutSans";

export const IMMERSIVE_HEADLINE_FONT_LABEL: Record<ImmersiveHeroHeadlineFont, string> = {
  display: "Fraunces",
  body: "Inter Tight",
  mono: "JetBrains Mono",
  plusJakarta: "Plus Jakarta Sans",
  uncutSans: "Uncut Sans",
};

/** `font-family` stacks for the hero headline (and immersive floating nav). */
export const IMMERSIVE_HEADLINE_FONT_CSS: Record<ImmersiveHeroHeadlineFont, string> = {
  display: "var(--font-display), Georgia, serif",
  body: "var(--font-body), system-ui, sans-serif",
  mono: "var(--font-mono), ui-monospace, monospace",
  plusJakarta: "var(--font-plus-jakarta), system-ui, sans-serif",
  uncutSans: "var(--font-uncut-sans), system-ui, sans-serif",
};

/** Italic line for Plus Jakarta uses the dedicated italic variable font. */
export function immersiveHeadlineItalicFont(font: ImmersiveHeroHeadlineFont): string {
  if (font === "plusJakarta") return "var(--font-plus-jakarta-italic), system-ui, sans-serif";
  return IMMERSIVE_HEADLINE_FONT_CSS[font];
}

export function isImmersiveHeadlineFont(value: unknown): value is ImmersiveHeroHeadlineFont {
  return (
    value === "display" ||
    value === "body" ||
    value === "mono" ||
    value === "plusJakarta" ||
    value === "uncutSans"
  );
}
