import type { ReactNode } from "react";

/**
 * SectionHeader — eyebrow + title + optional subtitle/cta.
 *
 * Faithful port of `.design-reference/project/components/sections.jsx` `SectionHeader`.
 */

interface SectionHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "left" | "center";
  cta?: ReactNode;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "left",
  cta,
}: SectionHeaderProps) {
  return (
    <div
      data-section-header
      style={{
        display: "flex",
        alignItems: align === "left" ? "flex-end" : "center",
        justifyContent: "space-between",
        gap: 32,
        flexWrap: "wrap",
        textAlign: align,
      }}
    >
      <div style={{ maxWidth: 720 }}>
        {eyebrow && (
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            — {eyebrow}
          </div>
        )}
        <h2>{title}</h2>
        {subtitle && (
          <p
            style={{
              marginTop: 18,
              fontSize: 18,
              color: "var(--fg-muted)",
              maxWidth: 580,
              lineHeight: 1.55,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {cta}
    </div>
  );
}
