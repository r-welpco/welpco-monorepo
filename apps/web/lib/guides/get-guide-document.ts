import type { Locale } from "@/i18n/routing";
import type { GuideDocument, GuideKind } from "./types";
import customerEn from "@/content/guides/customer.en.json";
import customerFr from "@/content/guides/customer.fr.json";
import welperEn from "@/content/guides/welper.en.json";
import welperFr from "@/content/guides/welper.fr.json";

const customerByLocale: Record<Locale, GuideDocument> = {
  en: customerEn as GuideDocument,
  fr: customerFr as GuideDocument,
};

const welperByLocale: Record<Locale, GuideDocument> = {
  en: welperEn as GuideDocument,
  fr: welperFr as GuideDocument,
};

export function getCustomerGuideDocument(locale: Locale): GuideDocument {
  return customerByLocale[locale] ?? customerByLocale.en;
}

export function getWelperGuideDocument(locale: Locale): GuideDocument {
  return welperByLocale[locale] ?? welperByLocale.en;
}

export function getGuideDocument(kind: GuideKind, locale: Locale): GuideDocument {
  if (kind === "customer") return getCustomerGuideDocument(locale);
  return getWelperGuideDocument(locale);
}
