"use client";

import { Facebook, Instagram, Linkedin } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MarketingLogo } from "./marketing-logo";

const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61567276187526",
    Icon: Facebook,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/welpco_?igsh=a3dic2l1cnJqNjly",
    Icon: Instagram,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/societewelpco",
    Icon: Linkedin,
  },
] as const;

export function Footer() {
  const t = useTranslations("marketing.footer");
  const tA11y = useTranslations("marketing.a11y");

  const cols: { titleKey: "welpco" | "customers" | "support"; links: { labelKey: string; href?: string }[] }[] = [
    {
      titleKey: "welpco",
      links: [
        { labelKey: "aboutUs", href: "/about" },
        { labelKey: "ourMission", href: "/about#mission" },
      ],
    },
    {
      titleKey: "customers",
      links: [
        { labelKey: "findWelper", href: "/search" },
        { labelKey: "categories", href: "/#categories" },
        { labelKey: "howItWorks", href: "/how-it-works" },
        { labelKey: "trustSafety", href: "/#trust" },
      ],
    },
    {
      titleKey: "support",
      links: [
        { labelKey: "faq", href: "/faq" },
        { labelKey: "contactUs", href: "/contact" },
        { labelKey: "refundPolicy", href: "/legal/refund" },
        { labelKey: "cancellationPolicy", href: "/legal/cancellation" },
      ],
    },
  ];

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
        {tA11y("siteFooter")}
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
            gridTemplateColumns: "1.4fr repeat(3, 1fr)",
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
              {t("tagline")}
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
                      }}
                    >
                      <Icon size={18} strokeWidth={1.75} aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          {cols.map((col) => (
            <nav key={col.titleKey} aria-label={t(`cols.${col.titleKey}`)}>
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
                {t(`cols.${col.titleKey}`)}
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
                {col.links.map((l) => (
                  <li key={l.labelKey}>
                    {l.href ? (
                      <Link
                        href={l.href}
                        style={{
                          color: "rgba(250,241,229,0.92)",
                          textDecoration: "none",
                          fontSize: 15,
                        }}
                      >
                        {t(`links.${l.labelKey}`)}
                      </Link>
                    ) : (
                      <span
                        style={{
                          color: "rgba(250,241,229,0.55)",
                          fontSize: 15,
                          cursor: "not-allowed",
                        }}
                        aria-disabled="true"
                        title={tA11y("comingSoon")}
                      >
                        {t(`links.${l.labelKey}`)}
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
            {t("copyright")}
          </div>
          <div style={{ display: "flex", gap: 24, fontSize: 13, color: "rgba(250,241,229,0.86)" }}>
            <Link href="/legal/terms" style={{ color: "inherit", textDecoration: "none" }}>
              {t("terms")}
            </Link>
            <Link href="/legal/privacy" style={{ color: "inherit", textDecoration: "none" }}>
              {t("privacy")}
            </Link>
            <Link href="/legal/code-of-conduct" style={{ color: "inherit", textDecoration: "none" }}>
              {t("codeOfConduct")}
            </Link>
            <Link href="/legal/privacy#cookies" style={{ color: "inherit", textDecoration: "none" }}>
              {t("cookies")}
            </Link>
            <a href="mailto:support@welpco.com" style={{ color: "inherit", textDecoration: "none" }}>
              support@welpco.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
