"use client";

import { useState } from "react";

/**
 * FAQTeaser — homepage FAQ accordion (split layout, sticky left intro).
 *
 * Faithful port of `.design-reference/project/components/sections.jsx` `FAQTeaser`.
 */

const ITEMS = [
  {
    q: "How do I become a Welper?",
    a: "Sign up via the website or app, complete your profile, list the services you provide and your rates. Adults pass a background check; minors aged 14+ sign up under a guardian-managed account.",
  },
  {
    q: "How does payment work?",
    a: "Payment is taken upfront when a booking is confirmed and held in escrow. Once you confirm the job is complete, funds are released to the Welper.",
  },
  {
    q: "What if I need a service that isn’t listed?",
    a: "Post your job description on the platform and any qualified Welper can respond. You can also reach us via the Contact page.",
  },
  {
    q: "Is it safe to have a Welper at my property?",
    a: "Adult Welpers complete background checks, all messaging stays on-platform, and two-way ratings keep accounts accountable.",
  },
];

export function FAQTeaser() {
  const [open, setOpen] = useState(0);
  return (
    <section className="section" id="faq-teaser" style={{ background: "var(--bg-soft)" }}>
      <div className="container">
        <div
          data-grid="faq-teaser-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "0.9fr 1.1fr",
            gap: 64,
            alignItems: "flex-start",
          }}
        >
          <div data-sticky="faq-teaser-side" style={{ position: "sticky", top: 100 }}>
            <div className="eyebrow" style={{ marginBottom: 18 }}>
              — FAQ
            </div>
            <h2>
              Common
              <br />
              <span className="display-italic">questions.</span>
            </h2>
            <p
              style={{
                marginTop: 18,
                fontSize: 17,
                color: "var(--fg-muted)",
                maxWidth: 380,
                lineHeight: 1.55,
              }}
            >
              On Welping, booking, payments and platform safety.
            </p>
            <a href="/faq" className="btn btn-ghost" style={{ marginTop: 28 }}>
              Read all FAQs <span>→</span>
            </a>
          </div>
          <div>
            {ITEMS.map((item, i) => {
              const isOpen = open === i;
              const id = `faq-teaser-${i}`;
              return (
                <div
                  key={i}
                  style={{
                    borderTop: "1px solid var(--line)",
                    borderBottom: i === ITEMS.length - 1 ? "1px solid var(--line)" : "none",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    aria-controls={id}
                    id={`${id}-button`}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "24px 0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 24,
                      color: "var(--fg)",
                      fontFamily: "var(--font-display)",
                      fontSize: 24,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {item.q}
                    <span
                      aria-hidden="true"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: isOpen ? "var(--accent)" : "var(--pill-bg)",
                        color: "var(--evergreen)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 200ms ease",
                        flex: "0 0 auto",
                        fontSize: 18,
                      }}
                    >
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  <div
                    id={id}
                    role="region"
                    aria-labelledby={`${id}-button`}
                    data-faq-answer
                    hidden={!isOpen}
                    style={{
                      overflow: "hidden",
                    }}
                  >
                    <p
                      style={{
                        paddingBottom: 24,
                        fontSize: 16,
                        color: "var(--fg-muted)",
                        lineHeight: 1.6,
                        maxWidth: 620,
                      }}
                    >
                      {item.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
