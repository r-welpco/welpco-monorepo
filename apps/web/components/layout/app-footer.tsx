"use client";

import type { ReactNode } from "react";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { MarketingLogo } from "@/components/features/marketing/shared/marketing-logo";
import { marketingHref } from "@/lib/i18n/marketing-href";
import type { Locale } from "@/i18n/routing";

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

type FooterLink = {
  label: string;
  href: string;
};

function FooterLinkItem({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: "var(--gray-11)",
        textDecoration: "none",
        fontSize: "var(--font-size-1)",
        lineHeight: 1.4,
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.textDecoration = "underline";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.textDecoration = "none";
      }}
    >
      {children}
    </a>
  );
}

/**
 * Light dashboard footer — marketing links open the public site in a new tab so
 * the signed-in session stays on the current page.
 */
export function AppFooter() {
  const locale = useLocale() as Locale;
  const t = useTranslations("marketing.footer");
  const tApp = useTranslations("dashboard.footer");
  const tA11y = useTranslations("marketing.a11y");

  const links: FooterLink[] = [
    { label: t("links.faq"), href: marketingHref(locale, "/faq") },
    { label: t("links.contactUs"), href: marketingHref(locale, "/contact") },
    { label: t("links.refundPolicy"), href: marketingHref(locale, "/legal/refund") },
    {
      label: t("links.cancellationPolicy"),
      href: marketingHref(locale, "/legal/cancellation"),
    },
    { label: t("links.aboutUs"), href: marketingHref(locale, "/about") },
    { label: t("terms"), href: marketingHref(locale, "/legal/terms") },
    { label: t("privacy"), href: marketingHref(locale, "/legal/privacy") },
    {
      label: t("codeOfConduct"),
      href: marketingHref(locale, "/legal/code-of-conduct"),
    },
  ];

  return (
    <Box
      asChild
      style={{
        marginTop: "auto",
        borderTop: "1px solid var(--gray-a6)",
        backgroundColor: "var(--gray-2)",
        position: "relative",
        zIndex: 1,
        width: "100%",
      }}
    >
      <footer aria-labelledby="app-footer-heading">
        <h2
          id="app-footer-heading"
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
          {tApp("heading")}
        </h2>
        <Box
          px={{ initial: "4", sm: "6" }}
          py="3"
          style={{
            width: "100%",
            minWidth: 0,
          }}
        >
          <Flex
            align="center"
            justify="between"
            gap="4"
            style={{
              width: "100%",
              minWidth: 0,
            }}
          >
            <Box style={{ flexShrink: 0 }}>
              <MarketingLogo height={22} variant="light" />
            </Box>

            <nav
              aria-label={tApp("heading")}
              style={{
                flex: "1 1 auto",
                minWidth: 0,
                display: "flex",
                justifyContent: "center",
                overflowX: "auto",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              <Flex
                gap={{ initial: "3", sm: "4" }}
                align="center"
                justify="center"
                wrap="nowrap"
                style={{ minWidth: "min-content" }}
              >
                {links.map((link) => (
                  <FooterLinkItem key={link.label} href={link.href}>
                    {link.label}
                  </FooterLinkItem>
                ))}
              </Flex>
            </nav>

            <nav aria-label={tA11y("siteFooter")} style={{ flexShrink: 0 }}>
              <Flex gap="2" align="center" justify="end">
                {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "var(--radius-2)",
                      border: "1px solid var(--gray-a6)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--gray-11)",
                      textDecoration: "none",
                    }}
                  >
                    <Icon size={14} strokeWidth={1.75} aria-hidden />
                  </a>
                ))}
              </Flex>
            </nav>
          </Flex>
        </Box>
      </footer>
    </Box>
  );
}
