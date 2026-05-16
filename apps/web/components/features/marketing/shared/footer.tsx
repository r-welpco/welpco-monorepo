import Link from "next/link";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import { MarketingLogo } from "./marketing-logo";

/**
 * Footer — dark Evergreen footer with link columns + social links.
 */

interface FooterLink {
  label: string;
  href?: string;
}

const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/welpco",
    Icon: Facebook,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/welpco",
    Icon: Instagram,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/welpco",
    Icon: Linkedin,
  },
  {
    label: "X",
    href: "https://x.com/welpco",
    Icon: XIcon,
  },
] as const;

function XIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const COLS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Welpco",
    links: [
      { label: "About us", href: "/about" },
      { label: "Our mission", href: "/about#mission" },
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
      { label: "Welper handbook" },
      {
        label: "Weekly payouts (Friday)",
        href: "/how-it-works",
      },
      { label: "Community" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Contact us", href: "/contact" },
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
      <h2
        id="footer-heading"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
        }}
      >
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
            <nav aria-label="Social media" style={{ marginTop: 24 }}>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        border: "1px solid rgba(250,241,229,0.22)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "rgba(250,241,229,0.92)",
                        textDecoration: "none",
                        transition: "background 160ms ease, border-color 160ms ease",
                      }}
                    >
                      {label === "X" ? (
                        <XIcon size={18} />
                      ) : (
                        <Icon size={18} strokeWidth={1.75} aria-hidden />
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
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
