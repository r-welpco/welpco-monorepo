/**
 * Marketing-surface copy in one place.
 *
 * Headlines, sub-headlines, and CTA labels for every page in `app/(marketing)/`.
 * The voice is bible §22: warm, direct, competent. Edit copy here, not in the
 * page components, so:
 *   1. The whole marketing voice stays consistent without grep-and-pray.
 *   2. Future copy reviewers (legal, brand) have one file to read.
 *   3. i18n is a one-day port instead of a multi-week one (when we get there).
 *
 * Each export is shaped as: `overline`, `headline`, `sub`, `cta` (primary +
 * optional secondary). Pages destructure what they need.
 */

export const homeCopy = {
  overline: "Welpco — Marketplace",
  headline: "Find help. Be help.",
  sub: "Welpco is the local marketplace where neighbors hire — and get hired — for the everyday work that keeps a life running.",
  primaryCta: { label: "Find a Welper", href: "/search" },
  secondaryCta: { label: "Become a Welper", href: "/register" },
} as const;

export const welpersCopy = {
  overline: "Welpco — For Welpers",
  headline: "Earn from what you already do.",
  sub: "Walk dogs on your morning route. Tutor a kid two streets over. Welpco connects what you're good at with neighbors who'd pay you for it.",
  primaryCta: { label: "Become a Welper", href: "/register" },
  secondaryCta: { label: "Sign in", href: "/login" },
  tertiaryLink: { label: "Looking for help instead?", href: "/" },
} as const;

export const aboutCopy = {
  overline: "About Welpco",
  headline: "We're building the part that doesn't already exist.",
  sub: "Most of the work in a community already gets done — by neighbors who know each other. Welpco is for the times when you don't already have the right neighbor.",
} as const;

export const blogCopy = {
  overline: "The Welpco journal",
  headline: "What we're building, and why.",
  sub: "Notes from the team on how Welpco works under the hood, the decisions that shaped it, and the ones we're still wrestling with.",
} as const;

export const helpCopy = {
  overline: "Help & FAQ",
  headline: "Answers, in plain words.",
  sub: "If you don't see your question here, write to us — we read every note.",
  contactEmail: "hello@welpco.com",
} as const;

export const legalTermsCopy = {
  overline: "Legal — Terms",
  headline: "Terms of service.",
  sub: "The agreement between you and Welpco when you use the marketplace.",
} as const;

export const legalPrivacyCopy = {
  overline: "Legal — Privacy",
  headline: "Privacy policy.",
  sub: "What we collect, why we collect it, and what we won't do with it.",
} as const;

/**
 * Footer / shared chrome copy.
 */
export const chromeCopy = {
  signIn: { label: "Sign in", href: "/login" },
  signUp: { label: "Sign up", href: "/register" },
  brand: { label: "Welpco", href: "/" },
  contactEmail: "hello@welpco.com",
  locale: "Toronto, ON",
} as const;
