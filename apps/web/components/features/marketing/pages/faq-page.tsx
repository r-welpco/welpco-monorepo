"use client";

import { useState } from "react";

/**
 * FAQPage — full Welper + Customer questions, sticky group headings.
 *
 * Faithful port of `.design-reference/project/components/pages.jsx` `FAQPage`.
 * Chrome (TopNav + Footer) lives in the (marketing) layout.
 */

const GROUPS = [
  {
    label: "For Welpers",
    tone: "spring" as const,
    items: [
      [
        "How can I become a Welper?",
        "Sign up via our website or app and create your profile. Include your experience, the services you'll provide, and your rates.",
      ],
      [
        "Why do I need a background check?",
        "Welpco identifies itself as a safe and user-friendly platform. A background check gives our customers ease of mind when having a Welper enter their home or property.",
      ],
      [
        "How do I get paid?",
        "Once the job is complete, you'll confirm with the customer and they'll confirm via the app or website to release payment. Payments process to your account in 3–5 business days.",
      ],
      [
        "Can a minor sign up as a Welper?",
        "Yes. Minors over the age of 14 can become a Welper, however their account must be created and managed by a legal guardian. Minors are not subjected to a background check.",
      ],
      [
        "What if a customer refuses to pay?",
        "They'd need a valid reason and discuss it with you. If you can't resolve it together, contact us directly — we'll review the facts from both parties.",
      ],
    ] as [string, string][],
  },
  {
    label: "For Customers",
    tone: "pink" as const,
    items: [
      [
        "How do I sign up to use your services?",
        "Use our website or app — you can start searching the services you need within your community right away.",
      ],
      [
        "When and how do I pay for a service?",
        "When a booking is confirmed, you complete the payment. We hold the money until the job is done; once you confirm, we release payment to the Welper.",
      ],
      [
        "What if a Welper does an unsatisfactory job?",
        "Discuss it with them first. If you can't resolve it, contact us directly — we'll determine if a refund or credit is warranted, and any disciplinary action. You can also rate the job, which appears on the Welper's profile.",
      ],
      [
        "How do I know having a Welper on my property is safe?",
        "Welpers pass a background check during sign-up to ensure the integrity of the work they provide. You can also see ratings and reviews on every profile.",
      ],
      [
        "What if there's a service I need that isn't offered?",
        "Post a job description on the platform — Welpers will contact you if they're willing and able. You can also reach us via Contact us.",
      ],
      [
        "What if I contact a Welper outside the platform?",
        "We'd advise against it. Off-platform contact isn't covered by Welpco and we can't support issues that arise. All on-platform messaging is logged for transparency, and on-platform payments are secure.",
      ],
    ] as [string, string][],
  },
];

const TONE_BG: Record<"spring" | "pink", string> = {
  spring: "var(--spring-soft)",
  pink: "var(--bubblegum)",
};

export function FAQPage() {
  const [open, setOpen] = useState<{ g: number; i: number }>({ g: 0, i: 0 });

  return (
    <>
      <section className="section">
        <div className="container">
          <div className="eyebrow">— FAQ</div>
          <h1 style={{ marginTop: 16, maxWidth: 1100 }}>
            Frequently asked <span className="display-italic">questions.</span>
          </h1>
        </div>
      </section>

      {GROUPS.map((g, gi) => (
        <section
          key={gi}
          className="section-tight"
          style={{ background: gi % 2 ? "var(--bg-soft)" : "var(--bg)" }}
        >
          <div className="container">
            <div
              data-grid="faq-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "0.7fr 1.3fr",
                gap: 64,
                alignItems: "flex-start",
              }}
            >
              <div data-sticky="faq-side" style={{ position: "sticky", top: 100 }}>
                <div
                  style={{
                    display: "inline-flex",
                    padding: "8px 14px",
                    borderRadius: 999,
                    background: TONE_BG[g.tone],
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--evergreen)",
                  }}
                >
                  {g.label}
                </div>
                <h2 style={{ marginTop: 24, fontSize: "clamp(36px, 4vw, 56px)" }}>
                  {g.label === "For Welpers" ? (
                    <>
                      About <span className="display-italic">Welping.</span>
                    </>
                  ) : (
                    <>
                      About <span className="display-italic">booking.</span>
                    </>
                  )}
                </h2>
              </div>
              <div>
                {g.items.map(([q, a], i) => {
                  const isOpen = open.g === gi && open.i === i;
                  const id = `faq-${gi}-${i}`;
                  return (
                    <div
                      key={i}
                      style={{
                        borderTop: "1px solid var(--line)",
                        borderBottom: i === g.items.length - 1 ? "1px solid var(--line)" : "none",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setOpen(isOpen ? { g: -1, i: -1 } : { g: gi, i })}
                        aria-expanded={isOpen}
                        aria-controls={id}
                        id={`${id}-button`}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "22px 0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 24,
                          color: "var(--fg)",
                          fontFamily: "var(--font-display)",
                          fontSize: 22,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {q}
                        <span
                          aria-hidden="true"
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: isOpen ? "var(--accent)" : "var(--pill-bg)",
                            color: "var(--evergreen)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flex: "0 0 auto",
                            fontSize: 16,
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
                            paddingBottom: 22,
                            fontSize: 16,
                            color: "var(--fg-muted)",
                            lineHeight: 1.6,
                            maxWidth: 640,
                          }}
                        >
                          {a}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      ))}

      <section className="section">
        <div className="container">
          <div
            data-section="faq-cta"
            style={{
              background: "var(--evergreen)",
              color: "var(--cream)",
              borderRadius: "var(--radius-xl)",
              padding: "56px 48px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 32,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h3 style={{ color: "var(--cream)", fontSize: 32 }}>Still have questions?</h3>
              <p style={{ color: "rgba(250,241,229,0.78)", marginTop: 8 }}>
                We respond within 48 hours.
              </p>
            </div>
            <a href="/contact" className="btn btn-accent">
              Contact us →
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
