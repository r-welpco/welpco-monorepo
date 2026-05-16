"use client";

import { useState } from "react";

/**
 * FAQPage — full Welper + Customer questions, sticky group headings.
 */

type FaqAnswer = string | string[];

type FaqItem = [question: string, answer: FaqAnswer];

const GROUPS: {
  label: string;
  tone: "spring" | "pink";
  items: FaqItem[];
}[] = [
  {
    label: "For Welpers",
    tone: "spring",
    items: [
      [
        "How can I become a Welper?",
        "To become a Welper, simply sign up via our website or app and create your profile. You can include your experience and the type of services you provide. You will also need to choose the amount you will charge for the service(s) you will provide.",
      ],
      [
        "Why do I need a background check?",
        "Welpco identifies itself as a safe and user-friendly platform. We want to ensure, to the best of our ability, that our platform is a safe environment for our customers. A background check gives our customers the ease of mind they require when having a Welper enter their home and/or their property. If you pass the background check, you will receive a certified badge on your profile. If you fail the background check, you will not receive a certified badge on your profile, but you will still be able to be a Welper.",
      ],
      [
        "How do I get paid?",
        [
          "Once the job is completed, the Welper will confirm \"Job Done\" through the app or website. A receipt will automatically be sent to the customer, and the payment process will then be finalized.",
          "Welpers receive their payouts on a weekly basis, every Friday of the following week.",
          "Example: If you begin completing jobs on Monday and continue working throughout that week, you will receive payment on the Friday of the following week, and so on.",
          "When creating your profile, you will also need to set up your own Stripe account in order to receive your weekly payouts.",
          "Once your payout becomes available in your Stripe account, you can manually transfer your funds to your bank account at no cost.",
        ],
      ],
      [
        "Can a minor sign up as a Welper?",
        "Minors over the age of 14 can become a Welper via our platform, however, their account must be created and managed by a legal guardian. Welpers who are minors will not be subjected to a background check.",
      ],
      [
        "What happens if a customer refuses to pay for the service they received?",
        "If a customer refuses to pay for the service you provided, they would need to have a valid reason, and they would need to discuss it with you to see if you can resolve the issue. If the issue cannot be resolved between the Welper and the customer, they will need to contact us directly, so we can determine the issue and resolve it based on the facts provided to us by both parties.",
      ],
    ],
  },
  {
    label: "For Customers",
    tone: "pink",
    items: [
      [
        "How do I sign up to use your services?",
        "To sign up, simply use our website or app. You can then get started searching for the service you need being offered within your community.",
      ],
      [
        "When and how do I pay for a service?",
        "When a booking is confirmed between yourself and a Welper, you will complete the payment, but we will hold the money until the job is completed. Once the job is completed, you will confirm via the website or app that the job is completed and we will then release payment to the Welper for the service they provided.",
      ],
      [
        "What happens if a Welper does an unsatisfactory job?",
        "If a Welper does an unsatisfactory job, discuss with them the issue you have with the job they did. If it cannot be resolved between both parties, please contact us directly and we will determine the outcome, whether or not, a refund or credit will be issued to you and if any disciplinary actions need to be taken in regards to the Welper using our platform. There is also a rating system, so you can rate the job provided by the Welper, which will also appear in their profile.",
      ],
      [
        "How do I know that allowing a Welper on my property, or in my home, is safe?",
        "Welpco prides itself on providing a safe and secure environment for both our customers and our Welpers. Welpers will need to pass a background check during sign up to insure the integrity of the work they will provide. Welpers who pass their background check, will have a certified badge on their profile. Welpers who are minors, will not need to complete a background check, so their profiles will display a \"Minor badge\".",
      ],
      [
        "What if there is a service I need that I don't see offered on the platform?",
        "If there is a service you need that you don't see offered on our platform, you can post the job description you need in the job postings section on our platform and Welpers will contact you if they are able and willing to do the job. You can also contact us directly via our \"Contact us\" page.",
      ],
      [
        "What happens if I contact a Welper for services outside of the platform?",
        "Contacting a Welper outside of our platform can lead to many issues and an unsafe environment. You will not be secure and any contact made outside of the platform with a Welper that was not made during the completion of a task will not be permitted by Welpco; thus we will provide no assistance with any issues that may arise. Welpers via our platform are vetted and any communication you have with them will be conducted via our platform's messenger system to insure a respectful and transparent exchange of information. Transactions made via our platform are also secure and we offer our support for any questions or concerns you may have.",
      ],
    ],
  },
];

const TONE_BG: Record<"spring" | "pink", string> = {
  spring: "var(--spring-soft)",
  pink: "var(--bubblegum)",
};

function FaqAnswerBody({ answer }: { answer: FaqAnswer }) {
  const parts = Array.isArray(answer) ? answer : [answer];
  return (
    <div style={{ paddingBottom: 22 }}>
      {parts.map((paragraph, index) => (
        <p
          key={index}
          style={{
            margin: index === 0 ? 0 : "12px 0 0",
            fontSize: 16,
            color: "var(--fg-muted)",
            lineHeight: 1.6,
            maxWidth: 640,
          }}
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}

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
                        <FaqAnswerBody answer={a} />
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
