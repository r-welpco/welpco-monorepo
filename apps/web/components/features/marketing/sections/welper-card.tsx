import { MarketingImage } from "../shared/marketing-image";

/**
 * WelperCard — single welper preview card. Faithful port of the inline
 * `WelperCard` in `.design-reference/project/components/sections.jsx`.
 */

interface WelperCardProps {
  name: string;
  role: string;
  imageSrc: string;
  tags: string[];
  rating: number;
  jobs: number;
  area: string;
}

export function WelperCard({ name, role, imageSrc, tags, rating, jobs, area }: WelperCardProps) {
  return (
    <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
      <MarketingImage
        src={imageSrc}
        alt={`${name}, ${role}`}
        ratio="1 / 1"
        radius="var(--radius-md)"
        sizes="(max-width: 1100px) 50vw, 25vw"
      />
      <div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
          <h4 style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>{name}</h4>
          <div style={{ display: "flex", gap: 4, alignItems: "center", fontSize: 13 }}>
            <svg width="13" height="13" viewBox="0 0 12 12" aria-hidden="true">
              <path
                d="M6 1l1.5 3 3.5.5-2.5 2.4.6 3.4L6 8.6 2.9 10.3l.6-3.4L1 4.5 4.5 4z"
                fill="var(--accent)"
                stroke="var(--evergreen)"
                strokeWidth="0.6"
              />
            </svg>
            <span style={{ fontWeight: 600 }}>{rating}</span>
          </div>
        </div>
        <div style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 4 }}>{role}</div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--fg-faint)",
            marginTop: 8,
            letterSpacing: "0.06em",
          }}
        >
          {area} · {jobs} jobs
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {tags.map((t) => (
            <span
              key={t}
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                fontSize: 11,
                background: "var(--pill-bg)",
                color: "var(--fg-muted)",
                border: "1px solid var(--line)",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
