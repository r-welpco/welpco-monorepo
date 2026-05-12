import type { CSSProperties } from "react";

/**
 * StatBubble — circular green callout with stat + caption.
 *
 * Faithful port of `.design-reference/project/components/hero.jsx` `StatBubble`.
 */

interface StatBubbleProps {
  style?: CSSProperties;
}

export function StatBubble({ style }: StatBubbleProps) {
  return (
    <div
      style={{
        background: "var(--accent)",
        color: "var(--evergreen)",
        borderRadius: "50%",
        width: 156,
        height: 156,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        boxShadow: "var(--shadow-md)",
        transform: "rotate(-8deg)",
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 44,
          lineHeight: 1,
          fontStyle: "italic",
        }}
      >
        12k+
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          marginTop: 6,
        }}
      >
        Active Welpers
        <br />
        across the network
      </div>
    </div>
  );
}
