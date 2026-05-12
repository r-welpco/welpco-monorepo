import Link from "next/link";
import { MarketingImage } from "../shared/marketing-image";

/**
 * MinorsBanner — guardian-managed minors call-out (April 2026).
 *
 * Faithful port of `.design-reference/project/components/sections.jsx` `MinorsBanner`.
 */

export function MinorsBanner() {
  return (
    <section className="section-tight" id="minors">
      <div className="container">
        <div
          data-section="minors-banner"
          data-grid="minors-grid"
          style={{
            background: "var(--accent)",
            color: "var(--evergreen)",
            borderRadius: "var(--radius-xl)",
            padding: "56px 48px",
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: 48,
            alignItems: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: -120,
              bottom: -120,
              width: 280,
              height: 280,
              borderRadius: "50%",
              background: "var(--evergreen)",
              opacity: 0.1,
            }}
          />
          <div style={{ position: "relative" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: 999,
                background: "var(--evergreen)",
                color: "var(--cream)",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                marginBottom: 24,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--accent)",
                }}
              />
              New · April 2026
            </div>
            <h2 style={{ color: "var(--evergreen)" }}>
              Service-provider accounts
              <br />
              <span className="display-italic">for minors.</span>
            </h2>
            <p
              style={{
                marginTop: 18,
                fontSize: 17,
                color: "rgba(0,73,47,0.78)",
                maxWidth: 540,
                lineHeight: 1.55,
              }}
            >
              Welpers aged 14 and up can now sign up under a guardian-managed account. Background checks are waived; guardians review every booking.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
              <Link href="/welper/onboarding" className="btn btn-primary">
                Set up a guardian account <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/faq"
                className="btn btn-ghost"
                style={{ borderColor: "var(--evergreen)", color: "var(--evergreen)" }}
              >
                Read the FAQ
              </Link>
            </div>
          </div>
          <div style={{ position: "relative", display: "flex", justifyContent: "flex-end" }}>
            <div style={{ position: "relative", width: "100%", maxWidth: 320 }}>
              <MarketingImage
                src="/marketing/minors-guardian-teen.jpg"
                alt="Guardian and teen walking together in the neighborhood"
                ratio="4 / 5"
                radius="var(--radius-lg)"
                sizes="(max-width: 900px) 90vw, 320px"
              />
              <div
                data-floating-card
                style={{
                  position: "absolute",
                  left: -32,
                  bottom: 32,
                  background: "var(--cream)",
                  padding: 14,
                  borderRadius: 16,
                  boxShadow: "var(--shadow-md)",
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "var(--mint)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path
                      d="M9 2l5 2v5c0 3.5-2.2 6-5 7-2.8-1-5-3.5-5-7V4l5-2z"
                      stroke="var(--evergreen)"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M6.5 9l2 2 3-3"
                      stroke="var(--evergreen)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--evergreen)" }}>
                    Guardian-verified
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(0,73,47,0.6)" }}>Approved · monitored</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
