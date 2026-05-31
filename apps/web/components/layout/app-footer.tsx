"use client";

import type { ReactNode } from "react";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Separator } from "@welpco/ui/separator";
import { Text } from "@welpco/ui/text";
import { MarketingLogo } from "@/components/features/marketing/shared/marketing-logo";
import { marketingHref } from "@/lib/i18n/marketing-href";
import type { Locale } from "@/i18n/routing";

/** Matches dashboard main column in layout-client.tsx */
const DASHBOARD_CONTENT_MAX_WIDTH = "1200px";

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
  const opensNewTab = href.startsWith("http") || href.startsWith("/");
  return (
    <a
      href={href}
      {...(opensNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
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
    { label: t("links.aboutUs"), href: marketingHref(locale, "/about") },
    { label: t("links.howItWorks"), href: marketingHref(locale, "/how-it-works") },
    { label: t("terms"), href: marketingHref(locale, "/legal/terms") },
    { label: t("privacy"), href: marketingHref(locale, "/legal/privacy") },
    { label: t("cookies"), href: marketingHref(locale, "/legal/privacy#cookies") },
    { label: "support@welpco.com", href: "mailto:support@welpco.com" },
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
          py={{ initial: "4", sm: "5" }}
          style={{
            width: "100%",
            maxWidth: DASHBOARD_CONTENT_MAX_WIDTH,
            margin: "0 auto",
            minWidth: 0,
          }}
        >
          <Flex direction="column" gap="3">
            <Flex
              direction={{ initial: "column", sm: "row" }}
              gap={{ initial: "3", sm: "4" }}
              align={{ initial: "start", sm: "center" }}
              wrap="wrap"
            >
              <MarketingLogo height={24} variant="light" />
              <nav aria-label={tApp("heading")} style={{ minWidth: 0, flex: 1 }}>
                <Flex gap="3" wrap="wrap" align="center">
                  {links.map((link) => (
                    <FooterLinkItem key={link.label} href={link.href}>
                      {link.label}
                    </FooterLinkItem>
                  ))}
                </Flex>
              </nav>
            </Flex>

            <Separator size="4" />

            <Flex
              justify="between"
              align="center"
              direction={{ initial: "column", sm: "row" }}
              gap="2"
            >
              <Text size="1" color="gray" highContrast>
                {t("copyright")}
              </Text>
              <nav aria-label={tA11y("siteFooter")}>
                <Flex gap="2" align="center">
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
          </Flex>
        </Box>
      </footer>
    </Box>
  );
}
