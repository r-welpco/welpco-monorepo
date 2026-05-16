import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HowItWorks } from "../sections/how-it-works";
import { BecomeWelperCTA } from "../sections/become-welper-cta";
import { MarketingImage } from "../shared/marketing-image";

/**
 * HowItWorksPage — onboarding deep-dive.
 */

export async function HowItWorksPage() {
  const t = await getTranslations("marketing.howItWorksPage");
  const steps = t.raw("welper.steps") as [string, string][];

  return (
    <>
      <section className="section">
        <div className="container">
          <div className="eyebrow">{t("hero.eyebrow")}</div>
          <h1 style={{ marginTop: 16, maxWidth: 1100 }}>
            {t("hero.title")} <span className="display-italic">{t("hero.titleItalic")}</span>
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
            {t("hero.sub")}
          </p>
        </div>
      </section>
      <HowItWorks />

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
              <div className="eyebrow">{t("welper.eyebrow")}</div>
              <h2 style={{ marginTop: 14 }}>
                {t("welper.title")}{" "}
                <span className="display-italic">{t("welper.titleItalic")}</span>
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
                {steps.map(([title, body], i) => (
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
                      <div style={{ fontWeight: 600, fontSize: 17 }}>{title}</div>
                      <div
                        style={{
                          fontSize: 14,
                          color: "var(--fg-muted)",
                          marginTop: 4,
                          lineHeight: 1.55,
                        }}
                      >
                        {body}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <Link href="/register" className="btn btn-primary" style={{ marginTop: 32 }}>
                {t("welper.cta")} <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div style={{ display: "grid", gap: 18 }}>
              <MarketingImage
                src="/marketing/how-it-works-onboarding.jpg"
                alt={t("welper.images.onboarding")}
                ratio="4 / 3"
                radius="var(--radius-md)"
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                <MarketingImage
                  src="/marketing/how-it-works-profile.jpg"
                  alt={t("welper.images.profile")}
                  ratio="1 / 1"
                  radius="var(--radius-md)"
                />
                <MarketingImage
                  src="/marketing/how-it-works-verification.jpg"
                  alt={t("welper.images.verification")}
                  ratio="1 / 1"
                  radius="var(--radius-md)"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <BecomeWelperCTA />
    </>
  );
}
