"use client";

import { Container, Grid, Flex, Box } from "@radix-ui/themes";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import { WelpcoLogo } from "./welpco-logo";

/**
 * Public-page footer, mirroring the marketing site footer:
 * dark evergreen surface, cream Welpco imagotype + tagline, link columns,
 * circular social icons, and a bottom row with the copyright line and
 * legal links. Brand-locked colors follow the marketing tokens
 * (`--evergreen: #00492F`, `--cream: #FAF1E5`, `--spring: #79C000`).
 */

const EVERGREEN = "#00492F";
const CREAM = "#FAF1E5";
const SPRING = "#79C000";

const cream = (alpha: number) => `rgba(250, 241, 229, ${alpha})`;

const MONO_FONT =
  'var(--font-mono, ui-monospace, "SF Mono", SFMono-Regular, Menlo, monospace)';

const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61567276187526",
    Icon: Facebook,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/welpco_/",
    Icon: Instagram,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/societewelpco/",
    Icon: Linkedin,
  },
] as const;

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

/** Host-provided copy + hrefs (next-intl). Defaults stay English. */
export interface FooterLabels {
  siteFooterAria?: string;
  tagline: string;
  socialAria?: string;
  copyright: string;
  columns: FooterColumn[];
  bottomLinks: FooterLink[];
}

const DEFAULT_LABELS: FooterLabels = {
  siteFooterAria: "Site footer",
  tagline:
    "A local-services marketplace. Provider profiles, secure payments, and on-platform messaging.",
  socialAria: "Social media",
  copyright: `© ${new Date().getFullYear()} Welpco — Built for community`,
  columns: [
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
        { label: "How it works", href: "/how-it-works" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "FAQ", href: "/faq" },
        { label: "Contact us", href: "/contact" },
        { label: "Refund policy", href: "/legal/refund" },
        { label: "Cancellation policy", href: "/legal/cancellation" },
      ],
    },
  ],
  bottomLinks: [
    { label: "Terms", href: "/legal/terms" },
    { label: "Privacy", href: "/legal/privacy" },
    { label: "Code of conduct", href: "/legal/code-of-conduct" },
  ],
};

export interface FooterProps {
  /** `minimal` hides the link columns (brand block + bottom row only). */
  variant?: "default" | "minimal";
  /** Localized copy + hrefs from the host app. */
  labels?: FooterLabels;
}

export function Footer({ variant = "default", labels: labelsProp }: FooterProps) {
  const labels = labelsProp ?? DEFAULT_LABELS;

  return (
    <footer
      aria-label={labels.siteFooterAria ?? "Site footer"}
      style={{
        background: EVERGREEN,
        color: CREAM,
        marginTop: "auto",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative spring-green orb, as on the marketing footer */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          right: -120,
          top: -120,
          width: 360,
          height: 360,
          borderRadius: "50%",
          background: SPRING,
          opacity: 0.18,
          pointerEvents: "none",
        }}
      />
      <Container
        size="4"
        px={{ initial: "4", md: "6" }}
        style={{ position: "relative" }}
      >
        <Box pt={{ initial: "8", md: "9" }}>
          <Grid
            columns={{
              initial: "1",
              sm: variant === "minimal" ? "1" : "2",
              md: variant === "minimal" ? "1" : "1.4fr repeat(3, 1fr)",
            }}
            gap="7"
            pb="8"
            style={{ borderBottom: `1px solid ${cream(0.18)}` }}
          >
            {/* Brand block */}
            <div>
              <WelpcoLogo height={48} variant="cream" />
              <p
                style={{
                  marginTop: 20,
                  marginBottom: 0,
                  maxWidth: 320,
                  color: cream(0.78),
                  fontSize: 15,
                  lineHeight: 1.55,
                }}
              >
                {labels.tagline}
              </p>
              <nav aria-label={labels.socialAria ?? "Social media"} style={{ marginTop: 24 }}>
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
                          border: `1px solid ${cream(0.22)}`,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: cream(0.92),
                          textDecoration: "none",
                        }}
                      >
                        <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Link columns */}
            {variant !== "minimal" &&
              labels.columns.map((col) => (
                <nav key={col.title} aria-label={col.title}>
                  <div
                    style={{
                      fontFamily: MONO_FONT,
                      fontSize: 11,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: cream(0.78),
                      marginBottom: 18,
                    }}
                  >
                    {col.title}
                  </div>
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      display: "grid",
                      gap: 10,
                    }}
                  >
                    {col.links.map((link) => (
                      <li key={`${col.title}-${link.href}`}>
                        <a
                          href={link.href}
                          style={{
                            color: cream(0.92),
                            textDecoration: "none",
                            fontSize: 15,
                          }}
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
          </Grid>

          {/* Bottom row */}
          <Flex
            justify="between"
            align="center"
            wrap="wrap"
            gap="4"
            pt="6"
            pb="6"
          >
            <div
              style={{
                fontFamily: MONO_FONT,
                fontSize: 12,
                color: cream(0.72),
              }}
            >
              {labels.copyright}
            </div>
            <Flex
              align="center"
              wrap="wrap"
              style={{ columnGap: 24, rowGap: 8, fontSize: 13, color: cream(0.86) }}
            >
              {labels.bottomLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  {link.label}
                </a>
              ))}
              <a
                href="mailto:support@welpco.com"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                support@welpco.com
              </a>
            </Flex>
          </Flex>
        </Box>
      </Container>
    </footer>
  );
}

Footer.displayName = "Footer";
