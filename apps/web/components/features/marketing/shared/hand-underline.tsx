/**
 * Hand-drawn-feeling underline used beneath italic display words.
 *
 * Faithful port of `.design-reference/project/components/shared.jsx` `HandUnderline`.
 */
interface HandUnderlineProps {
  color?: string;
  height?: number;
}

export function HandUnderline({ color = "var(--accent)", height = 14 }: HandUnderlineProps) {
  return (
    <svg
      viewBox="0 0 360 14"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: -6,
        width: "100%",
        height,
      }}
      aria-hidden="true"
    >
      <path
        d="M2 9 C 60 3, 120 12, 180 7 S 320 3, 358 8"
        stroke={color}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
