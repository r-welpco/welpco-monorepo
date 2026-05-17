import { getTranslations } from "next-intl/server";
import { SectionHeader } from "../sections/section-header";
import { MarketingImage } from "../shared/marketing-image";
import { MarketingSwipeRow } from "../shared/marketing-swipe-row";

export async function AboutPage() {
  const t = await getTranslations("marketing.about");
  const tA11y = await getTranslations("marketing.a11y");

  const personas = t.raw("personas.items") as {
    label: string;
    body: string;
    imageAlt: string;
  }[];
  const personaImages = [
    "/marketing/about-persona-teens.jpg",
    "/marketing/about-persona-adults.jpg",
    "/marketing/about-persona-retirees.jpg",
  ];
  const missionParagraphs = t.raw("mission.paragraphs") as string[];
  const values = t.raw("values.items") as { n: string; t: string; b: string }[];

  return (
    <>
      <section className="section">
        <div className="container">
          <div className="eyebrow">{t("hero.eyebrow")}</div>
          <h1 style={{ marginTop: 16, maxWidth: 1100 }}>
            {t("hero.titleLine1")}
            <br />
            <span className="display-italic">{t("hero.titleLine2")}</span>
          </h1>
          <div
            data-grid="about-hero"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 56,
              marginTop: 56,
              alignItems: "flex-start",
            }}
          >
            <div>
              <p style={{ fontSize: 19, lineHeight: 1.6, color: "var(--fg)" }}>{t("hero.lead")}</p>
              <p
                style={{
                  fontSize: 17,
                  lineHeight: 1.65,
                  color: "var(--fg-muted)",
                  marginTop: 20,
                }}
              >
                {t("hero.sub")}
              </p>
            </div>
            <MarketingImage
              src="/marketing/about-community.jpg"
              alt={t("hero.imageAlt")}
              ratio="4 / 3"
              radius="var(--radius-lg)"
              priority
            />
          </div>
        </div>
      </section>

      <section className="section" id="mission" style={{ background: "var(--bg-soft)" }}>
        <div className="container">
          <div data-grid="about-mission" style={{ display: "grid", gridTemplateColumns: "0.6fr 1.4fr", gap: 64 }}>
            <div className="eyebrow" style={{ paddingTop: 18 }}>
              {t("mission.eyebrow")}
            </div>
            <div>
              <h2>
                {t("mission.title")}{" "}
                <span className="display-italic">{t("mission.titleItalic")}</span>
              </h2>
              {missionParagraphs.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 48)}
                  style={{
                    marginTop: 28,
                    fontSize: 17,
                    lineHeight: 1.65,
                    color: "var(--fg-muted)",
                    maxWidth: 720,
                  }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeader
            eyebrow={t("personas.eyebrow")}
            title={
              <>
                {t("personas.titleLine1")}{" "}
                <span className="display-italic">{t("personas.titleLine2")}</span>
              </>
            }
          />
          <MarketingSwipeRow
            ariaLabel={tA11y("personasGallery")}
            swipeHint={tA11y("swipeHint")}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 24,
              marginTop: 56,
            }}
          >
            {personas.map((p, i) => (
              <div
                key={p.label}
                className="card"
                style={{
                  padding: 28,
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                  minHeight: 280,
                }}
              >
                <MarketingImage
                  src={personaImages[i]!}
                  alt={p.imageAlt}
                  ratio="16 / 9"
                  radius="var(--radius-md)"
                  sizes="(max-width: 900px) 100vw, 33vw"
                />
                <h3 style={{ fontSize: 26 }}>{p.label}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--fg-muted)" }}>{p.body}</p>
              </div>
            ))}
          </MarketingSwipeRow>
        </div>
      </section>

      <section className="section" style={{ background: "var(--bg-soft)" }}>
        <div className="container">
          <SectionHeader
            eyebrow={t("values.eyebrow")}
            title={
              <>
                {t("values.titleLine1")}{" "}
                <span className="display-italic">{t("values.titleLine2")}</span>
              </>
            }
          />
          <div
            data-grid="values-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 24,
              marginTop: 48,
            }}
          >
            {values.map((v) => (
              <div
                key={v.n}
                style={{
                  display: "flex",
                  gap: 24,
                  padding: 24,
                  borderTop: "1px solid var(--line)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontSize: 56,
                    color: "var(--accent)",
                    lineHeight: 0.9,
                    flex: "0 0 auto",
                  }}
                >
                  {v.n}
                </div>
                <div>
                  <h3 style={{ fontSize: 26 }}>{v.t}</h3>
                  <p
                    style={{
                      marginTop: 8,
                      fontSize: 15,
                      color: "var(--fg-muted)",
                      lineHeight: 1.6,
                    }}
                  >
                    {v.b}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
