import type { Locale } from "@/i18n/routing";
import type {
  LegalDocumentKind,
  LegalPolicyDocument,
  LegalPrivacyDocument,
  LegalTermsDocument,
} from "./types";
import cancellationEn from "@/content/legal/cancellation.en.json";
import cancellationFr from "@/content/legal/cancellation.fr.json";
import privacyEn from "@/content/legal/privacy.en.json";
import privacyFr from "@/content/legal/privacy.fr.json";
import refundEn from "@/content/legal/refund.en.json";
import refundFr from "@/content/legal/refund.fr.json";
import codeOfConductEn from "@/content/legal/code-of-conduct.en.json";
import codeOfConductFr from "@/content/legal/code-of-conduct.fr.json";
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

const refundByLocale: Record<Locale, LegalPolicyDocument> = {
  en: refundEn as LegalPolicyDocument,
  fr: refundFr as LegalPolicyDocument,
};

const cancellationByLocale: Record<Locale, LegalPolicyDocument> = {
  en: cancellationEn as LegalPolicyDocument,
  fr: cancellationFr as LegalPolicyDocument,
};

const codeOfConductByLocale: Record<Locale, LegalTermsDocument> = {
  en: codeOfConductEn as LegalTermsDocument,
  fr: codeOfConductFr as LegalTermsDocument,
};

export function getPrivacyDocument(locale: Locale): LegalPrivacyDocument {
  return privacyByLocale[locale] ?? privacyByLocale.en;
}

export function getTermsDocument(locale: Locale): LegalTermsDocument {
  return termsByLocale[locale] ?? termsByLocale.en;
}

export function getRefundPolicyDocument(locale: Locale): LegalPolicyDocument {
  return refundByLocale[locale] ?? refundByLocale.en;
}

export function getCancellationPolicyDocument(locale: Locale): LegalPolicyDocument {
  return cancellationByLocale[locale] ?? cancellationByLocale.en;
}

export function getCodeOfConductDocument(locale: Locale): LegalTermsDocument {
  return codeOfConductByLocale[locale] ?? codeOfConductByLocale.en;
}

export function getLegalDocument(
  kind: "privacy",
  locale: Locale,
): LegalPrivacyDocument;
export function getLegalDocument(kind: "terms", locale: Locale): LegalTermsDocument;
export function getLegalDocument(kind: "refund", locale: Locale): LegalPolicyDocument;
export function getLegalDocument(
  kind: "cancellation",
  locale: Locale,
): LegalPolicyDocument;
export function getLegalDocument(kind: "codeOfConduct", locale: Locale): LegalTermsDocument;
export function getLegalDocument(kind: LegalDocumentKind, locale: Locale) {
  if (kind === "privacy") return getPrivacyDocument(locale);
  if (kind === "terms") return getTermsDocument(locale);
  if (kind === "refund") return getRefundPolicyDocument(locale);
  if (kind === "cancellation") return getCancellationPolicyDocument(locale);
  return getCodeOfConductDocument(locale);
}
