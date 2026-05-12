/**
 * Wordmark — italic Fraunces 500 + green-9 dot bullet.
 *
 * Faithful port of `.design-reference/project/components/shared.jsx` `Wordmark`.
 * The dot uses the size-relative pattern from the bundle (0.42 × `size`).
 *
 * Note: this is intentionally different from our existing brand mark used in
 * `app/(marketing)/`. The bundle's wordmark IS the brand mark for this
 * surface — see `components/features/marketing/CLAUDE.md`.
 */

interface WordmarkProps {
  size?: number;
  color?: string;
}

export function Wordmark({ size = 22, color }: WordmarkProps) {
  return (
    <span
      style={{
        fontFamily: "var(--font-display)",
        fontStyle: "italic",
        fontWeight: 500,
        fontSize: size,
        letterSpacing: "-0.03em",
        color: color || "var(--fg)",
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: size * 0.42,
          height: size * 0.42,
          borderRadius: "50%",
          background: "var(--accent)",
          marginRight: 2,
        }}
      />
      Welpco
    </span>
  );
}
