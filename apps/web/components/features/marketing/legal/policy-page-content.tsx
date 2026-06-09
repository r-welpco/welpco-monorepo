import { getLocale } from "next-intl/server";
import {
  getCancellationPolicyDocument,
  getRefundPolicyDocument,
} from "@/lib/legal/get-legal-document";
import type { Locale } from "@/i18n/routing";
import { LegalPolicyDocumentView } from "./legal-document-page";

type PolicyKind = "refund" | "cancellation";

function getPolicyDocument(kind: PolicyKind, locale: Locale) {
  return kind === "refund"
    ? getRefundPolicyDocument(locale)
    : getCancellationPolicyDocument(locale);
}

export async function PolicyPageContent({
  kind,
  locale: localeProp,
}: {
  kind: PolicyKind;
  locale?: Locale;
}) {
  const locale = localeProp ?? ((await getLocale()) as Locale);
  const doc = getPolicyDocument(kind, locale);

  return (
    <LegalPolicyDocumentView
      title={doc.hero.title}
      subtitle={doc.hero.subtitle}
      paragraphs={doc.paragraphs}
    />
  );
}

export async function getPolicyMetadata(kind: PolicyKind, locale?: Locale) {
  const resolved = locale ?? ((await getLocale()) as Locale);
  return getPolicyDocument(kind, resolved).meta;
}
