import type { CSSProperties, ReactNode } from "react";

/**
 * Placeholder — striped colored block with a mono caption pill.
 *
 * Faithful port of `.design-reference/project/components/shared.jsx` `Placeholder`.
 * All seven `tone` values (cream / green / spring / mint / yellow / pink / lilac)
 * render as in the bundle.
 */

type Tone = "cream" | "green" | "spring" | "mint" | "yellow" | "pink" | "lilac";

interface PlaceholderProps {
  caption?: string;
  ratio?: string;
  tone?: Tone;
  radius?: string;
  children?: ReactNode;
  style?: CSSProperties;
}

const TONES: Record<Tone, { bg: string; stripe: string; fg: string }> = {
  cream: { bg: "var(--card-2)", stripe: "rgba(0,73,47,0.10)", fg: "var(--fg-muted)" },
  green: { bg: "var(--evergreen)", stripe: "rgba(250,241,229,0.10)", fg: "rgba(250,241,229,0.65)" },
  spring: { bg: "var(--spring-soft)", stripe: "rgba(0,73,47,0.14)", fg: "rgba(0,73,47,0.7)" },
  mint: { bg: "var(--mint)", stripe: "rgba(0,73,47,0.10)", fg: "rgba(0,73,47,0.7)" },
  yellow: { bg: "var(--pastel-yellow)", stripe: "rgba(0,73,47,0.10)", fg: "rgba(0,73,47,0.7)" },
  pink: { bg: "var(--bubblegum)", stripe: "rgba(101,29,50,0.10)", fg: "rgba(101,29,50,0.7)" },
  lilac: { bg: "var(--lilac)", stripe: "rgba(60,16,83,0.10)", fg: "rgba(60,16,83,0.7)" },
};

export function Placeholder({
  caption = "IMAGE",
  ratio = "4 / 5",
  tone = "cream",
  radius = "var(--radius-md)",
  children,
  style,
}: PlaceholderProps) {
  const t = TONES[tone];
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: ratio,
        background: t.bg,
        backgroundImage: `repeating-linear-gradient(135deg, transparent 0 14px, ${t.stripe} 14px 15px)`,
        borderRadius: radius,
        overflow: "hidden",
        display: "flex",
        alignItems: "flex-end",
        ...style,
      }}
    >
      {children}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: t.fg,
            padding: "6px 12px",
            background: "rgba(0,0,0,0.04)",
            borderRadius: 999,
            backdropFilter: "blur(2px)",
          }}
        >
          {caption}
        </div>
      </div>
    </div>
  );
}
