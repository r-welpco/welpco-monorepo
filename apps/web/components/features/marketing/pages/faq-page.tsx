"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * FAQPage — full Welper + Customer questions, sticky group headings.
 */

type FaqListItem = string | { lead: string; items: string[] };

type FaqList = {
  ordered?: boolean;
  items: FaqListItem[];
};

type FaqAnswerNode = string | FaqList;

type FaqAnswer = string | FaqAnswerNode[];

type FaqItem = [question: string, answer: FaqAnswer];

function isFaqList(node: FaqAnswerNode): node is FaqList {
  return typeof node === "object" && node !== null && Array.isArray((node as FaqList).items);
}

type FaqGroup = {
  label: string;
  heading: string;
  headingItalic: string;
  items: FaqItem[];
};

const GROUP_TONES = ["spring", "pink"] as const;

const TONE_BG: Record<(typeof GROUP_TONES)[number], string> = {
  spring: "var(--spring-soft)",
  pink: "var(--bubblegum)",
};

const ANSWER_TEXT_STYLE = {
  fontSize: 16,
  color: "var(--fg-muted)",
  lineHeight: 1.6,
  maxWidth: 640,
} as const;

function FaqRichList({ list, depth = 0 }: { list: FaqList; depth?: number }) {
  const ListTag = list.ordered ? "ol" : "ul";
  return (
    <ListTag
      style={{
        margin: "12px 0 0",
        paddingLeft: 24,
        ...ANSWER_TEXT_STYLE,
        listStyleType: list.ordered ? "decimal" : "disc",
      }}
    >
      {list.items.map((item, index) => {
        if (typeof item === "string") {
          return (
            <li key={index} style={{ marginBottom: 6 }}>
              {item}
            </li>
          );
        }
        return (
          <li key={index} style={{ marginBottom: 6 }}>
            {item.lead}
            <FaqRichList list={{ ordered: false, items: item.items }} depth={depth + 1} />
          </li>
        );
      })}
    </ListTag>
  );
}

function FaqAnswerBody({ answer }: { answer: FaqAnswer }) {
  const parts: FaqAnswerNode[] = Array.isArray(answer) ? answer : [answer];
  return (
    <div style={{ paddingBottom: 22 }}>
      {parts.map((node, index) => {
        if (typeof node === "string") {
          return (
            <p
              key={index}
              style={{
                margin: index === 0 ? 0 : "12px 0 0",
                ...ANSWER_TEXT_STYLE,
              }}
            >
              {node}
            </p>
          );
        }
        if (isFaqList(node)) {
          return <FaqRichList key={index} list={node} />;
        }
        return null;
      })}
    </div>
  );
}

export function FAQPage() {
  const t = useTranslations("marketing.faqPage");
  const groups = t.raw("groups") as FaqGroup[];
  const [open, setOpen] = useState<{ g: number; i: number }>({ g: 0, i: 0 });

  return (
    <>
      <section className="section">
        <div className="container">
          <div className="eyebrow">{t("hero.eyebrow")}</div>
          <h1 style={{ marginTop: 16, maxWidth: 1100 }}>
            {t("hero.title")} <span className="display-italic">{t("hero.titleItalic")}</span>
          </h1>
        </div>
      </section>

      {groups.map((g, gi) => {
        const tone = GROUP_TONES[gi] ?? "spring";
        return (
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
                      background: TONE_BG[tone],
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
                    {g.heading} <span className="display-italic">{g.headingItalic}</span>
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
        );
      })}

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
              <h3 style={{ color: "var(--cream)", fontSize: 32 }}>{t("cta.title")}</h3>
              <p style={{ color: "rgba(250,241,229,0.78)", marginTop: 8 }}>{t("cta.sub")}</p>
            </div>
            <Link href="/contact" className="btn btn-accent">
              {t("cta.button")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
