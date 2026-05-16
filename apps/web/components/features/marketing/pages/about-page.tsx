import { SectionHeader } from "../sections/section-header";
import { MarketingImage } from "../shared/marketing-image";

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

const MISSION_PARAGRAPHS = [
  `Welpco is uniquely designed to connect people in need of services to those who provide services within their community. Whether it's parents searching for a last-minute babysitter to someone needing a hand with household maintenance, Welpco facilitates your needs by connecting you to a friendly face within your community who is willing to lend a hand. Our mission is to bring forward a user-friendly platform, where people can utilize their skills and provide services within their community with the freedom of selecting their own schedule while accommodating to the needs of others. We provide a safe environment for both our service providers, who we refer to as our "Welpers", and our customers.`,
  `Being a Welper comes with many advantages. You decide which services you'd like to provide. You choose your work schedule, since you provide us with your availability, so you can be a part-time Welper or a full-time Welper. For some, becoming a Welper can be your first job. It can teach adolescents and young adults, quality life skills, such as: responsibility, commitment, communication, and kindness. For others, becoming a Welper is a way to make money outside the hours of your daily job/career, allowing you to have more income on your own time. For retirees who'd like to increase their income by utilizing their free time and perhaps, doing something they enjoy, becoming a Welper is absolutely perfect. Welpco offers many services provided by our Welpers, such as: babysitting, tutoring, lawn-mowing, seasonal outdoor maintenance, household chores, moving, dog-walking, technological assistance, installations, among many others.`,
  `In today's fast paced society, it can be challenging to accomplish everything you need to get done in a day's time. We all have obligations, whether it's to our jobs, our family, our homes, or our communities. Welpco facilitates your needs by giving you the means of scheduling whichever services you need to alleviate some of that stress or free up some much needed time. You can schedule a daily, weekly, or monthly routine of services via our platform. From scheduling tutoring for your children on Wednesday evenings to having your lawn mowed Sunday mornings, Welpco is there. Too busy to prepare a home cooked meal throughout the week, why not have a Welper prepare your meals in advance for you? Not only can you schedule services in advance, but we at Welpco understand that sometimes services are needed now, today, as soon as possible, so we cater to your needs. With a simple search on our platform, you can find the service you're looking for from a friendly Welper in no time!`,
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
              alt="Neighbours helping each other in the community on a sunny afternoon"
              ratio="4 / 3"
              radius="var(--radius-lg)"
              priority
            />
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="section" id="mission" style={{ background: "var(--bg-soft)" }}>
        <div className="container">
          <div data-grid="about-mission" style={{ display: "grid", gridTemplateColumns: "0.6fr 1.4fr", gap: 64 }}>
            <div className="eyebrow" style={{ paddingTop: 18 }}>
              — Our mission
            </div>
            <div>
              <h2>
                Connecting neighbours who need help{" "}
                <span className="display-italic">with those ready to Welp.</span>
              </h2>
              {MISSION_PARAGRAPHS.map((paragraph) => (
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

    </>
  );
}
