/**
 * Shared horizontal layout for immersive hero: floating pill + hero copy share the
 * same max width and left inset so copy can align with the logo (header padding-left).
 */
export const IMMERSIVE_SHELL_WIDTH = "min(980px, calc(100vw - 24px))";

/** Viewport → left edge of the pill (same as centered `50% - width/2`). */
export const IMMERSIVE_SHELL_INLINE = "max(12px, calc((100vw - min(980px, calc(100vw - 24px))) / 2))";

/** Keep in sync with header `padding-left` on `[data-hero-immersive-nav]`. */
export const IMMERSIVE_SHELL_LOGO_PAD_PX = 18;
