"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Field } from "./field";

/**
 * ContactPage — contact form with role chips + response-time card.
 */

type SubmitState = "idle" | "submitting" | "success" | "error";

export function ContactPage() {
  const t = useTranslations("marketing.contactPage");
  const contactInfo = t.raw("info") as { l: string; v: string }[];
  const roles = t.raw("form.roles") as string[];

  const [type, setType] = useState(roles[0] ?? "");
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "submitting") return;

    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      role: type,
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      message: String(data.get("message") ?? ""),
    };

    setState("submitting");
    setErrorMsg(null);

    const endpoint = process.env.NEXT_PUBLIC_CONTACT_ENDPOINT;

    try {
      if (endpoint) {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Contact API responded ${res.status}`);
      } else {
        await new Promise((r) => setTimeout(r, 400));
        if (process.env.NODE_ENV !== "production") {
          console.info("[(marketing)] contact form submit (no BFF endpoint)", payload);
        }
      }
      setState("success");
      form.reset();
      setType(roles[0] ?? "");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t("form.error"));
      setState("error");
    }
  }

  return (
    <section className="section">
      <div className="container">
        <div
          data-grid="contact-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.05fr",
            gap: 64,
            alignItems: "flex-start",
          }}
        >
          <div>
            <div className="eyebrow">{t("hero.eyebrow")}</div>
            <h1 style={{ marginTop: 16 }}>
              {t("hero.title")} <span className="display-italic">{t("hero.titleItalic")}</span>
            </h1>
            <p
              style={{
                marginTop: 24,
                fontSize: 17,
                color: "var(--fg-muted)",
                lineHeight: 1.6,
                maxWidth: 480,
              }}
            >
              {t("hero.sub")}
            </p>
            <div style={{ marginTop: 40, display: "grid", gap: 18 }}>
              {contactInfo.map((r) => (
                <div
                  key={r.l}
                  style={{ paddingBottom: 18, borderBottom: "1px solid var(--line)" }}
                >
                  <div className="eyebrow">{r.l}</div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 26,
                      marginTop: 6,
                    }}
                  >
                    {r.v}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="card"
            aria-busy={state === "submitting"}
            aria-describedby={
              state === "success" ? "contact-status" : state === "error" ? "contact-error" : undefined
            }
            style={{ padding: 40, display: "grid", gap: 20 }}
          >
            <div className="eyebrow">{t("form.eyebrow")}</div>
            <Field
              name="name"
              label={t("form.name")}
              placeholder={t("form.namePlaceholder")}
              required
              autoComplete="name"
            />
            <div data-grid="contact-name-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field
                name="email"
                label={t("form.email")}
                placeholder={t("form.emailPlaceholder")}
                type="email"
                required
                autoComplete="email"
              />
              <Field
                name="phone"
                label={t("form.phone")}
                placeholder={t("form.phonePlaceholder")}
                type="tel"
                autoComplete="tel"
              />
            </div>
            <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
              <legend className="eyebrow" style={{ marginBottom: 10, padding: 0 }}>
                {t("form.roleLegend")}
              </legend>
              <div role="radiogroup" aria-label={t("form.roleAria")} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {roles.map((o) => (
                  <button
                    key={o}
                    type="button"
                    role="radio"
                    aria-checked={type === o}
                    onClick={() => setType(o)}
                    style={{
                      padding: "12px 18px",
                      borderRadius: 999,
                      border: `1px solid ${type === o ? "var(--fg)" : "var(--line)"}`,
                      background: type === o ? "var(--fg)" : "transparent",
                      color: type === o ? "var(--bg)" : "var(--fg)",
                      fontFamily: "var(--font-body)",
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 160ms ease",
                    }}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </fieldset>
            <Field
              name="message"
              label={t("form.message")}
              placeholder={t("form.messagePlaceholder")}
              textarea
              required
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 8,
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <span style={{ fontSize: 12, color: "var(--fg-muted)" }}>{t("form.privacy")}</span>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={state === "submitting"}
                style={state === "submitting" ? { opacity: 0.7, cursor: "wait" } : undefined}
              >
                {state === "submitting" ? t("form.submitting") : t("form.submit")}
                {state !== "submitting" && (
                  <span aria-hidden="true" style={{ display: "inline-block" }}>
                    →
                  </span>
                )}
              </button>
            </div>
            {state === "success" && (
              <div
                id="contact-status"
                role="status"
                style={{
                  marginTop: 4,
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: "var(--spring-soft)",
                  color: "var(--evergreen)",
                  fontSize: 14,
                }}
              >
                {t("form.success")}
              </div>
            )}
            {state === "error" && (
              <div
                id="contact-error"
                role="alert"
                style={{
                  marginTop: 4,
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: "rgba(101,29,50,0.08)",
                  color: "var(--wine)",
                  border: "1px solid rgba(101,29,50,0.24)",
                  fontSize: 14,
                  lineHeight: 1.55,
                }}
              >
                {errorMsg ?? t("form.error")}
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
