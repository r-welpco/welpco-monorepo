import { SectionHeader } from "../sections/section-header";
import { MarketingImage } from "../shared/marketing-image";
import { MarqueeBand } from "../sections/marquee-band";

/**
 * AboutPage — mission, who-Welps personas, values.
 *
 * Faithful port of `.design-reference/project/components/pages.jsx` `AboutPage`.
 * The chrome (TopNav + Footer) is mounted by the (marketing) layout, not here.
 */

const PERSONAS = [
  {
    label: "Teens & young adults",
    body: "Welping as a structured first job — flexible hours, real income, and verifiable work history.",
    imageSrc: "/marketing/about-persona-teens.jpg",
    imageAlt: "Young adult working flexibly on a laptop",
  },
  {
    label: "Working adults",
    body: "A side income on top of an existing career. Pick up bookings on evenings and weekends.",
    imageSrc: "/marketing/about-persona-adults.jpg",
    imageAlt: "Working adult managing a side hustle from a home desk",
  },
  {
    label: "Retirees",
    body: "Use existing skills to supplement retirement income, on a self-managed schedule.",
    imageSrc: "/marketing/about-persona-retirees.jpg",
    imageAlt: "Retiree enjoying meaningful work in the garden",
  },
];

const VALUES = [
  {
    n: "01",
    t: "Local first",
    b: "The product is designed around proximity. Search defaults to your zip; matching prioritizes nearby Welpers.",
  },
  {
    n: "02",
    t: "Trust by system",
    b: "Background checks, escrow payments, on-platform messaging, two-way ratings. Trust is engineered, not assumed.",
  },
  {
    n: "03",
    t: "Provider autonomy",
    b: "Welpers control what they offer, when they work, and what they charge. The platform follows their constraints.",
  },
  {
    n: "04",
    t: "Direct human work",
    b: "No subcontracting. Every booking is a single Welper with a profile, ratings, and a verifiable track record.",
  },
];

export function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="section">
        <div className="container">
          <div className="eyebrow">— About us</div>
          <h1 style={{ marginTop: 16, maxWidth: 1100 }}>
            A local-services
            <br />
            <span className="display-italic">marketplace.</span>
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
              <p style={{ fontSize: 19, lineHeight: 1.6, color: "var(--fg)" }}>
                Welpco connects people who need everyday services with vetted providers in their area.
              </p>
              <p
                style={{
                  fontSize: 17,
                  lineHeight: 1.65,
                  color: "var(--fg-muted)",
                  marginTop: 20,
                }}
              >
                From last-minute babysitting to seasonal yard work, Welpco runs the search, scheduling, payment and review layer — so the only thing left is the work itself.
              </p>
            </div>
            <MarketingImage
              src="/marketing/about-community.jpg"
              alt="Neighbors helping each other in the community"
              ratio="4 / 3"
              radius="var(--radius-lg)"
              priority
            />
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="section" style={{ background: "var(--bg-soft)" }}>
        <div className="container">
          <div data-grid="about-mission" style={{ display: "grid", gridTemplateColumns: "0.6fr 1.4fr", gap: 64 }}>
            <div className="eyebrow" style={{ paddingTop: 18 }}>
              — Our mission
            </div>
            <div>
              <h2>
                A platform where providers set their own terms{" "}
                <span className="display-italic">and customers find help fast.</span>
              </h2>
              <p
                style={{
                  marginTop: 28,
                  fontSize: 17,
                  lineHeight: 1.65,
                  color: "var(--fg-muted)",
                  maxWidth: 720,
                }}
              >
                Welpers — our service providers — choose what they offer, when they work, and what they charge. Customers get vetted help on demand. The platform handles trust, payment and accountability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who Welps */}
      <section className="section">
        <div className="container">
          <SectionHeader
            eyebrow="Who Welps"
            title={
              <>
                Three kinds of <span className="display-italic">Welper.</span>
              </>
            }
          />
          <div
            data-grid="personas-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 24,
              marginTop: 56,
            }}
          >
            {PERSONAS.map((p, i) => (
              <div
                key={i}
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
                  src={p.imageSrc}
                  alt={p.imageAlt}
                  ratio="16 / 9"
                  radius="var(--radius-md)"
                  sizes="(max-width: 900px) 100vw, 33vw"
                />
                <h3 style={{ fontSize: 26 }}>{p.label}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--fg-muted)" }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section" style={{ background: "var(--bg-soft)" }}>
        <div className="container">
          <SectionHeader
            eyebrow="What we believe"
            title={
              <>
                Four operating <span className="display-italic">principles.</span>
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
            {VALUES.map((v) => (
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

      <MarqueeBand />
    </>
  );
}
