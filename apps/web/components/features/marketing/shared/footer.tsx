import Link from "next/link";
import { MarketingLogo } from "./marketing-logo";

/**
 * Footer — dark Evergreen footer with 4 link columns + decorative pastel circle.
 *
 * Faithful port of `.design-reference/project/components/shared.jsx` `Footer`.
 */

interface FooterLink {
  label: string;
  href?: string;
}

const COLS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Welpco",
    links: [
      { label: "About us", href: "/about" },
      { label: "Our mission", href: "/about#mission" },
      { label: "Press" },
      { label: "Careers" },
    ],
  },
  {
    title: "For customers",
    links: [
      { label: "Find a Welper", href: "/search" },
      { label: "Categories", href: "/#categories" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Trust & safety", href: "/#trust" },
    ],
  },
  {
    title: "For Welpers",
    links: [
      { label: "Become a Welper", href: "/welper/onboarding" },
      { label: "Welper handbook" },
      { label: "Get paid", href: "/how-it-works" },
      { label: "Community" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Contact us", href: "/contact" },
      { label: "Help center", href: "/faq" },
      { label: "Report an issue", href: "/contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer
      aria-labelledby="footer-heading"
      style={{
        background: "var(--evergreen)",
        color: "var(--cream)",
        padding: "88px 0 32px",
        marginTop: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <h2 id="footer-heading" style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
        Site footer
      </h2>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          right: -120,
          top: -120,
          width: 360,
          height: 360,
          borderRadius: "50%",
          background: "var(--spring)",
          opacity: 0.18,
        }}
      />
      <div className="container">
        <div
          data-grid="footer-cols"
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr repeat(4, 1fr)",
            gap: 48,
            paddingBottom: 64,
            borderBottom: "1px solid rgba(250,241,229,0.18)",
          }}
        >
          <div>
            <MarketingLogo height={48} variant="footer" />
            <p
              style={{
                marginTop: 20,
                maxWidth: 320,
                color: "rgba(250,241,229,0.78)",
                fontSize: 15,
                lineHeight: 1.55,
              }}
            >
              A local-services marketplace. Vetted providers, escrow payments, on-platform messaging.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
              <Link
                href="/welper/onboarding"
                className="btn btn-accent"
                style={{ padding: "12px 20px", fontSize: 14 }}
              >
                Become a Welper
              </Link>
            </div>
          </div>
          {COLS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(250,241,229,0.78)",
                  marginBottom: 18,
                }}
              >
                {col.title}
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href ? (
                      <Link
                        href={l.href}
                        style={{
                          color: "rgba(250,241,229,0.92)",
                          textDecoration: "none",
                          fontSize: 15,
                        }}
                      >
                        {l.label}
                      </Link>
                    ) : (
                      <span
                        style={{
                          color: "rgba(250,241,229,0.55)",
                          fontSize: 15,
                          cursor: "not-allowed",
                        }}
                        aria-disabled="true"
                        title="Coming soon"
                      >
                        {l.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div
          style={{
            paddingTop: 28,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(250,241,229,0.72)" }}>
            © 2026 Welpco — Built for community
          </div>
          <div style={{ display: "flex", gap: 24, fontSize: 13, color: "rgba(250,241,229,0.86)" }}>
            <Link href="/legal/terms" style={{ color: "inherit", textDecoration: "none" }}>
              Terms
            </Link>
            <Link href="/legal/privacy" style={{ color: "inherit", textDecoration: "none" }}>
              Privacy
            </Link>
            <Link href="/legal/privacy" style={{ color: "inherit", textDecoration: "none" }}>
              Cookies
            </Link>
            <a
              href="mailto:support@welpco.com"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              support@welpco.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
