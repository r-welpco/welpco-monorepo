"use client";

import { useState } from "react";
import { SectionHeader } from "./section-header";

/**
 * HowItWorks — Customer ↔ Welper toggle, three steps each side.
 *
 * Faithful port of `.design-reference/project/components/sections.jsx` `HowItWorks`.
 */

const CUSTOMER_STEPS = [
  {
    n: "01",
    title: "Search nearby",
    body: "Enter the service you need and your zip code. Browse vetted Welpers in your area in seconds.",
  },
  {
    n: "02",
    title: "Book & schedule",
    body: "Pick a Welper, set a time, and confirm. Pay securely — funds are held until the job is complete.",
  },
  {
    n: "03",
    title: "Confirm & rate",
    body: "Welper confirms the job is done and submits end time. Payment is taken and the customer is sent the final invoice. Leave a rating for the Welper, which helps keep the platform accountable.",
  },
];

const WELPER_STEPS = [
  {
    n: "01",
    title: "Build your profile",
    body: "Sign up, list your services, set your rates and weekly availability. Adults complete a background check.",
  },
  {
    n: "02",
    title: "Accept jobs that fit",
    body: "Get matched with requests that match your skills and schedule. Part-time, full-time, or occasional — your call.",
  },
  {
    n: "03",
    title: "Get paid",
    body: "Welper confirms job is complete and submits end time. Invoice is sent to the customer and payment is taken. Welpco transfers weekly payouts to Welper’s Stripe account the following week on the Friday.",
  },
];

export function HowItWorks() {
  const [tab, setTab] = useState<"customer" | "welper">("customer");
  const steps = tab === "customer" ? CUSTOMER_STEPS : WELPER_STEPS;

  return (
    <section className="section" id="how" style={{ background: "var(--bg-soft)" }}>
      <div className="container">
        <SectionHeader
          eyebrow="How it works"
          title={
            <>
              Three steps. <span className="display-italic">No friction.</span>
            </>
          }
          subtitle="Whether you’re booking a service or providing one, getting started takes minutes."
          cta={
            <div
              style={{
                display: "inline-flex",
                padding: 4,
                background: "var(--pill-bg)",
                borderRadius: 999,
                border: "1px solid var(--line)",
              }}
            >
              {(
                [
                  { id: "customer", label: "I need help" },
                  { id: "welper", label: "I want to Welp" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 999,
                    border: "none",
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    fontSize: 14,
                    cursor: "pointer",
                    background: tab === t.id ? "var(--fg)" : "transparent",
                    color: tab === t.id ? "var(--bg)" : "var(--fg-muted)",
                    transition: "all 160ms ease",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          }
        />
        <div
          data-grid="howitworks-steps"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
            marginTop: 64,
          }}
        >
          {steps.map((s) => (
            <div key={s.n} className="card" style={{ padding: 28, position: "relative" }}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: 80,
                  color: "var(--accent)",
                  lineHeight: 0.9,
                }}
              >
                {s.n}
              </div>
              <h3 style={{ fontSize: 28, marginTop: 16 }}>{s.title}</h3>
              <p
                style={{
                  marginTop: 12,
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: "var(--fg-muted)",
                }}
              >
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
