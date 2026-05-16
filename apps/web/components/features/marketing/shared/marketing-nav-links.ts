/** Primary marketing nav hrefs — labels come from i18n (`marketing.nav`). */

export const MARKETING_PRIMARY_NAV_HREFS = [
  "/",
  "/about",
  "/how-it-works",
  "/faq",
  "/contact",
] as const;

export type MarketingNavHref = (typeof MARKETING_PRIMARY_NAV_HREFS)[number];

export const MARKETING_NAV_KEY_BY_HREF: Record<
  MarketingNavHref,
  "home" | "about" | "howItWorks" | "faq" | "contact"
> = {
  "/": "home",
  "/about": "about",
  "/how-it-works": "howItWorks",
  "/faq": "faq",
  "/contact": "contact",
};
