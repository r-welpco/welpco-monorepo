import type { Locale } from "@/i18n/routing";
import type {
  LegalDocumentKind,
  LegalPrivacyDocument,
  LegalTermsDocument,
} from "./types";
import privacyEn from "@/content/legal/privacy.en.json";
import privacyFr from "@/content/legal/privacy.fr.json";
import termsEn from "@/content/legal/terms.en.json";
import termsFr from "@/content/legal/terms.fr.json";

const privacyByLocale: Record<Locale, LegalPrivacyDocument> = {
  en: privacyEn as LegalPrivacyDocument,
  fr: privacyFr as LegalPrivacyDocument,
};

const termsByLocale: Record<Locale, LegalTermsDocument> = {
  en: termsEn as LegalTermsDocument,
  fr: termsFr as LegalTermsDocument,
};

export function getPrivacyDocument(locale: Locale): LegalPrivacyDocument {
  return privacyByLocale[locale] ?? privacyByLocale.en;
}

export function getTermsDocument(locale: Locale): LegalTermsDocument {
  return termsByLocale[locale] ?? termsByLocale.en;
}

export function getLegalDocument(
  kind: "privacy",
  locale: Locale,
): LegalPrivacyDocument;
export function getLegalDocument(kind: "terms", locale: Locale): LegalTermsDocument;
export function getLegalDocument(kind: LegalDocumentKind, locale: Locale) {
  return kind === "privacy" ? getPrivacyDocument(locale) : getTermsDocument(locale);
}
