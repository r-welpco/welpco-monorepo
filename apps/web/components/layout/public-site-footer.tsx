"use client";

import { useLocale, useTranslations } from "next-intl";
import { Footer, type FooterLabels } from "@welpco/ui/platform/layout";
import { localizedPath } from "@/i18n/locale-routes";
import type { Locale } from "@/i18n/routing";

/**
 * Platform public footer with marketing i18n copy + locale-prefixed hrefs
 * for `/search` and `/welper/[id]` (outside `app/[locale]`).
 */
export function PublicSiteFooter() {
  const t = useTranslations("marketing.footer");
  const tA11y = useTranslations("marketing.a11y");
  const locale = useLocale() as Locale;
  const href = (path: string) => localizedPath(path, locale);

  const labels: FooterLabels = {
    siteFooterAria: tA11y("siteFooter"),
    tagline: t("tagline"),
    socialAria: "Social media",
    copyright: t("copyright"),
    columns: [
      {
        title: t("cols.welpco"),
        links: [
          { label: t("links.aboutUs"), href: href("/about") },
          { label: t("links.ourMission"), href: `${href("/about")}#mission` },
        ],
      },
      {
        title: t("cols.customers"),
        links: [
          { label: t("links.findWelper"), href: "/search" },
          { label: t("links.howItWorks"), href: href("/how-it-works") },
        ],
      },
      {
        title: t("cols.support"),
        links: [
          { label: t("links.faq"), href: href("/faq") },
          { label: t("links.contactUs"), href: href("/contact") },
          { label: t("links.refundPolicy"), href: href("/legal/refund") },
          {
            label: t("links.cancellationPolicy"),
            href: href("/legal/cancellation"),
          },
        ],
      },
    ],
    bottomLinks: [
      { label: t("terms"), href: href("/legal/terms") },
      { label: t("privacy"), href: href("/legal/privacy") },
      { label: t("codeOfConduct"), href: href("/legal/code-of-conduct") },
    ],
  };

  return <Footer labels={labels} />;
}
