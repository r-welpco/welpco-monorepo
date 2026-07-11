import Image from "next/image";
import { SectionHeader } from "./section-header";

/**
 * Testimonials — three-up reviews card grid.
 *
 * Faithful port of `.design-reference/project/components/sections.jsx` `Testimonials`.
 *
 * ⚠️ PLACEHOLDER CONTENT — DO NOT RENDER.
 * Every quote below is fabricated design-bundle filler and contradicts the
 * live product: "Eli, 16" is a minor (sign-up hard-rejects under-18 welpers),
 * and Brooklyn / Queens / Long Island are US locations (Welpco is
 * Canada-only). This component is intentionally not mounted anywhere.
 * It MUST NOT be added to any page until these ITEMS are replaced with
 * real, consented quotes from actual Canadian users.
 */

const ITEMS = [
  {
    quote:
      "Booked a babysitter on 30 minutes’ notice. Two blocks away, fully vetted. Now a regular Wednesday booking.",
    name: "Sarah W.",
    role: "Customer · Brooklyn",
    avatarSrc: "/marketing/testimonial-sarah-w.jpg",
    avatarAlt: "Sarah W.",
  },
  {
    quote:
      "My first job. I set the schedule, I set the rates, and the platform handles the rest. Better than a part-time gig.",
    name: "Eli, 16",
    role: "Welper · Queens",
    avatarSrc: "/marketing/testimonial-eli.jpg",
    avatarAlt: "Eli",
  },
  {
    quote:
      "Retired three years ago. Welping fills the calendar with work I actually enjoy — and supplements the pension.",
    name: "Frank D.",
    role: "Welper · Long Island",
    avatarSrc: "/marketing/testimonial-frank-d.jpg",
    avatarAlt: "Frank D.",
  },
];

export function Testimonials() {
  return (
    <section className="section" style={{ background: "var(--bg-soft)" }}>
      <div className="container">
        <SectionHeader
          eyebrow="Reviews"
          title={
            <>
              From customers <span className="display-italic">and Welpers.</span>
            </>
          }
        />
        <div
          data-grid="testimonials-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
            marginTop: 56,
          }}
        >
          {ITEMS.map((t, i) => (
            <figure
              key={i}
              className="card"
              style={{
                padding: 32,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: 24,
                minHeight: 320,
              }}
            >
              <svg width="36" height="28" viewBox="0 0 36 28" fill="none" aria-hidden="true">
                <path
                  d="M14 2H4v12h6c0 4-2 7-6 8v4c8-1 12-6 12-14V2zm18 0H22v12h6c0 4-2 7-6 8v4c8-1 12-6 12-14V2z"
                  fill="var(--accent)"
                />
              </svg>
              <blockquote
                style={{
                  margin: 0,
                  fontFamily: "var(--font-display)",
                  fontSize: 22,
                  lineHeight: 1.35,
                  color: "var(--fg)",
                }}
              >
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption
                style={{
                  marginTop: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  paddingTop: 20,
                  borderTop: "1px solid var(--line)",
                }}
              >
                <Image
                  src={t.avatarSrc}
                  alt={t.avatarAlt}
                  width={40}
                  height={40}
                  style={{ borderRadius: "50%", objectFit: "cover" }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
