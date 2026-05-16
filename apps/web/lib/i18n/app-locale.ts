import type { Locale } from "@/i18n/routing";

export type PreferredLocale = "en" | "fr";

export function toPreferredLocale(locale: string): PreferredLocale {
  return locale === "fr" ? "fr" : "en";
}

export function localeFromUseLocale(locale: Locale | string): PreferredLocale {
  return toPreferredLocale(locale);
}
