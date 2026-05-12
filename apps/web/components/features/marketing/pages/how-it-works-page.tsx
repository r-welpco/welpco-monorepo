import Link from "next/link";
import { HowItWorks } from "../sections/how-it-works";
import { BecomeWelperCTA } from "../sections/become-welper-cta";
import { MarqueeBand } from "../sections/marquee-band";
import { MarketingImage } from "../shared/marketing-image";

/**
 * HowItWorksPage — onboarding deep-dive.
 *
 * Faithful port of `.design-reference/project/components/pages.jsx` `HowItWorksPage`.
 * Chrome (TopNav + Footer) lives in the (marketing) layout.
 */

const STEPS: [string, string][] = [
  ["Sign up & build a profile", "Add your experience, the services you provide, and what you charge."],
  ["Pass a background check", "Required for adult Welpers — keeps customers confident, keeps Welpers credible."],
  ["Set your availability", "You tell us when you work. Part-time, full-time, weekends, evenings — all welcome."],
  ["Accept your first booking", "Browse incoming requests, accept what fits, and meet your first neighbor."],
  ["Get paid, get reviewed", "3–5 business days after each completed job. Reviews build your profile over time."],
];

export function HowItWorksPage() {
  return (
    <>
      <section className="section">
        <div className="container">
          <div className="eyebrow">— How it works</div>
          <h1 style={{ marginTop: 16, maxWidth: 1100 }}>
            How Welpco <span className="display-italic">works.</span>
          </h1>
          <p
            style={{
              marginTop: 24,
              fontSize: 19,
              color: "var(--fg-muted)",
              maxWidth: 640,
              lineHeight: 1.55,
            }}
          >
            Two flows — booking and providing. Both take three steps.
          </p>
        </div>
      </section>
      <HowItWorks />

      {/* Welper deep dive */}
      <section className="section">
        <div className="container">
          <div
            data-grid="howitworks-page-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 56,
              alignItems: "center",
            }}
          >
            <div>
              <div className="eyebrow">— Become a Welper</div>
              <h2 style={{ marginTop: 14 }}>
                What it takes to <span className="display-italic">join the community.</span>
              </h2>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "32px 0 0",
                  display: "grid",
                  gap: 16,
                }}
              >
                {STEPS.map(([t, b], i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      gap: 18,
                      padding: "16px 0",
                      borderTop: "1px solid var(--line)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        letterSpacing: "0.14em",
                        color: "var(--fg-faint)",
                        flex: "0 0 30px",
                      }}
                    >
                      0{i + 1}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 17 }}>{t}</div>
                      <div
                        style={{
                          fontSize: 14,
                          color: "var(--fg-muted)",
                          marginTop: 4,
                          lineHeight: 1.55,
                        }}
                      >
                        {b}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <Link href="/welper/onboarding" className="btn btn-primary" style={{ marginTop: 32 }}>
                Start your Welper profile <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div style={{ display: "grid", gap: 18 }}>
              <MarketingImage
                src="/marketing/how-it-works-onboarding.jpg"
                alt="Welper completing profile signup on a laptop"
                ratio="4 / 3"
                radius="var(--radius-md)"
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                <MarketingImage
                  src="/marketing/how-it-works-profile.jpg"
                  alt="Friendly professional headshot for a Welper profile"
                  ratio="1 / 1"
                  radius="var(--radius-md)"
                />
                <MarketingImage
                  src="/marketing/how-it-works-verification.jpg"
                  alt="Identity and background check verification documents"
                  ratio="1 / 1"
                  radius="var(--radius-md)"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <BecomeWelperCTA />
      <MarqueeBand />
    </>
  );
}
