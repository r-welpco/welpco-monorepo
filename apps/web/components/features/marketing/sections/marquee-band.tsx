/**
 * MarqueeBand — auto-scrolling phrase band between sections.
 *
 * Faithful port of `.design-reference/project/components/sections.jsx` `MarqueeBand`.
 * Animation respects `prefers-reduced-motion: reduce` via the global rule
 * in `app/tokens.css`.
 */

const PHRASES = [
  "Local services on demand.",
  "Sign up today · Welp tomorrow",
  "Search · Book · Done",
  "Vetted providers in your area",
];

export function MarqueeBand() {
  const tripled = [...PHRASES, ...PHRASES, ...PHRASES];
  return (
    <div
      style={{
        background: "var(--evergreen)",
        color: "var(--cream)",
        padding: "20px 0",
        overflow: "hidden",
        borderTop: "1px solid var(--evergreen)",
        borderBottom: "1px solid var(--evergreen)",
      }}
    >
      <div
        className="welpco-marquee-row"
        aria-hidden="true"
        style={{
          display: "flex",
          gap: 48,
          whiteSpace: "nowrap",
          animation: "welpco-marquee 32s linear infinite",
          willChange: "transform",
        }}
      >
        {tripled.map((p, i) => (
          <span
            key={i}
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: 36,
              color: "var(--cream)",
              display: "inline-flex",
              alignItems: "center",
              gap: 48,
            }}
          >
            {p}
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="10" cy="10" r="4" fill="var(--accent)" />
            </svg>
          </span>
        ))}
      </div>
    </div>
  );
}
