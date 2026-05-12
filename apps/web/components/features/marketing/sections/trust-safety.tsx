/**
 * TrustSafety — dark Evergreen panel with 4 trust pillars.
 *
 * Faithful port of `.design-reference/project/components/sections.jsx` `TrustSafety`.
 */

type IconName = "shield" | "lock" | "chat" | "star";

const ITEMS: { title: string; body: string; icon: IconName }[] = [
  {
    title: "Background-checked Welpers",
    body: "Every adult Welper passes a background check before they can take their first booking.",
    icon: "shield",
  },
  {
    title: "Funds held until done",
    body: "You pay upfront, but we hold the money until you confirm the job is complete.",
    icon: "lock",
  },
  {
    title: "On-platform messaging",
    body: "All communication runs through Welpco — transparent, respectful, and on the record.",
    icon: "chat",
  },
  {
    title: "Two-way ratings",
    body: "Customers and Welpers rate each other after every job. The community keeps itself accountable.",
    icon: "star",
  },
];

function Icon({ name }: { name: IconName }) {
  const c = {
    width: 22,
    height: 22,
    viewBox: "0 0 22 22",
    fill: "none",
    stroke: "var(--evergreen)",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (name === "shield")
    return (
      <svg {...c}>
        <path d="M11 2l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V5l7-3z" />
        <path d="M8 11l2 2 4-4" />
      </svg>
    );
  if (name === "lock")
    return (
      <svg {...c}>
        <rect x="4" y="9" width="14" height="10" rx="2" />
        <path d="M7 9V6a4 4 0 0 1 8 0v3" />
      </svg>
    );
  if (name === "chat")
    return (
      <svg {...c}>
        <path d="M3 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4 4v-4H5a2 2 0 0 1-2-2V5z" />
      </svg>
    );
  return (
    <svg {...c}>
      <path d="M11 3l2.5 5L19 9l-4 4 1 5.5-5-2.5L6 18.5 7 13 3 9l5.5-1z" />
    </svg>
  );
}

export function TrustSafety() {
  return (
    <section className="section" id="trust">
      <div className="container">
        <div
          data-section="trust-panel"
          style={{
            background: "var(--evergreen)",
            color: "var(--cream)",
            borderRadius: "var(--radius-xl)",
            padding: "64px 56px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              right: -80,
              top: -80,
              width: 320,
              height: 320,
              borderRadius: "50%",
              background: "var(--accent)",
              opacity: 0.16,
            }}
          />
          <div
            data-grid="trust-grid"
            style={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: "0.85fr 1.15fr",
              gap: 56,
              alignItems: "flex-start",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(250,241,229,0.6)",
                  marginBottom: 18,
                }}
              >
                — Trust & safety
              </div>
              <h2 style={{ color: "var(--cream)" }}>
                Trust, <span className="display-italic" style={{ color: "var(--accent-soft)" }}>by design.</span>
              </h2>
              <p
                style={{
                  marginTop: 20,
                  fontSize: 16,
                  color: "rgba(250,241,229,0.75)",
                  maxWidth: 380,
                  lineHeight: 1.6,
                }}
              >
                Background checks, escrow payments, on-platform messaging, and two-way ratings — baked into every booking.
              </p>
            </div>
            <div data-grid="trust-items" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {ITEMS.map((i) => (
                <div
                  key={i.title}
                  style={{
                    padding: 24,
                    borderRadius: "var(--radius-md)",
                    background: "rgba(250,241,229,0.06)",
                    border: "1px solid rgba(250,241,229,0.12)",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "var(--accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name={i.icon} />
                  </div>
                  <h4 style={{ color: "var(--cream)", fontSize: 20, marginTop: 16 }}>{i.title}</h4>
                  <p
                    style={{
                      color: "rgba(250,241,229,0.72)",
                      marginTop: 8,
                      fontSize: 14,
                      lineHeight: 1.55,
                    }}
                  >
                    {i.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
