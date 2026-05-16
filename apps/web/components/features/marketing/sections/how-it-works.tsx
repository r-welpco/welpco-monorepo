"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SectionHeader } from "./section-header";

/**
 * HowItWorks — Customer ↔ Welper toggle, three steps each side.
 */

type Step = { n: string; title: string; body: string };

export function HowItWorks() {
  const t = useTranslations("marketing.home.howItWorks");
  const [tab, setTab] = useState<"customer" | "welper">("customer");

  const customerSteps = t.raw("customerSteps") as Step[];
  const welperSteps = t.raw("welperSteps") as Step[];
  const steps = tab === "customer" ? customerSteps : welperSteps;

  return (
    <section className="section" id="how" style={{ background: "var(--bg-soft)" }}>
      <div className="container">
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={
            <>
              {t("titleLine1")} <span className="display-italic">{t("titleLine2")}</span>
            </>
          }
          subtitle={t("subtitle")}
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
                  { id: "customer" as const, label: t("tabCustomer") },
                  { id: "welper" as const, label: t("tabWelper") },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 999,
                    border: "none",
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    fontSize: 14,
                    cursor: "pointer",
                    background: tab === item.id ? "var(--fg)" : "transparent",
                    color: tab === item.id ? "var(--bg)" : "var(--fg-muted)",
                    transition: "all 160ms ease",
                  }}
                >
                  {item.label}
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
