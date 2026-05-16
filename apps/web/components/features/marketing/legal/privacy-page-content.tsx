import { getLocale } from "next-intl/server";
import { getPrivacyDocument } from "@/lib/legal/get-legal-document";
import type { Locale } from "@/i18n/routing";
import { LegalPrivacyDocumentView } from "./legal-document-page";

export async function PrivacyPageContent({ locale: localeProp }: { locale?: Locale } = {}) {
  const locale = localeProp ?? ((await getLocale()) as Locale);
  const doc = getPrivacyDocument(locale);

  return (
    <LegalPrivacyDocumentView
      title={doc.hero.title}
      subtitle={doc.hero.subtitle}
      sections={doc.sections}
    />
  );
}

export async function getPrivacyMetadata(locale?: Locale) {
  const resolved = locale ?? ((await getLocale()) as Locale);
  return getPrivacyDocument(resolved).meta;
}
