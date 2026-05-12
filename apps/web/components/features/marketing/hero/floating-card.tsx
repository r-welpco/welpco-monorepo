import type { CSSProperties } from "react";

/**
 * FloatingCard — overlay card with avatar, name, role, rating.
 *
 * Faithful port of `.design-reference/project/components/hero.jsx` `FloatingCard`.
 */

type Avatar = "green" | "yellow" | "pink" | "mint";

interface FloatingCardProps {
  avatar?: Avatar;
  name: string;
  role: string;
  rating: number;
  reviews: number;
  style?: CSSProperties;
}

const TONES: Record<Avatar, string> = {
  green: "var(--spring-soft)",
  yellow: "var(--pastel-yellow)",
  pink: "var(--bubblegum)",
  mint: "var(--mint)",
};

export function FloatingCard({
  avatar = "green",
  name,
  role,
  rating,
  reviews,
  style,
}: FloatingCardProps) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-md)",
        padding: 14,
        boxShadow: "var(--shadow-md)",
        display: "flex",
        gap: 12,
        alignItems: "center",
        ...style,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: TONES[avatar],
          backgroundImage: "repeating-linear-gradient(135deg, transparent 0 6px, rgba(0,73,47,0.10) 6px 7px)",
          flex: "0 0 auto",
        }}
      />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--fg)" }}>{name}</div>
        <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>{role}</div>
        <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 4, fontSize: 12 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path
              d="M6 1l1.5 3 3.5.5-2.5 2.4.6 3.4L6 8.6 2.9 10.3l.6-3.4L1 4.5 4.5 4z"
              fill="var(--accent)"
              stroke="var(--evergreen)"
              strokeWidth="0.6"
            />
          </svg>
          <span style={{ fontWeight: 600, color: "var(--fg)" }}>{rating}</span>
          <span style={{ color: "var(--fg-faint)" }}>({reviews})</span>
        </div>
      </div>
    </div>
  );
}
