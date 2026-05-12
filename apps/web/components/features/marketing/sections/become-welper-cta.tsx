import Link from "next/link";
import { MarketingImage } from "../shared/marketing-image";

/**
 * BecomeWelperCTA — provider-side recruiting block.
 *
 * Faithful port of `.design-reference/project/components/sections.jsx` `BecomeWelperCTA`.
 */

const POINTS = [
  "Pick the services that match your skills",
  "Set your own rates and weekly availability",
  "Get paid 3–5 business days after each job",
  "Build a profile, ratings, and a regular client base",
];

export function BecomeWelperCTA() {
  return (
    <section className="section">
      <div className="container">
        <div
          data-grid="becomewelper-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 56,
            alignItems: "center",
            padding: "24px 0",
          }}
        >
          <div style={{ position: "relative" }}>
            <div data-grid="becomewelper-images" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <MarketingImage
                src="/marketing/become-welper-lawncare.jpg"
                alt="Welper providing lawn care in a neighborhood yard"
                ratio="3 / 4"
                radius="var(--radius-md)"
              />
              <div style={{ display: "grid", gap: 16, marginTop: 32 }}>
                <MarketingImage
                  src="/marketing/become-welper-baking.jpg"
                  alt="Welper baking in a home kitchen"
                  ratio="1 / 1"
                  radius="var(--radius-md)"
                />
                <MarketingImage
                  src="/marketing/become-welper-tutoring.jpg"
                  alt="Welper tutoring a student at home"
                  ratio="1 / 1"
                  radius="var(--radius-md)"
                />
              </div>
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 18 }}>
              — For service providers
            </div>
            <h2>
              Set your rates.
              <br />
              <span className="display-italic">Set your hours.</span>
            </h2>
            <p
              style={{
                marginTop: 20,
                fontSize: 17,
                color: "var(--fg-muted)",
                lineHeight: 1.6,
                maxWidth: 480,
              }}
            >
              A first job, a flexible side income, or a structured way to use free time in retirement — Welping fits around your life. You decide what you offer, when you work, and what you charge.
            </p>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "28px 0 0",
                display: "grid",
                gap: 14,
              }}
            >
              {POINTS.map((s) => (
                <li
                  key={s}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    fontSize: 15,
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "var(--accent)",
                      color: "var(--evergreen)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      flex: "0 0 auto",
                      marginTop: 1,
                    }}
                  >
                    ✓
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
            <div style={{ display: "flex", gap: 12, marginTop: 36, flexWrap: "wrap" }}>
              <Link href="/welper/onboarding" className="btn btn-primary">
                Become a Welper <span aria-hidden="true">→</span>
              </Link>
              <Link href="/how-it-works" className="btn btn-ghost">
                See how Welpers get paid
              </Link>
            </div>
            <div
              style={{
                marginTop: 28,
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--fg-faint)",
              }}
            >
              Create your profile today · Welp tomorrow
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
